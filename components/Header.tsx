'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Ship, LogOut, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<User | null>(null)
  const { theme, toggleTheme } = useTheme()

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
    <header className="bg-gray-800 dark:bg-gray-800 light:bg-white border-b border-gray-700 dark:border-gray-700 light:border-gray-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push('/dashboard')}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Ship className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white dark:text-white light:text-gray-900 transition-colors">Ship or Sink</h1>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-700 dark:bg-gray-700 light:bg-gray-100 text-gray-300 dark:text-gray-300 light:text-gray-600 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-200 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
