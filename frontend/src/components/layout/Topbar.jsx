import { Menu, RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useDataRefresh } from '../../context/DataRefreshContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { healthApi } from '../../api/endpoints.js';
import { Icon } from '../ui/Icon.jsx';
import { IconButton } from '../ui/IconButton.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { LiveClock } from './LiveClock.jsx';
import { DataFreshness } from './DataFreshness.jsx';
import { APP_NAME, MANAGE_ITEMS, NAV_ITEMS } from '../../utils/constants.js';

// Helpers
function findPageLabel(pathname) {
  const mainItem = NAV_ITEMS.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)));
  if (mainItem) return mainItem.label;
  const manageItem = MANAGE_ITEMS.find((item) => pathname.startsWith(item.to));
  if (manageItem) return `Manage ${manageItem.label}`;
  return null;
}

function getStaleReason(health, healthError) {
  if (healthError && !health) return 'API offline';
  if (health?.dataSource === 'json') return 'Offline dataset';
  return null;
}

// Component
export function Topbar({ onMenu }) {
  const { refresh, isRefreshing } = useDataRefresh();
  const { data: health, error: healthError } = useApi(() => healthApi.get(), []);
  const { pathname } = useLocation();
  const pageLabel = findPageLabel(pathname);
  const staleReason = getStaleReason(health, healthError);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas">
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="flex min-w-0 items-center gap-2">
          <IconButton icon={Menu} label="Open menu" onClick={onMenu} className="-ml-2 lg:hidden" />
          <p className="hidden truncate text-[15px] font-semibold text-ink-primary sm:block">
            {APP_NAME}
            {pageLabel && <span className="font-normal text-ink-muted"> / {pageLabel}</span>}
          </p>
        </div>

        {/* Clock */}
        <div className="flex justify-center">
          <LiveClock />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <DataFreshness isStale={Boolean(staleReason)} staleReason={staleReason} />
          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-ink-primary transition hover:bg-elevated disabled:cursor-wait"
            aria-label="Refresh data"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}><Icon icon={RefreshCw} size="sm" /></span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
