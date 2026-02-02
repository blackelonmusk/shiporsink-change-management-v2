import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2">
          <img src="/favicon.png" alt="Ship or Sink" className="w-5 h-5" />
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
      </div>
    </footer>
  )
}
