import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, unwrap, unwrapRequired } from '@/lib/api-utils'

type Params = { category: string }

/**
 * GET template details with stakeholders and milestones.
 *
 * This route previously authenticated via cookies (createRouteHandlerClient +
 * getSession) rather than the Bearer token used everywhere else, and its
 * catch-all turned a stale session into a 500. It now uses the same
 * service-role verification as the rest of the API.
 */
export const GET = withAuth<Params>(
  'GET /api/templates/[category]',
  async ({ params }) => {
    const template = unwrapRequired<{ id: string }>(
      'select templates',
      await supabaseAdmin
        .from('templates')
        .select('*')
        .eq('category', params.category)
        .maybeSingle(),
      'Template not found'
    )

    const stakeholders = unwrap(
      'select template_stakeholders',
      await supabaseAdmin
        .from('template_stakeholders')
        .select('*')
        .eq('template_id', template.id)
        .order('sort_order', { ascending: true })
    )

    const milestones = unwrap(
      'select template_milestones',
      await supabaseAdmin
        .from('template_milestones')
        .select('*')
        .eq('template_id', template.id)
        .order('sort_order', { ascending: true })
    )

    return NextResponse.json({
      template,
      stakeholders: stakeholders ?? [],
      milestones: milestones ?? [],
    })
  }
)
