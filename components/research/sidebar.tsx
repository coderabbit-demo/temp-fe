"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/research/dashboard", label: "Overview" },
  { href: "/research/competitors", label: "Competitors" },
  { href: "/research/findings", label: "Signals" },
  { href: "/research/sources", label: "Evidence" },
  { href: "/research/runs", label: "Run History" },
  { href: "/research/settings", label: "Ops" }
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="sticky top-0 z-40 mx-4 mt-4 rounded-[28px] border border-white/10 bg-slate-950/90 px-4 py-3 text-white shadow-shell backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-sky-200/70">
              Internal
            </div>
            <div className="mt-1 text-sm font-semibold">Revenue Briefings</div>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-controls="research-sidebar"
          >
            Menu
          </button>
        </div>
      </div>

      <div
        className={clsx(
          "fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
      />

      <aside
        id="research-sidebar"
        className={clsx(
          "sidebar",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="sidebar__brand">
          <span className="sidebar__eyebrow">Internal</span>
          <h1>Revenue-ready competitor briefings</h1>
          <p>Turn archived sweeps into sharper talk tracks for SE demos, AE follow-up, and sales prep.</p>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-white">What this experience is for</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Fast briefings, cleaner signal review, and easier competitor handoff for revenue teams that
            do not want to dig through a raw archive.
          </p>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "sidebar__link sidebar__link--active" : "sidebar__link"}
              >
                <span>{item.label}</span>
                <span className="sidebar__link-arrow" aria-hidden="true">
                  /
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
