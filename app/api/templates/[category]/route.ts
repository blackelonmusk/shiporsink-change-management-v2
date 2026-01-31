import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET template details with stakeholders and milestones
export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const supabaseAuth = createRouteHandlerClient({ cookies })

    const {
      data: { session },
    } = await supabaseAuth.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('templates')
      .select('*')
      .eq('category', params.category)
      .single()

    if (templateError) throw templateError

    // Fetch template stakeholders
    const { data: stakeholders, error: stakeholdersError } = await supabaseAdmin
      .from('template_stakeholders')
      .select('*')
      .eq('template_id', template.id)
      .order('sort_order', { ascending: true })

    if (stakeholdersError) throw stakeholdersError

    // Fetch template milestones
    const { data: milestones, error: milestonesError } = await supabaseAdmin
      .from('template_milestones')
      .select('*')
      .eq('template_id', template.id)
      .order('sort_order', { ascending: true })

    if (milestonesError) throw milestonesError

    return NextResponse.json({
      template,
      stakeholders,
      milestones
    })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}
