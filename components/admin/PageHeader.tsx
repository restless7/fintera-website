import type { ReactNode } from "react";

export function PageHeader({ title, description, eyebrow, actions, metadata }: { title: string; description?: string; eyebrow?: string; actions?: ReactNode; metadata?: ReactNode }) {
  return <header className="admin-page-header">
    <div className="min-w-0">
      {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="admin-page-description">{description}</p>}
      {metadata && <div className="mt-3 flex flex-wrap items-center gap-2">{metadata}</div>}
    </div>
    {actions && <div className="admin-header-actions">{actions}</div>}
  </header>;
}
