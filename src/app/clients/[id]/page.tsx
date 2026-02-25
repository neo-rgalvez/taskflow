import { clients } from "@/lib/mock-data";
import ClientDetailContent from "./ClientDetailContent";

export function generateStaticParams() {
  return clients.map((c) => ({ id: c.id }));
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  return <ClientDetailContent id={params.id} />;
}
