'use client';

import { BarChart3, Zap, FolderOpen } from 'lucide-react';

type AppId = 'hub' | 'vault' | 'okr' | 'tick' | 'change';

interface SuiteAppsProps {
  currentApp: AppId;
}

function HubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="url(#hub-gradient)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="hub-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

const suiteApps = [
  {
    id: 'hub' as AppId,
    name: 'The Hub',
    icon: HubIcon,
    href: 'https://hub.shiporsink.ai',
    color: undefined,
  },
  {
    id: 'vault' as AppId,
    name: 'Vault',
    icon: FolderOpen,
    href: 'https://vault.shiporsink.ai',
    color: '#a855f7', // purple
  },
  {
    id: 'okr' as AppId,
    name: 'OKR Dashboard',
    icon: BarChart3,
    href: 'https://okr.shiporsink.ai',
    color: '#06b6d4', // cyan
  },
  {
    id: 'tick' as AppId,
    name: 'Tick PM',
    icon: Zap,
    href: 'https://tick.shiporsink.ai',
    color: '#10b981', // emerald
  },
];

export function SuiteApps({ currentApp }: SuiteAppsProps) {
  return (
    <div className="px-3 py-4 border-t border-zinc-800">
      <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Suite Apps
      </h3>
      <nav className="space-y-1">
        {suiteApps
          .filter((app) => app.id !== currentApp)
          .map((app) => {
            const Icon = app.icon;
            return (
              <a
                key={app.id}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors group"
              >
                <Icon
                  className="w-4 h-4 transition-colors"
                  {...(app.color ? { style: { color: app.color } } : {})}
                />
                <span>{app.name}</span>
                <svg
                  className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            );
          })}
      </nav>
    </div>
  );
}
