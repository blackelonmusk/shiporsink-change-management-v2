import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET all milestones for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this project
    const { data: project } = await supabase
      .from('change_projects')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch milestones
    const { data: milestones, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', params.id)
      .order('date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ milestones });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    );
  }
}

// POST create a new milestone
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this project
    const { data: project } = await supabase
      .from('change_projects')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, date, type, status, description } = body;

    // Validate required fields
    if (!name || !date || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create milestone
    const { data: milestone, error } = await supabase
      .from('milestones')
      .insert({
        project_id: params.id,
        name,
        date,
        type,
        status: status || 'upcoming',
        description,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ milestone }, { status: 201 });
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json(
      { error: 'Failed to create milestone' },
      { status: 500 }
    );
  }
}

// PATCH update a milestone
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { milestoneId, ...updates } = body;

    if (!milestoneId) {
      return NextResponse.json(
        { error: 'Milestone ID required' },
        { status: 400 }
      );
    }

    // Verify user has access to this milestone through the project
    const { data: milestone } = await supabase
      .from('milestones')
      .select('id, project_id')
      .eq('id', milestoneId)
      .single();

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const { data: project } = await supabase
      .from('change_projects')
      .select('id')
      .eq('id', milestone.project_id)
      .eq('user_id', session.user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update milestone
    const { data: updatedMilestone, error } = await supabase
      .from('milestones')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ milestone: updatedMilestone });
  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    );
  }
}

// DELETE a milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('milestoneId');

    if (!milestoneId) {
      return NextResponse.json(
        { error: 'Milestone ID required' },
        { status: 400 }
      );
    }

    // Verify user has access to this milestone through the project
    const { data: milestone } = await supabase
      .from('milestones')
      .select('id, project_id')
      .eq('id', milestoneId)
      .single();

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const { data: project } = await supabase
      .from('change_projects')
      .select('id')
      .eq('id', milestone.project_id)
      .eq('user_id', session.user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete milestone
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json(
      { error: 'Failed to delete milestone' },
      { status: 500 }
    );
  }
}
