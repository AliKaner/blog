"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { dateToInputValue, inputValueToDate, slugify } from "@/lib/format";

export type CocktailFormValues = {
  title: string;
  slug: string;
  baseSpirit: string;
  ingredients: string;
  rating: string;
  review: string;
  imageStorageId: string | undefined;
  triedAt: string;
  published: boolean;
};

const EMPTY: CocktailFormValues = {
  title: "",
  slug: "",
  baseSpirit: "",
  ingredients: "",
  rating: "",
  review: "",
  imageStorageId: undefined,
  triedAt: dateToInputValue(Date.now()),
  published: false,
};

export function CocktailForm({
  initial,
  existingImageUrl,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<CocktailFormValues>;
  existingImageUrl?: string | null;
  onSubmit: (values: {
    title: string;
    slug: string;
    baseSpirit?: string;
    ingredients?: string[];
    rating?: number;
    review?: string;
    imageStorageId?: string;
    triedAt: number;
    published: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<CocktailFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);

  function set<K extends keyof CocktailFormValues>(
    key: K,
    val: CocktailFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ingredients = values.ingredients
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    await onSubmit({
      title: values.title,
      slug: values.slug,
      baseSpirit: values.baseSpirit || undefined,
      ingredients: ingredients.length > 0 ? ingredients : undefined,
      rating: values.rating ? Number(values.rating) : undefined,
      review: values.review || undefined,
      imageStorageId: values.imageStorageId,
      triedAt: inputValueToDate(values.triedAt),
      published: values.published,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <Field label="Name">
        <input
          required
          value={values.title}
          onChange={(e) => {
            set("title", e.target.value);
            if (!slugTouched) set("slug", slugify(e.target.value));
          }}
          className="input"
        />
      </Field>
      <Field label="Slug">
        <input
          required
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", e.target.value);
          }}
          className="input"
        />
      </Field>
      <Field label="Base spirit (optional)">
        <input
          value={values.baseSpirit}
          onChange={(e) => set("baseSpirit", e.target.value)}
          className="input"
          placeholder="Gin, Rum, Whiskey…"
        />
      </Field>
      <Field label="Ingredients (one per line)">
        <textarea
          rows={5}
          value={values.ingredients}
          onChange={(e) => set("ingredients", e.target.value)}
          className="input font-mono text-sm"
          placeholder={"2oz gin\n1oz lime juice\n0.75oz simple syrup"}
        />
      </Field>
      <Field label="Rating (1-10)">
        <input
          type="number"
          min={1}
          max={10}
          value={values.rating}
          onChange={(e) => set("rating", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Tried on">
        <input
          type="date"
          required
          value={values.triedAt}
          onChange={(e) => set("triedAt", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Tasting notes">
        <textarea
          rows={8}
          value={values.review}
          onChange={(e) => set("review", e.target.value)}
          className="input font-mono text-sm"
        />
      </Field>
      <ImageUploader
        label="Photo"
        value={values.imageStorageId}
        existingUrl={existingImageUrl}
        onChange={(id) => set("imageStorageId", id)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.published}
          onChange={(e) => set("published", e.target.checked)}
        />
        Published
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="btn px-4 py-2 text-sm disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-ink-soft"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-xs uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
