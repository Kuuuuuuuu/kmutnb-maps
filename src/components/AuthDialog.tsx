import { LogIn, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { t } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useGsapEntrance } from "../lib/gsap";
import type { Language } from "../types/geo";

// Maps Supabase's raw English auth errors onto our own localized copy so users
// never see technical strings like "Invalid login credentials".
function friendlyAuthError(language: Language, raw: string | null): string {
  const message = (raw || "").toLowerCase();
  if (message.includes("already registered") || message.includes("already been")) {
    return t(language, "authEmailInUse");
  }
  if (message.includes("email") && message.includes("invalid")) {
    return t(language, "authEmailInvalid");
  }
  if (message.includes("password")) {
    return t(language, "authWeakPassword");
  }
  if (message.includes("rate limit") || message.includes("after")) {
    return t(language, "authRateLimit");
  }
  // "Invalid login credentials" and anything else fall back to the generic line.
  return t(language, "authError");
}

type AuthDialogProps = {
  language: Language;
  // Optional hint shown at the top, e.g. "sign in before sending a report".
  notice?: string;
  onClose: () => void;
  onAuthed: () => void;
};

export function AuthDialog({
  language,
  notice,
  onClose,
  onAuthed,
}: AuthDialogProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const backdropRef = useGsapEntrance<HTMLDivElement>("modalBackdrop");
  const formRef = useGsapEntrance<HTMLFormElement>("modal");

  const isSignUp = mode === "signUp";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);

    const result = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    setBusy(false);

    if (result.error) {
      // Translate Supabase's raw message into friendly, localized copy.
      setMessage(friendlyAuthError(language, result.error));
      return;
    }

    if (result.needsConfirmation) {
      // Email confirmation is enabled: no session yet, tell them to check mail.
      setMode("signIn");
      setPassword("");
      setMessage(t(language, "authNeedConfirm"));
      return;
    }

    onAuthed();
  }

  return (
    <div
      ref={backdropRef}
      className="absolute inset-0 z-[70] grid place-items-center bg-ink/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t(language, isSignUp ? "authSignUpTitle" : "authSignInTitle")}
    >
      <form
        ref={formRef}
        onSubmit={submit}
        className="w-full max-w-[24rem] rounded-[1.2rem] border border-ink/10 bg-paper p-5 shadow-float md:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-[0.6rem] font-extrabold uppercase tracking-[0.16em] text-fern">
              {t(language, "account")}
            </p>
            <h2 className="m-0 mt-1 font-display text-[1.55rem] font-semibold leading-none tracking-[-0.035em] text-ink">
              {t(language, isSignUp ? "authSignUpTitle" : "authSignInTitle")}
            </h2>
            <p className="mb-0 mt-2 text-[0.76rem] font-semibold leading-relaxed text-ink/55">
              {t(
                language,
                isSignUp ? "authSignUpSubtitle" : "authSignInSubtitle",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(language, "close")}
            className="grid size-8 shrink-0 place-items-center rounded-full border border-ink/10 bg-transparent text-ink hover:bg-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>

        {notice && (
          <p className="mt-4 mb-0 rounded-lg border border-coral/20 bg-coral/10 px-3 py-2 text-[0.76rem] font-bold text-coral">
            {notice}
          </p>
        )}

        <label className="mt-4 block text-[0.72rem] font-extrabold text-ink">
          {t(language, "authEmail")}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-lg border border-ink/10 bg-[#fbfaf4] px-3 text-[0.82rem] font-semibold text-ink outline-none focus:border-fern focus:ring-2 focus:ring-fern/15"
          />
        </label>

        <label className="mt-4 block text-[0.72rem] font-extrabold text-ink">
          {t(language, "authPassword")}
          <input
            type="password"
            required
            minLength={6}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-lg border border-ink/10 bg-[#fbfaf4] px-3 text-[0.82rem] font-semibold text-ink outline-none focus:border-fern focus:ring-2 focus:ring-fern/15"
          />
        </label>

        {message && (
          <p className="mb-0 mt-3 text-[0.76rem] font-bold text-coral">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border-0 bg-ink px-4 text-[0.82rem] font-extrabold text-paper transition hover:bg-fern focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
        >
          {isSignUp ? (
            <UserPlus aria-hidden="true" size={16} />
          ) : (
            <LogIn aria-hidden="true" size={16} />
          )}
          {busy
            ? t(language, "authProcessing")
            : t(language, isSignUp ? "signUp" : "signIn")}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(isSignUp ? "signIn" : "signUp");
            setMessage(null);
          }}
          className="mt-3 block w-full border-0 bg-transparent text-center text-[0.76rem] font-extrabold text-fern hover:underline focus-visible:outline-none"
        >
          {t(language, isSignUp ? "authHaveAccount" : "authNoAccount")}
        </button>
      </form>
    </div>
  );
}
