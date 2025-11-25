import Link from 'next/link'
import { Ship } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">
              Part of the{' '}
              <a 
                href="https://shiporsink.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                Ship or Sink
              </a>
              {' '}challenge
            </span>
          </div>
          <div className="text-gray-500 text-sm">
            Built by{' '}
            <a 
              href="https://linkedin.com/in/therealbrandonmann" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              Brandon Mann
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
