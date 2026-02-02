'use client';

type AppId = 'hub' | 'vault' | 'okr' | 'tick' | 'change';

interface SuiteAppsProps {
  currentApp: AppId;
}

const suiteApps = [
  {
    id: 'hub' as AppId,
    name: 'The Hub',
    logo: '/hub-logo.png',
    href: 'https://hub.shiporsink.ai',
  },
  {
    id: 'vault' as AppId,
    name: 'Vault',
    logo: '/vault-logo.png',
    href: 'https://vault.shiporsink.ai',
  },
  {
    id: 'okr' as AppId,
    name: 'OKR Dashboard',
    logo: '/okr-logo.png',
    href: 'https://okr.shiporsink.ai',
  },
  {
    id: 'tick' as AppId,
    name: 'Tick PM',
    logo: '/tick-logo.png',
    href: 'https://tick.shiporsink.ai',
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
          .map((app) => (
            <a
              key={app.id}
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors group"
            >
              <img
                src={app.logo}
                alt={app.name}
                className="w-5 h-5"
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
          ))}
      </nav>
    </div>
  );
}
