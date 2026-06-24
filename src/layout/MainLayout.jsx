import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] overflow-hidden">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="flex-1">
          <header className="border-b border-slate-200 bg-white p-3 lg:hidden">
            <div className="mx-auto max-w-[1600px] px-4">
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
                className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-50"
              >
                <Menu size={20} />
              </button>
            </div>
          </header>

          <main className="p-6 sm:p-10">{children}</main>
        </div>
      </div>
    </div>
  );
}