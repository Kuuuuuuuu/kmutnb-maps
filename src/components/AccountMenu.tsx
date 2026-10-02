import { ClipboardList, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { t } from "../lib/i18n";
import type { Language } from "../types/geo";

type AccountMenuProps = {
  language: Language;
  email: string | null;
  onMyReports: () => void;
  onSignOut: () => void;
};

// Signed-in account button: a small dropdown with "My reports" and
// "Sign out". Folding these into one button keeps the phone control row
// narrow enough for small screens.
export function AccountMenu({
  language,
  email,
  onMyReports,
  onSignOut,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function choose(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t(language, "account")}
        title={email ?? t(language, "account")}
        className={`grid size-10 place-items-center rounded-full border shadow-soft transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 active:scale-95 ${open ? "border-ink bg-ink text-paper" : "border-ink/10 bg-paper text-ink hover:bg-ink/[0.06]"}`}
      >
        <UserRound aria-hidden="true" size={17} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-float"
        >
          {email && (
            <p className="m-0 truncate border-b border-ink/10 px-3.5 py-2.5 text-[0.7rem] font-bold text-ink/50">
              {email}
            </p>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => choose(onMyReports)}
            className="flex min-h-11 w-full items-center gap-2.5 border-0 bg-transparent px-3.5 text-left text-[0.8rem] font-extrabold text-ink hover:bg-ink/[0.05] focus-visible:bg-ink/[0.05] focus-visible:outline-none"
          >
            <ClipboardList aria-hidden="true" size={16} className="text-fern" />
            {t(language, "myReports")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => choose(onSignOut)}
            className="flex min-h-11 w-full items-center gap-2.5 border-0 border-t border-ink/10 bg-transparent px-3.5 text-left text-[0.8rem] font-extrabold text-coral hover:bg-coral/[0.06] focus-visible:bg-coral/[0.06] focus-visible:outline-none"
          >
            <LogOut aria-hidden="true" size={16} />
            {t(language, "signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
