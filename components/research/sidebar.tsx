"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/research/dashboard", label: "Dashboard" },
  { href: "/research/competitors", label: "Competitors" },
  { href: "/research/runs", label: "Runs" },
  { href: "/research/findings", label: "Findings" },
  { href: "/research/sources", label: "Sources" },
  { href: "/research/settings", label: "Settings" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__eyebrow">Internal</span>
        <h1>Competitor Research Dashboard</h1>
        <p>Historical sweep archive for demo prep and competitive follow-up.</p>
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
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
