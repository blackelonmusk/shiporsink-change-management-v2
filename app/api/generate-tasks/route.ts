import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Use service role for server-side operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch boards for dropdown
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('boards')
      .select('id, name, workspace:workspaces(name)')
      .order('name');

    if (error) {
      console.error('Fetch boards error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const boards = (data || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      workspaceName: b.workspace?.name || 'No Workspace',
      displayName: b.workspace?.name ? `${b.workspace.name} / ${b.name}` : b.name,
    }));

    return NextResponse.json({ success: true, boards });
  } catch (error) {
    console.error('Fetch boards error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch boards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      projectId,
      projectName, 
      projectStatus,
      stakeholders,
      milestones,
      riskLevel,
      engagementLevel,
    } = await request.json();

    if (!projectId || !projectName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build stakeholder summary
    const stakeholderSummary = stakeholders?.length > 0 
      ? stakeholders.map((s: any) => {
          const adkarAvg = Math.round(
            ((s.awareness_score || 50) + 
             (s.desire_score || 50) + 
             (s.knowledge_score || 50) + 
             (s.ability_score || 50) + 
             (s.reinforcement_score || 50)) / 5
          );
          return `- ${s.name} (${s.role || 'No role'}): ${s.stakeholder_type || 'neutral'} type, ADKAR avg: ${adkarAvg}%`;
        }).join('\n')
      : 'No stakeholders defined yet';

    // Build milestone summary
    const milestoneSummary = milestones?.length > 0
      ? milestones.map((m: any) => `- ${m.name}: ${m.date} (${m.status || 'pending'})`).join('\n')
      : 'No milestones defined yet';

    // Generate task suggestions using Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: `You are a Change Management expert helping create actionable tasks for a change initiative.

## Change Project Context
**Project Name:** ${projectName}
**Status:** ${projectStatus || 'active'}
**Risk Level:** ${riskLevel || 0}%
**Overall Engagement:** ${engagementLevel || 0}%

## Stakeholders
${stakeholderSummary}

## Milestones
${milestoneSummary}

## Your Task
Generate 5-8 specific, actionable tasks that would help drive this change initiative forward. Consider:
- Stakeholder engagement activities (especially for skeptics/resistant stakeholders)
- Communication planning
- Training and knowledge transfer
- Risk mitigation
- Milestone preparation
- ADKAR-focused interventions (Awareness, Desire, Knowledge, Ability, Reinforcement)

Each task should be:
- Concrete and actionable (starts with a verb)
- Achievable in 1-7 days
- Directly supporting change adoption
- Specific enough to know when it's done

## Output Format
Respond with a JSON array of task objects:
{
  "tasks": [
    {
      "title": "Task title starting with action verb",
      "description": "Brief 1-2 sentence description with specific details",
      "priority": "high" | "medium" | "low",
      "estimatedDays": 1-7,
      "category": "communication" | "training" | "stakeholder" | "planning" | "risk" | "milestone"
    }
  ]
}

Only respond with the JSON, no other text.`
      }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Parse the AI response
    let tasks;
    try {
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      const parsed = JSON.parse(jsonStr);
      tasks = parsed.tasks || parsed;
    } catch {
      tasks = [{
        title: `Create change management plan for ${projectName}`,
        description: 'Develop comprehensive change strategy',
        priority: 'high',
        estimatedDays: 5,
        category: 'planning'
      }];
    }

    return NextResponse.json({
      success: true,
      tasks,
      projectId,
      projectName,
    });

  } catch (error) {
    console.error('Generate tasks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate tasks' },
      { status: 500 }
    );
  }
}

// Create selected tasks in Tick PM
export async function PUT(request: NextRequest) {
  try {
    const { tasks, projectId, projectName, boardId, userId } = await request.json();

    console.log('PUT /api/generate-tasks received:', { 
      tasksCount: tasks?.length, 
      projectId, 
      projectName, 
      boardId, 
      userId 
    });

    if (!tasks?.length || !boardId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (tasks or boardId)' },
        { status: 400 }
      );
    }

    // Get the next task number for this board
    const { data: maxTask } = await supabaseAdmin
      .from('tasks')
      .select('task_number')
      .eq('board_id', boardId)
      .order('task_number', { ascending: false })
      .limit(1)
      .single();

    let nextTaskNumber = (maxTask?.task_number || 0) + 1;

    // Create tasks
    const createdTasks = [];
    const errors = [];
    for (const task of tasks) {
      const taskData: any = {
        title: task.title,
        description: `${task.description}\n\n---\n📁 From Change Project: ${projectName}\n🏷️ Category: ${task.category}`,
        board_id: boardId,
        status: 'todo',
        task_number: nextTaskNumber++,
      };
      
      // Only add created_by if userId is provided
      if (userId) {
        taskData.created_by = userId;
      }
      
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) {
        console.error('Task insert error:', error);
        errors.push(error.message);
      }

      if (data && !error) {
        createdTasks.push(data);
        
        // Create suite_link to connect task to change project
        if (projectId) {
          const linkData: any = {
            source_app: 'change',
            source_type: 'project',
            source_id: projectId,
            target_app: 'tick',
            target_type: 'task',
            target_id: data.id,
            target_title: task.title,
          };
          if (userId) {
            linkData.created_by = userId;
          }
          await supabaseAdmin.from('suite_links').insert(linkData);
        }
      }
    }

    return NextResponse.json({
      success: true,
      createdTasks,
      count: createdTasks.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Create tasks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tasks' },
      { status: 500 }
    );
  }
}
