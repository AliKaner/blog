"use client";

/**
 * OrbSearch — a search field that rests as a small sealed orb (a lens in a
 * double ring) and slides open into an inscribed line: no box, just italic
 * text over a double rule that draws itself from the left.
 *
 *   - Click or focus the orb → it opens; type to search.
 *   - It stays open while there is text; × clears it.
 *   - Escape clears an empty field and closes it.
 *
 * Self-contained: React 19+, no other dependencies. Styles ship with the
 * component (one hoisted <style>); colours come from `theme`. Controlled
 * (`value` + `onChange`), so debounce or route-sync as you like outside.
 *
 * @example
 *   const [q, setQ] = useState("");
 *   <OrbSearch value={q} onChange={setQ} label="Search films" />
 */

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

export type OrbSearchTheme = {
  /** Lens, ring and rule colour. */
  accent?: string;
  /** Typed text colour. */
  ink?: string;
  /** Placeholder colour. */
  muted?: string;
  /** Orb fill. */
  surface?: string;
};

export type OrbSearchProps = {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name, also the placeholder unless `placeholder` is set. */
  label: string;
  placeholder?: string;
  /** Width when open, any CSS length. Default "16rem". */
  width?: string;
  /** Start open (e.g. when a search is already active). */
  defaultOpen?: boolean;
  theme?: OrbSearchTheme;
  className?: string;
  style?: CSSProperties;
};

function themeVars(theme: OrbSearchTheme | undefined): CSSProperties {
  const vars: Record<string, string> = {};
  if (theme?.accent) vars["--os-accent"] = theme.accent;
  if (theme?.ink) vars["--os-ink"] = theme.ink;
  if (theme?.muted) vars["--os-muted"] = theme.muted;
  if (theme?.surface) vars["--os-surface"] = theme.surface;
  return vars as CSSProperties;
}

export function OrbSearch({
  value,
  onChange,
  label,
  placeholder,
  width = "16rem",
  defaultOpen = false,
  theme,
  className,
  style,
}: OrbSearchProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(defaultOpen);
  const open = focused || value.length > 0;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return;
    if (value) onChange("");
    else inputRef.current?.blur();
  };

  return (
    <div
      className={className ? `os ${className}` : "os"}
      data-open={open}
      style={{ ...themeVars(theme), "--os-width": width, ...style } as CSSProperties}
    >
      <style href="orb-search" precedence="medium">
        {CSS}
      </style>

      {/* The orb doubles as the input's label: clicking it focuses the field. */}
      <label htmlFor={inputId} className="os-orb" title={label}>
        <svg viewBox="0 0 20 20" aria-hidden="true" className="os-lens">
          <circle cx="8.5" cy="8.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12.3 12.3 L16.5 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="os-sr">{label}</span>
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? label}
        aria-label={label}
        className="os-input"
        tabIndex={0}
      />

      {value && (
        <button
          type="button"
          className="os-clear"
          aria-label="Clear search"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
        >
          ×
        </button>
      )}

      <span aria-hidden="true" className="os-rule" />
    </div>
  );
}

const CSS = `
.os {
  --os-accent: #6f3034;
  --os-ink: #314863;
  --os-muted: #6b7a8f;
  --os-surface: #eef3f9;
  --os-orb: 2.25rem;
  --os-spring: cubic-bezier(0.34, 1.25, 0.64, 1);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: var(--os-orb);
  height: var(--os-orb);
  transition: width 0.5s var(--os-spring);
}
.os, .os * { box-sizing: border-box; }
.os[data-open="true"] { width: var(--os-width); }

.os-orb {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--os-orb);
  height: var(--os-orb);
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--os-accent) 60%, transparent);
  background: var(--os-surface);
  box-shadow:
    inset 0 0 0 2px var(--os-surface),
    inset 0 0 0 3px color-mix(in srgb, var(--os-accent) 25%, transparent);
  color: var(--os-accent);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.5s var(--os-spring);
}
.os-orb:hover,
.os[data-open="true"] .os-orb {
  background: var(--os-accent);
  color: var(--os-surface);
}
.os[data-open="true"] .os-orb { transform: rotate(-12deg); }
.os-lens { width: 16px; height: 16px; }

.os-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 1.5rem 0 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--os-ink);
  font: inherit;
  font-style: italic;
  font-size: 1.05rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  -webkit-appearance: none;
  appearance: none;
}
.os-input::placeholder { color: var(--os-muted); opacity: 1; }
.os-input::-webkit-search-cancel-button { display: none; }
.os[data-open="true"] .os-input { opacity: 1; transition-delay: 0.12s; }

.os-clear {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: none;
  padding: 0 0.25rem;
  color: var(--os-accent);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

/* The inscribed line: a double rule under the text, drawn from the left. */
.os-rule {
  position: absolute;
  left: calc(var(--os-orb) + 0.5rem);
  right: 0;
  bottom: 0.2rem;
  border-bottom: 3px double color-mix(in srgb, var(--os-accent) 55%, transparent);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.45s var(--os-spring);
  pointer-events: none;
}
.os[data-open="true"] .os-rule { transform: scaleX(1); transition-delay: 0.08s; }
.os:focus-within .os-rule { border-bottom-color: var(--os-accent); }

.os-orb:focus-visible, .os-clear:focus-visible {
  outline: 2px solid var(--os-accent);
  outline-offset: 2px;
}
.os-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .os, .os * { transition: none !important; }
}
`;
