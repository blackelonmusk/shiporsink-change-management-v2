import { Toaster } from 'react-hot-toast'
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react'

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: '#1F2937',
          color: '#fff',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxWidth: '400px',
        },
        
        // Success toasts
        success: {
          duration: 3000,
          style: {
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10B981',
          },
          icon: <CheckCircle2 className="w-5 h-5" />,
        },
        
        // Error toasts
        error: {
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#EF4444',
          },
          icon: <XCircle className="w-5 h-5" />,
        },
        
        // Loading toasts
        loading: {
          style: {
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        },
      }}
    />
  )
}
