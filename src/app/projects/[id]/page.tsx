import { projects } from "@/lib/mock-data";
import ProjectDetailContent from "./ProjectDetailContent";

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return <ProjectDetailContent id={params.id} />;
}
