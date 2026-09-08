import type { ReactElement, ReactNode } from "react";
import { FaDiscord, FaGithub, FaXTwitter } from "react-icons/fa6";
import { Wordmark } from "@/components/ui/wordmark";

export type Footer7Props = {
  /** Defaults to the Brink wordmark; pass a node when the real mark exists. */
  logo?: ReactNode;
  logoHref?: string;
  sections?: Array<{
    title: string;
    links: Array<{ name: string; href: string }>;
  }>;
  description?: string;
  socialLinks?: Array<{
    icon: ReactElement;
    href: string;
    label: string;
  }>;
  copyright?: string;
  legalLinks?: Array<{ name: string; href: string }>;
};

const defaultSections: NonNullable<Footer7Props["sections"]> = [
  {
    title: "Discover",
    links: [
      { name: "Live feed", href: "#markets" },
      { name: "The four gates", href: "#gates" },
      { name: "Score ledger", href: "#scoring" },
      { name: "Execution boundary", href: "#execution" }
    ]
  },
  {
    title: "Network",
    links: [
      { name: "DreamDEX", href: "#markets" },
      { name: "Somnia Shannon", href: "#markets" },
      { name: "Event contracts", href: "#gates" },
      { name: "Settlement scan", href: "#api" }
    ]
  },
  {
    title: "Interface",
    links: [
      { name: "Read-only API", href: "#api" },
      { name: "GET /health", href: "#api" },
      { name: "GET /v1/markets", href: "#api" },
      { name: "Architecture notes", href: "#execution" }
    ]
  }
];

const defaultSocialLinks: NonNullable<Footer7Props["socialLinks"]> = [
  { icon: <FaXTwitter className="size-5" />, href: "#", label: "Brink on X" },
  { icon: <FaGithub className="size-5" />, href: "#", label: "Brink on GitHub" },
  { icon: <FaDiscord className="size-5" />, href: "#", label: "Brink on Discord" }
];

const defaultLegalLinks: NonNullable<Footer7Props["legalLinks"]> = [
  { name: "Risk disclosure", href: "#" },
  { name: "Terms of use", href: "#" },
  { name: "Privacy", href: "#" }
];

/**
 * Site footer on the design system's dark surface. Muted-sage carries the
 * secondary text (it is the specified light-on-dark tone) and the accent shows
 * up only on hover, where it acts as the active-link mark.
 */
export function Footer7({
  logo,
  logoHref = "#top",
  sections = defaultSections,
  description = "Discovery and scoring for DreamDEX event contracts. Brink reads the chain and the book, explains every rank, and hands execution back to your wallet.",
  socialLinks = defaultSocialLinks,
  copyright = "© 2026 Brink. Read-only market intelligence.",
  legalLinks = defaultLegalLinks
}: Footer7Props) {
  return (
    <footer className="bg-press-black text-bone-white">
      <section className="py-24 lg:py-32">
        <div className="page-shell">
          <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
            <div className="flex w-full flex-col justify-between gap-6 lg:items-start">
              <a href={logoHref} className="inline-flex items-center gap-3">
                {logo ?? <Wordmark inverted />}
              </a>
              <p className="max-w-[42ch] text-body-sm text-muted-sage lg:max-w-[70%]">
                {description}
              </p>
              <ul className="flex items-center gap-6 text-muted-sage">
                {socialLinks.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      aria-label={social.label}
                      className="inline-flex transition-colors hover:text-highlighter-green"
                    >
                      {social.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid w-full gap-10 md:grid-cols-3 lg:gap-20">
              {sections.map((section) => (
                <nav key={section.title} aria-label={section.title}>
                  <h3 className="micro-label mb-5 text-bone-white">
                    {section.title}
                  </h3>
                  <ul className="space-y-3 text-body-sm text-muted-sage">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        <a
                          href={link.href}
                          className="transition-colors hover:text-highlighter-green"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-4 border-t rule-dark py-8 md:flex-row md:items-center md:text-left">
            <p className="micro-label order-2 text-muted-sage lg:order-1">
              {copyright}
            </p>
            <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row md:gap-6">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="micro-label text-muted-sage transition-colors hover:text-highlighter-green"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </footer>
  );
}
