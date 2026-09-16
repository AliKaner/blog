export function CocktailGlassIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 4h16l-7 8.5v6.5" />
      <path d="M9 19h6" />
      <path d="M12 12.5v7" />
      <circle cx="15.5" cy="6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
