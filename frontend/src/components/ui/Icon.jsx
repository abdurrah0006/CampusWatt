const ICON_SIZES = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function Icon({ icon: IconShape, size = 'md', className = '', label }) {
  if (!IconShape) return null;
  const pixelSize = ICON_SIZES[size] || ICON_SIZES.md;
  const accessibilityProps = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };

  return (
    <IconShape
      size={pixelSize}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      color="currentColor"
      className={`shrink-0 ${className}`}
      {...accessibilityProps}
    />
  );
}
