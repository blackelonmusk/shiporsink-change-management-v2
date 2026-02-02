'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LogOut } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <header className="bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push('/dashboard')}
        >
          <img src="/change-logo.png" alt="Ship or Sink" className="w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">Ship or Sink</h1>
            <p className="text-xs text-zinc-500">AI Change Management Assistant</p>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-zinc-400 text-sm hidden sm:block">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-zinc-400 hover:text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
