import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Change - AI Change Management Assistant'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#18181b',
          backgroundImage: 'radial-gradient(circle at 25% 25%, #f97316 0%, transparent 50%), radial-gradient(circle at 75% 75%, #ea580c 0%, transparent 50%)',
        }}
      >
        {/* Card container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(24, 24, 27, 0.9)',
            borderRadius: '24px',
            border: '2px solid #f97316',
            padding: '60px 80px',
            boxShadow: '0 0 100px rgba(249, 115, 22, 0.3)',
          }}
        >
          {/* Logo/Icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100px',
              height: '100px',
              backgroundColor: '#f97316',
              borderRadius: '20px',
              marginBottom: '30px',
            }}
          >
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '10px',
              }}
            >
              Change
            </span>
            <span
              style={{
                fontSize: '32px',
                color: '#f97316',
                fontWeight: '600',
              }}
            >
              AI Change Management Assistant
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              display: 'flex',
              marginTop: '30px',
              gap: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(249, 115, 22, 0.2)',
                padding: '10px 20px',
                borderRadius: '30px',
                color: '#fdba74',
                fontSize: '20px',
              }}
            >
              ✓ ADKAR Coaching
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(249, 115, 22, 0.2)',
                padding: '10px 20px',
                borderRadius: '30px',
                color: '#fdba74',
                fontSize: '20px',
              }}
            >
              ✓ Stakeholder Tracking
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(249, 115, 22, 0.2)',
                padding: '10px 20px',
                borderRadius: '30px',
                color: '#fdba74',
                fontSize: '20px',
              }}
            >
              ✓ Free
            </div>
          </div>

          {/* Ship or Sink branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '40px',
              color: '#71717a',
              fontSize: '18px',
            }}
          >
            Part of the Ship or Sink Business Suite
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
