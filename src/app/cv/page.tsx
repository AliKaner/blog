import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { ResumeSection } from "@/components/profile/ResumeSection";

export default async function CvPage() {
  const resumeItems = await fetchQuery(api.resumeItems.list, {});

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">CV</h1>
      <div className="mt-6">
        <ResumeSection items={resumeItems} />
      </div>
    </div>
  );
}
