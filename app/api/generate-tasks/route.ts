import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireProjectAccess } from '@/lib/auth';
import { withAuth, readJsonBody, badRequest, unwrap } from '@/lib/api-utils';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// GET - Fetch boards for dropdown
export const GET = withAuth('GET /api/generate-tasks', async () => {
  const boards = unwrap<Record<string, any>[]>(
    'select boards',
    await supabaseAdmin
      .from('boards')
      .select('id, name, workspace:workspaces(name)')
      .order('name')
  );

  const mapped = (boards || []).map((b) => ({
    id: b.id,
    name: b.name,
    workspaceName: b.workspace?.name || 'No Workspace',
    displayName: b.workspace?.name ? `${b.workspace.name} / ${b.name}` : b.name,
  }));

  return NextResponse.json({ success: true, boards: mapped });
});

export const POST = withAuth(
  'POST /api/generate-tasks',
  async ({ request, user }) => {
    const body = await readJsonBody<Record<string, any>>(request);
    const {
      projectId,
      projectName,
      projectStatus,
      stakeholders,
      milestones,
      riskLevel,
      engagementLevel,
    } = body;

    if (!projectId || !projectName) {
      throw badRequest('projectId and projectName are required');
    }

    await requireProjectAccess(user.id, projectId);

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[POST /api/generate-tasks] ANTHROPIC_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 500 }
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
    let responseText: string;

    try {
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

      responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    } catch (error) {
      // An upstream AI failure is not this service being broken.
      console.error('[POST /api/generate-tasks] Anthropic request failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to generate tasks' },
        { status: 502 }
      );
    }

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
  }
);

// Create selected tasks in Tick PM
export const PUT = withAuth(
  'PUT /api/generate-tasks',
  async ({ request, user }) => {
    const body = await readJsonBody<Record<string, any>>(request);
    const { tasks, projectId, projectName, boardId } = body;

    if (!tasks?.length || !boardId) {
      throw badRequest('Missing required fields (tasks or boardId)');
    }

    // Only link tasks back to a project the caller actually owns.
    if (projectId) {
      await requireProjectAccess(user.id, projectId);
    }

    // Get the next task number for this board
    const maxTask = unwrap<{ task_number: number | null }>(
      'select tasks for next task_number',
      await supabaseAdmin
        .from('tasks')
        .select('task_number')
        .eq('board_id', boardId)
        .order('task_number', { ascending: false })
        .limit(1)
        .maybeSingle()
    );

    let nextTaskNumber = (maxTask?.task_number || 0) + 1;

    // Create tasks
    const createdTasks = [];
    const errors: string[] = [];

    for (const task of tasks) {
      const taskData: Record<string, unknown> = {
        title: task.title,
        description: `${task.description}\n\n---\n📁 From Change Project: ${projectName}\n🏷️ Category: ${task.category}`,
        board_id: boardId,
        status: 'todo',
        task_number: nextTaskNumber++,
        created_by: user.id,
      };

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) {
        console.error('[PUT /api/generate-tasks] task insert failed:', error);
        errors.push(error.message);
        continue;
      }

      if (!data) continue;

      createdTasks.push(data);

      // Create suite_link to connect task to change project
      if (projectId) {
        const { error: linkError } = await supabaseAdmin
          .from('suite_links')
          .insert({
            source_app: 'change',
            source_type: 'project',
            source_id: projectId,
            target_app: 'tick',
            target_type: 'task',
            target_id: data.id,
            target_title: task.title,
            created_by: user.id,
          });

        if (linkError) {
          console.error(
            '[PUT /api/generate-tasks] suite_link insert failed (non-fatal):',
            linkError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      createdTasks,
      count: createdTasks.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  }
);
