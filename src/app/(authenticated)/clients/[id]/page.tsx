import ClientDetailContent from "./ClientDetailContent";

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  return <ClientDetailContent id={params.id} />;
}
