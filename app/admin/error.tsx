"use client";
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="admin-page"><div className="admin-card" role="alert"><h2 className="text-lg font-semibold text-white">No pudimos cargar esta vista</h2><p className="mt-2 text-sm text-slate-300">Intenta cargarla de nuevo. Si el problema continúa, contacta con la administración.</p><button className="admin-button mt-4" onClick={reset}>Volver a intentar</button></div></div>;
}
