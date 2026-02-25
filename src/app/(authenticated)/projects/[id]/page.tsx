import ProjectDetailContent from "./ProjectDetailContent";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return <ProjectDetailContent id={params.id} />;
}
