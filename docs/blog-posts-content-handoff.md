# Blog post content handoff format

This describes the format to hand off blog post drafts to this site
(alikaner's blog, Next.js + Convex). Write one `.md` file per post; each
file becomes one row in the Convex `posts` table.

## File naming

`<slug>.md` — the slug is also the URL: `alikaner.dev/posts/<slug>`.

- lowercase, words separated by hyphens (`my-first-post.md`)
- must be unique across all posts

## Frontmatter

Each file starts with YAML frontmatter, then the post body below it:

```md
---
title: "My First Post"
slug: my-first-post
publishedAt: 2026-09-27
published: false
---

Body content starts here...
```

| Field         | Type    | Required | Notes                                                                 |
| ------------- | ------- | -------- | ---------------------------------------------------------------------- |
| `title`       | string  | yes      | Display title                                                          |
| `slug`        | string  | yes      | Must match the filename (minus `.md`), kebab-case, URL-safe            |
| `publishedAt` | date    | yes      | `YYYY-MM-DD`. Controls sort order on the site (newest first)           |
| `published`   | boolean | no       | Defaults to `false` (draft). Set `true` only when it should go live    |

## Body

Standard Markdown, rendered with `react-markdown` + `remark-gfm` +
`rehype-highlight`. Supported:

- headings, paragraphs, lists (ordered/unordered), blockquotes
- **bold**, _italic_, ~~strikethrough~~
- tables (GFM)
- task lists (`- [ ]` / `- [x]`)
- autolinked URLs
- fenced code blocks with a language tag get syntax highlighting, e.g.:

  ````md
  ```ts
  export const hello = () => "world";
  ```
  ````

- inline `` `code` ``
- Markdown images (`![alt](https://...)`) — only for images already
  hosted somewhere with a public URL. See the note on cover images below.

## What this format does NOT cover

- **Cover image**: each post can have one, but it must be uploaded as a
  file through the site's admin panel (`/admin/posts`) — Convex file
  storage needs an actual upload, not a URL, so a frontmatter field
  can't carry it. Mention in the file (as a comment or a note at the very
  top of the body) if a post should have a cover image and where to find
  the source image; the cover gets attached on the admin side.
- Any custom HTML/JSX — plain Markdown only.

## Delivery

Drop the finished `.md` files in a single folder and hand that folder
(or its contents) back. They get imported into Convex — via the admin
UI or a small import script — one row per file, `body` set to
everything below the frontmatter delimiter.
