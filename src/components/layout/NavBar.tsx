"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { siteConfig } from "@/config/site";

export const NavBar = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg-primary/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[60px] max-w-container items-center justify-between px-8">
        {/* Left: Logo + Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-[800] tracking-[-0.03em] text-text-primary">
            이더<span className="text-brand-primary">.</span>dev
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            {siteConfig.nav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-[0.9375rem] font-medium transition-all duration-base ${
                  isActive(link.href)
                    ? "font-semibold text-text-primary"
                    : "text-text-tertiary hover:bg-bg-secondary hover:text-text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Search + Theme + Mobile Menu */}
        <div className="flex items-center gap-1">
          <Link
            href="/search"
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-tertiary transition-all duration-base hover:bg-bg-secondary hover:text-text-primary"
          >
            <Search size={18} />
          </Link>
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-tertiary transition-all duration-base hover:bg-bg-secondary hover:text-text-primary md:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border px-8 py-4 md:hidden">
          {siteConfig.nav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-md px-3 py-2 text-[0.9375rem] font-medium transition-all duration-base ${
                isActive(link.href)
                  ? "font-semibold text-text-primary"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};
