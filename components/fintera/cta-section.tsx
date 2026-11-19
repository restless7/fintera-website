import Link from "next/link";

export default function CTASection() {
  return (
    <section className="bg-blue-900 px-4 py-16 text-white sm:px-6">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-100">
          Tu próximo paso con FINTERA
        </p>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
          Inicia tu solicitud y continúa desde tu cuenta
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-blue-100">
          Registra lo esencial, revisa tu solicitud de servicio y consulta el
          estado en tu portal. La evaluación y aprobación del crédito
          corresponden a la entidad financiera.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/solicitar"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-blue-900"
          >
            Iniciar una solicitud
          </Link>
          <Link
            href="/portal"
            className="rounded-xl border border-blue-200 px-6 py-3 font-semibold text-white"
          >
            Ya tengo cuenta · Mi portal
          </Link>
        </div>
      </div>
    </section>
  );
}
