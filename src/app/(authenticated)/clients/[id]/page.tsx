import ClientDetailContent from "./ClientDetailContent";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  return <ClientDetailContent id={id} />;
}
