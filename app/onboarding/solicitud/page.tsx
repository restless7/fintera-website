import { ServiceRequestWorkspace } from "@/components/customer-onboarding/ServiceRequestWorkspace";

export const metadata = {
  title: "Confirma tu solicitud de servicio | FINTERA",
};
export default async function ServiceRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ requestId?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Tu solicitud de servicio financiero
      </h1>
      <p className="mb-7 mt-4 max-w-2xl leading-relaxed text-slate-600">
        Revisa tus datos y expresa por separado la solicitud de servicio y tu
        autorización de tratamiento.
      </p>
      <ServiceRequestWorkspace requestedId={params.requestId} />
    </>
  );
}
