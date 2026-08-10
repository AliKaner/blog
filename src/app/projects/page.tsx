import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { ProjectsGrid } from "@/components/projects/ProjectsGrid";

export default async function ProjectsPage() {
  const projects = await fetchQuery(api.projects.list, {});

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Personal Projects</h1>
      <div className="mt-8">
        {projects.length === 0 ? (
          <p className="text-ink-soft">No projects yet.</p>
        ) : (
          <ProjectsGrid projects={projects} />
        )}
      </div>
    </div>
  );
}
