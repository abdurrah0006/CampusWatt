import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

export function PageContainer({ title, description, actions, children }) {
  useDocumentTitle(title);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-ink-secondary">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {/* Content */}
      <div className="animate-fade-in space-y-6">{children}</div>
    </div>
  );
}
