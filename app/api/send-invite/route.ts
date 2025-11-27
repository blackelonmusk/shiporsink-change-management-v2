import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { to, inviterName, projectName, projectUrl } = await request.json()

  if (!to || !projectName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ship or Sink <onboarding@resend.dev>',
        to: [to],
        subject: `You've been invited to collaborate on "${projectName}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🚢 Ship or Sink</h1>
              <p style="color: #93c5fd; margin: 10px 0 0 0;">AI Change Management Assistant</p>
            </div>
            
            <div style="padding: 40px; background: #f9fafb;">
              <h2 style="color: #1f2937; margin-top: 0;">You've been invited!</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName || 'A team member'}</strong> has invited you to collaborate on the change management project:
              </p>
              
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 10px 0;">${projectName}</h3>
                <p style="color: #6b7280; margin: 0; font-size: 14px;">Change Management Project</p>
              </div>
              
              <a href="${projectUrl || 'https://shiporsink-change-management-v2-new.vercel.app'}" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; 
                        text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
                View Project
              </a>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Don't have an account yet? You'll be prompted to sign up when you click the link above.
              </p>
            </div>
            
            <div style="padding: 20px; text-align: center; background: #1f2937;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                Sent by Ship or Sink • AI Change Management Assistant
              </p>
            </div>
          </div>
        `,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Resend error:', data)
      return NextResponse.json({ error: data.message || 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
