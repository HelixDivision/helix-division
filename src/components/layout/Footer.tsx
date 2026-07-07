import Link from "next/link";

import { Logo } from "@/branding/logo/Logo";
import { NewsletterSignup } from "@/components/marketing/NewsletterSignup";
import { footerNav, legalNav } from "@/config/nav";
import { siteConfig } from "@/config/site";

// Only render social links that are actually configured — an empty URL would
// be a dead "#" link. When none are set, the "Follow Us" column is hidden.
const socialLinks = [
  { label: "Instagram", short: "IG", href: siteConfig.social.instagram },
  { label: "X", short: "X", href: siteConfig.social.x },
  { label: "TikTok", short: "TT", href: siteConfig.social.tiktok },
].filter((social) => social.href.length > 0);

/** Site-wide footer — composed into every page, not homepage-specific (see ARCHITECTURE.md#routing-map). Matches the approved mockup's Peptides/Company/Support/Follow Us layout. */
export function Footer() {
  return (
    <footer className="border-border bg-background-base border-t">
      <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <Logo size="sm" />
            <p className="text-foreground-muted mt-4 max-w-xs text-sm">{siteConfig.tagline}</p>
          </div>

          {footerNav.map((column) => (
            <div key={column.title}>
              <h3 className="font-heading text-foreground-primary text-xs tracking-wide uppercase">
                {column.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-foreground-muted hover:text-foreground-primary text-sm transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {socialLinks.length > 0 && (
            <div>
              <h3 className="font-heading text-foreground-primary text-xs tracking-wide uppercase">
                Follow Us
              </h3>
              <ul className="mt-4 flex items-center gap-2.5">
                {socialLinks.map((social) => (
                  <li key={social.label}>
                    <Link
                      href={social.href}
                      aria-label={social.label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-border text-foreground-muted hover:border-accent-crimson hover:text-accent-crimson flex h-8 w-8 items-center justify-center rounded-full border text-[0.6rem] font-medium tracking-wide transition-colors"
                    >
                      {social.short}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-border mt-12 border-t pt-8">
          <h3 className="font-heading text-foreground-primary text-xs tracking-wide uppercase">
            Research Briefings
          </h3>
          <p className="text-foreground-muted mt-2 max-w-md text-sm">
            Occasional product updates and research documentation. No spam.
          </p>
          <div className="mt-4 max-w-md">
            <NewsletterSignup source="footer" />
          </div>
        </div>

        <div className="border-border mt-10 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {legalNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-foreground-muted hover:text-foreground-primary text-xs transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="text-foreground-muted text-xs">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>

        <p className="text-foreground-muted mt-4 text-center text-xs sm:text-left">
          Research use only. Not for human consumption.
        </p>
      </div>
    </footer>
  );
}
