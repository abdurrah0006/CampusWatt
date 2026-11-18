import { Lightbulb } from 'lucide-react';
import { Icon } from '../ui/Icon.jsx';
import { APP_NAME } from '../../utils/constants.js';

export function BrandLogo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary">
        <Icon icon={Lightbulb} size="lg" />
      </span>
      <div className="leading-tight">
        <p className="text-[15px] font-bold tracking-tight text-ink-primary">{APP_NAME}</p>
        <p className="text-xs font-medium text-ink-muted">Smart Campus Energy</p>
      </div>
    </div>
  );
}
