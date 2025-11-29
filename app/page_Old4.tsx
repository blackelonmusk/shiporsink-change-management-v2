import Link from 'next/link'
import { Ship } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center px-4">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 rounded-2xl inline-block mb-6">
          <Ship className="w-16 h-16 text-white" />
        </div>
        
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Ship or Sink
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          AI-Powered Change Management Assistant
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Stakeholder Tracking</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rate and manage stakeholder engagement
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Risk Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time project health assessment
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">AI Coaching</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ADKAR-based conversation guidance
            </p>
          </div>
        </div>
        
        <Link
          href="/dashboard"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Get Started
        </Link>
        
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          Part of the <a href="https://shiporsink.ai" className="text-blue-600 hover:underline">Ship or Sink</a> challenge
        </p>
      </div>
    </main>
  )
}
