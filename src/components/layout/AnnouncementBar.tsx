interface AnnouncementBarProps {
  message: string;
}

/** Thin top bar for site-wide notices (shipping, promos). Static — no dismiss state yet (Phase 2+ if needed). */
export function AnnouncementBar({ message }: AnnouncementBarProps) {
  return (
    <div className="bg-background-raised border-border border-b">
      <p className="text-foreground-muted mx-auto max-w-(--breakpoint-xl) px-6 py-2 text-center text-xs tracking-wide uppercase sm:px-8">
        {message}
      </p>
    </div>
  );
}
