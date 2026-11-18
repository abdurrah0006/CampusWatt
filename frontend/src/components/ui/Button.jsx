import { forwardRef } from 'react';
import { Spinner } from './Spinner.jsx';
import { Icon } from './Icon.jsx';

const BUTTON_VARIANTS = {
  primary: 'bg-brand-primary text-on-brand hover:bg-brand-hover disabled:opacity-60',
  secondary: 'border border-line bg-surface text-ink-primary hover:bg-elevated disabled:text-ink-muted',
  ghost: 'text-ink-secondary hover:bg-elevated hover:text-ink-primary disabled:text-ink-muted',
  danger: 'bg-danger text-on-danger hover:bg-danger-hover disabled:opacity-60',
};

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-xs gap-2',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon, loading = false, disabled, className = '', children, type = 'button', ...rest },
  ref,
) {
  const variantClass = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
  const sizeClass = BUTTON_SIZES[size] || BUTTON_SIZES.md;
  const iconSize = size === 'sm' ? 'sm' : 'md';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex select-none items-center justify-center rounded-lg font-semibold transition-colors duration-150 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${className}`}
      {...rest}
    >
      {loading && <Spinner size={iconSize === 'sm' ? 16 : 20} />}
      {!loading && icon && <Icon icon={icon} size={iconSize} />}
      {children}
    </button>
  );
});
