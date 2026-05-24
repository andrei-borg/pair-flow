import { getProjectsForUser } from "@/lib/projects";
import { EditorLayoutClient } from "@/components/editor/editor-layout-client";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { myProjects, sharedProjects } = await getProjectsForUser();

  return (
    <EditorLayoutClient myProjects={myProjects} sharedProjects={sharedProjects}>
      {children}
    </EditorLayoutClient>
  );
}
