"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { ProfileForm } from "@/components/admin/forms/ProfileForm";

export default function AdminProfilePage() {
  const { token } = useAdminSession();
  const profile = useQuery(api.profile.get, {});
  const upsert = useMutation(api.profile.upsert);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!token || profile === undefined) return <p>Loading…</p>;

  return (
    <div>
      <h1 className="font-heading text-2xl text-ink">Profile</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Shown at the top of the home page.
      </p>
      <div className="mt-6">
        <ProfileForm
          initial={
            profile
              ? {
                  name: profile.name,
                  title: profile.title ?? "",
                  bio: profile.bio ?? "",
                  linkedinUrl: profile.linkedinUrl ?? "",
                  githubUrl: profile.githubUrl ?? "",
                  letterboxdUrl: profile.letterboxdUrl ?? "",
                  tiktokUrl: profile.tiktokUrl ?? "",
                  mediumUrl: profile.mediumUrl ?? "",
                }
              : undefined
          }
          submitting={submitting}
          onSubmit={async (values) => {
            setSubmitting(true);
            setFormError(null);
            try {
              await upsert({ token, ...values });
            } catch (e) {
              setFormError(e instanceof Error ? e.message : "Couldn't save.");
            } finally {
              setSubmitting(false);
            }
          }}
        />
        {formError && (
          <p className="mt-3 max-w-md text-sm text-accent">{formError}</p>
        )}
      </div>
    </div>
  );
}
