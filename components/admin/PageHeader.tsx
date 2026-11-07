import type { ReactNode } from "react";
import Image from "next/image";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  metadata,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  metadata?: ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 -top-4 opacity-[0.06] select-none"
      >
        <Image src="/images/shieldlogo.png" width={140} height={140} alt="" unoptimized />
      </div>
      <div className="min-w-0 relative z-10">
        {eyebrow && (
          <p className="admin-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            {eyebrow}
          </p>
        )}
        <h1>{title}</h1>
        {description && <p className="admin-page-description">{description}</p>}
        {metadata && (
          <div className="mt-3 flex flex-wrap items-center gap-2">{metadata}</div>
        )}
      </div>
      {actions && <div className="admin-header-actions relative z-10">{actions}</div>}
    </header>
  );
}
