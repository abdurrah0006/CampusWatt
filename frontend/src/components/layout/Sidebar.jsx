import { NavLink } from 'react-router-dom';
import { FlaskConical, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo.jsx';
import { SidebarLink } from './SidebarLink.jsx';
import { Icon } from '../ui/Icon.jsx';
import { IconButton } from '../ui/IconButton.jsx';
import { MANAGE_ITEMS, NAV_ITEMS } from '../../utils/constants.js';
import { useSettings } from '../../context/SettingsContext.jsx';

export function Sidebar({ open, onClose }) {
  const { tariff, thresholdMultiplier } = useSettings();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-overlay backdrop-blur-sm transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-surface px-4 pb-4 pt-4 transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <BrandLogo />
          <IconButton icon={X} label="Close menu" onClick={onClose} className="lg:hidden" />
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1 space-y-1 overflow-y-auto scrollbar-thin">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Menu</p>
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} to={item.to} label={item.label} icon={item.icon} end={item.end} onNavigate={onClose} />
          ))}
          <p className="px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-ink-muted">Manage</p>
          {MANAGE_ITEMS.map((item) => (
            <SidebarLink key={item.to} to={item.to} label={item.label} icon={item.icon} onNavigate={onClose} />
          ))}
        </nav>

        {/* Assumptions */}
        <div className="rounded-xl border border-line bg-canvas p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Active assumptions</p>
          <dl className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-ink-secondary">Tariff</dt>
              <dd className="tabular font-semibold text-ink-primary">AED {tariff.toFixed(2)}/kWh</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-secondary">Alert limit</dt>
              <dd className="tabular font-semibold text-ink-primary">{Math.round(thresholdMultiplier * 100)}% of threshold</dd>
            </div>
          </dl>
          <NavLink to="/settings" onClick={onClose} className="mt-2 inline-block text-xs font-semibold text-brand-secondary hover:underline">
            Change in Settings →
          </NavLink>
        </div>

        {/* Footer */}
        <div className="mt-3 flex flex-col gap-2 px-1">
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-secondary">
            <Icon icon={FlaskConical} size="sm" />
            Prototype · simulated data
          </span>
          <p className="text-xs text-ink-muted">Liwa University · Hackathon 2026</p>
        </div>
      </aside>
    </>
  );
}
