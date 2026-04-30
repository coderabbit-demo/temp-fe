import type { ReactNode } from "react";

import { Sidebar } from "@/components/research/sidebar";

export default function ResearchLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  );
}
