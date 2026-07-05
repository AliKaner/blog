import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { ResumeSection } from "@/components/profile/ResumeSection";
import { ProjectsSection } from "@/components/profile/ProjectsSection";

export default async function CvPage() {
  const [resumeItems, projects] = await Promise.all([
    fetchQuery(api.resumeItems.list, {}),
    fetchQuery(api.projects.list, {}),
  ]);

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">CV</h1>
      <div className="mt-6">
        <ResumeSection items={resumeItems} />
        <ProjectsSection projects={projects} />
      </div>
    </div>
  );
}
