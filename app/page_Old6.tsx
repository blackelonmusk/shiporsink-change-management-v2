import Link from 'next/link'
import { Zap, Users, TrendingUp, Brain, CheckCircle2, Target } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-600/5 pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <header className="border-b border-zinc-800 backdrop-blur-sm bg-black/50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-black text-xl">
                🔄
              </div>
              <span className="text-xl font-bold">Ship or Sink</span>
            </div>
            <Link
              href="/dashboard"
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold hover:from-orange-600 hover:to-orange-700 transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              Part of Ship or Sink Business Suite
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Change Management.
              </span>
              <br />
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Finally.
              </span>
            </h1>

            {/* Tagline */}
            <p className="text-3xl md:text-4xl font-bold mb-8 text-orange-400">
              Make change stick.
            </p>

            <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Stop fumbling in boardrooms. Get AI-powered coaching that tells you exactly what to say to resistant stakeholders—not just theory, actual phrases ready for your 2pm meeting.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-black font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all hover:scale-105 shadow-lg shadow-orange-500/20"
              >
                Start Your First Project
              </Link>
              <a
                href="https://github.com/therealbrandonmann/shiporsink-change-management"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-semibold text-lg hover:border-zinc-700 transition-all hover:scale-105"
              >
                View on GitHub
              </a>
            </div>

            {/* Social Proof */}
            <p className="text-sm text-zinc-500 mt-8">
              Built by <a href="https://linkedin.com/in/therealbrandonmann" className="text-orange-400 hover:underline">Brandon Mann</a> • PMP, Prosci, SAFe SPC • $5k certification knowledge, free.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/30 transition-all hover:scale-105 group">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Stakeholder Tracking</h3>
              <p className="text-zinc-400 leading-relaxed">
                Visual engagement scores with dynamic gradients. Know WHO to focus on and WHEN—not just "build awareness."
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/30 transition-all hover:scale-105 group">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                <Brain className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">AI Coach</h3>
              <p className="text-zinc-400 leading-relaxed">
                Contextual advice powered by Prosci ADKAR. Get specific phrases for your 2pm CFO meeting—not generic theory.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/30 transition-all hover:scale-105 group">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                <Target className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Milestone Timeline</h3>
              <p className="text-zinc-400 leading-relaxed">
                Track progress with confetti celebrations, overdue warnings, and "TODAY" pulsing indicators.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/30 transition-all hover:scale-105 group">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Risk Analytics</h3>
              <p className="text-zinc-400 leading-relaxed">
                Real-time project health dashboard. See which stakeholders are at risk before they derail your initiative.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/30 transition-all hover:scale-105 group">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                <CheckCircle2 className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Pre-Built Templates</h3>
              <p className="text-zinc-400 leading-relaxed">
                System Rollouts, Process Changes, Org Restructures, Tool Launches—hit the ground running.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/30 transition-all hover:scale-105 group">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Team Collaboration</h3>
              <p className="text-zinc-400 leading-relaxed">
                Invite team members, share executive reports with company branding. Work together, ship faster.
              </p>
            </div>
          </div>
        </section>

        {/* Prosci Comparison */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
                The <span className="text-orange-400">$5,000</span> certification.<br />
                <span className="text-zinc-400">For $0.</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 text-zinc-300">Prosci Teaches:</h3>
                  <ul className="space-y-2 text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span>ADKAR framework</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span>"Build awareness"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span>"Address resistance"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span>"Engage stakeholders"</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4 text-orange-400">This App Gives You:</h3>
                  <ul className="space-y-2 text-zinc-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span>Exact phrases to use</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span>Contextual responses for YOUR CFO</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span>Real-time coaching in the moment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span>Who to talk to and what to say</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Stop fumbling.<br />
              <span className="text-orange-400">Start shipping.</span>
            </h2>
            <p className="text-xl text-zinc-400 mb-8">
              Built in 3 weeks as part of the Ship or Sink challenge. 12 apps in 12 months. This is #4.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-4 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-black font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all hover:scale-105 shadow-lg shadow-orange-500/20"
            >
              Try It Free
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800 py-8">
          <div className="container mx-auto px-4 text-center text-zinc-500 text-sm">
            <p>
              Part of the <a href="https://shiporsink.ai" className="text-orange-400 hover:underline">Ship or Sink Business Suite</a> • 
              Built by <a href="https://linkedin.com/in/therealbrandonmann" className="text-orange-400 hover:underline">Brandon Mann</a> • 
              <a href="https://github.com/therealbrandonmann/shiporsink-change-management" className="text-orange-400 hover:underline ml-1">Source Code</a>
            </p>
          </div>
        </footer>
      </div>
    </main>
  )
}
