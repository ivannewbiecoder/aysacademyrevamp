const ICONS: Record<string, React.ReactNode> = {
  biology: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="24" cy="24" r="17" />
      <ellipse cx="24" cy="24" rx="8" ry="13" transform="rotate(-26 24 24)" />
      <circle cx="25" cy="23" r="2.5" />
    </svg>
  ),
  physics: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <ellipse cx="24" cy="24" rx="18" ry="7" />
      <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(60 24 24)" />
      <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(120 24 24)" />
      <circle cx="24" cy="24" r="2.5" fill="currentColor" />
    </svg>
  ),
  chemistry: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M18 7h12M21 7v12L11 38a3 3 0 0 0 3 4h20a3 3 0 0 0 3-4L27 19V7M15 32h18" />
      <circle cx="20" cy="36" r="1.5" fill="currentColor" />
      <circle cx="27" cy="38" r="1.5" fill="currentColor" />
    </svg>
  ),
  math: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 39 23 9l18 30H7Z" />
      <path d="M16 27h16M23 9v30" />
    </svg>
  ),
  informatics: (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="8" width="38" height="32" rx="4" />
      <path d="m18 19-5 5 5 5m12-10 5 5-5 5m-3-13-6 16" />
    </svg>
  ),
  geography: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="24" cy="24" r="18" />
      <ellipse cx="24" cy="24" rx="8" ry="18" />
      <path d="M7 24h34M11 14h26M11 34h26" />
    </svg>
  ),
  economics: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M7 40h34M11 35V23h6v12m5 0V16h6v19m5 0V9h6v26" />
      <path d="m11 15 8-5 8 3 11-7" />
    </svg>
  ),
  science: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m12 16 13-8 12 10-3 17-14 6-13-11 5-14Z" />
      <circle cx="12" cy="16" r="3" fill="currentColor" />
      <circle cx="25" cy="8" r="3" fill="currentColor" />
      <circle cx="37" cy="18" r="3" fill="currentColor" />
      <circle cx="34" cy="35" r="3" fill="currentColor" />
      <circle cx="20" cy="41" r="3" fill="currentColor" />
      <circle cx="7" cy="30" r="3" fill="currentColor" />
    </svg>
  ),
};

export function ProgramIcon({ accent }: { accent: string }) {
  return ICONS[accent] ?? ICONS.science;
}
