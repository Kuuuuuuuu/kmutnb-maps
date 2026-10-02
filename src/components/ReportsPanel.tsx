import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CircleCheck,
  ClipboardList,
  Mail,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  localizedBuildingName,
  localizedPlaceName,
  t,
  type TranslationKey,
} from "../lib/i18n";
import { supabase } from "../lib/supabase";
import { useGsapEntrance } from "../lib/gsap";
import type { BuildingFeature, CampusPlace, Language } from "../types/geo";

// Mirrors the check constraint in docs/admin-report.sql.
const STATUSES = ["pending", "in_progress", "resolved", "rejected"] as const;
type ReportStatus = (typeof STATUSES)[number];
const OPEN_STATUSES: ReportStatus[] = ["pending", "in_progress"];

// The `issue_report` columns both panels read.
type Report = {
  report_id: number;
  created_at: string;
  reporter_email: string | null;
  category: string;
  details: string | null;
  building_osm_id: number | null;
  floor: number | null;
  place_id: string | null;
  photo_url: string | null;
  status: ReportStatus;
  admin_note: string | null;
  updated_at: string;
  resolved_at: string | null;
};

const REPORT_COLUMNS =
  "report_id, created_at, reporter_email, category, details, " +
  "building_osm_id, floor, place_id, photo_url, status, admin_note, " +
  "updated_at, resolved_at";

const STATUS_LABEL: Record<ReportStatus, TranslationKey> = {
  pending: "statusPending",
  in_progress: "statusInProgress",
  resolved: "statusResolved",
  rejected: "statusRejected",
};

const STATUS_STYLE: Record<ReportStatus, string> = {
  pending: "border-coral/25 bg-coral/10 text-coral",
  in_progress: "border-mapblue/25 bg-mapblue/10 text-mapblue",
  resolved: "border-fern/25 bg-fern/10 text-fern",
  rejected: "border-ink/15 bg-ink/[0.06] text-ink/55",
};

// Matches the <option> values in IssueReportDialog.tsx.
const CATEGORY_LABEL: Record<string, TranslationKey> = {
  broken: "issueOptionBroken",
  building: "issueOptionBuilding",
  cleanliness: "issueOptionCleanliness",
  other: "issueOptionOther",
};

// `subject` is just the building/place name the dialog pre-fills, which the
// location line already shows, so the category is the more useful title.
function categoryLabel(language: Language, category: string): string {
  return t(language, CATEGORY_LABEL[category] ?? "issueOptionOther");
}

// "open" = still needs admin attention (pending + in progress).
type Filter = "open" | ReportStatus | "all";
const FILTERS: Filter[] = ["open", ...STATUSES, "all"];

type ReportsPanelProps = {
  // "admin": every report, status tabs, editable status + message.
  // "mine": the signed-in user's own reports, read-only.
  mode: "admin" | "mine";
  userId: string;
  language: Language;
  buildings: BuildingFeature[];
  places: CampusPlace[];
  onClose: () => void;
};

export function ReportsPanel({
  mode,
  userId,
  language,
  buildings,
  places,
  onClose,
}: ReportsPanelProps) {
  const isAdmin = mode === "admin";
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<Filter>(isAdmin ? "open" : "all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const panelRef = useGsapEntrance<HTMLDivElement>("modal");
  const HeaderIcon = isAdmin ? ShieldCheck : ClipboardList;

  const buildingById = useMemo(
    () => new Map(buildings.map((b) => [b.properties.osm_id, b])),
    [buildings],
  );
  const placeById = useMemo(
    () => new Map(places.map((p) => [p.id, p])),
    [places],
  );

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setLoadError(false);
    let query = supabase
      .from("issue_report")
      .select(REPORT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(500);
    // RLS already limits non-admins to their own rows; the filter matters for
    // an admin opening "My reports", who could otherwise read everyone's.
    if (!isAdmin) query = query.eq("reported_by", userId);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setLoadError(true);
      return;
    }
    setReports((data ?? []) as unknown as Report[]);
  }, [isAdmin, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const result: Record<Filter, number> = {
      open: 0,
      pending: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
      all: reports.length,
    };
    for (const report of reports) {
      result[report.status] += 1;
      if (OPEN_STATUSES.includes(report.status)) result.open += 1;
    }
    return result;
  }, [reports]);

  const visible = reports.filter((r) =>
    filter === "all"
      ? true
      : filter === "open"
        ? OPEN_STATUSES.includes(r.status)
        : r.status === filter,
  );
  const selected = reports.find((r) => r.report_id === selectedId) ?? null;

  function describeLocation(report: Report): string {
    const parts: string[] = [];
    if (report.building_osm_id != null) {
      const building = buildingById.get(report.building_osm_id);
      parts.push(
        building
          ? localizedBuildingName(building, language)
          : `#${report.building_osm_id}`,
      );
    } else if (report.place_id) {
      const place = placeById.get(report.place_id);
      parts.push(place ? localizedPlaceName(place, language) : report.place_id);
    }
    if (report.floor != null) {
      parts.push(`${t(language, "floorLabel")} ${report.floor}`);
    }
    return parts.length ? parts.join(" · ") : t(language, "adminCampusWide");
  }

  function formatDate(value: string): string {
    return new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function handleSaved(updated: Report) {
    setReports((current) =>
      current.map((r) => (r.report_id === updated.report_id ? updated : r)),
    );
  }

  const title = t(language, isAdmin ? "adminReports" : "myReports");

  return (
    <div
      ref={panelRef}
      className="absolute inset-0 z-[60] flex flex-col bg-paper"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 pb-3 pt-[max(0.875rem,env(safe-area-inset-top))] md:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-ink text-paper">
            <HeaderIcon aria-hidden="true" size={17} />
          </div>
          <div className="min-w-0">
            <p className="m-0 text-[0.6rem] font-extrabold uppercase tracking-[0.16em] text-fern">
              {t(language, isAdmin ? "adminEyebrow" : "account")}
            </p>
            <h2 className="m-0 truncate font-display text-[1.3rem] font-semibold leading-none tracking-[-0.03em] text-ink">
              {title}
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-label={t(language, "adminRefresh")}
            title={t(language, "adminRefresh")}
            className="grid size-9 place-items-center rounded-full border border-ink/10 bg-transparent text-ink hover:bg-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 disabled:opacity-50"
          >
            <RefreshCw
              aria-hidden="true"
              size={15}
              className={loading ? "animate-spin" : undefined}
            />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(language, "close")}
            className="grid size-9 place-items-center rounded-full border border-ink/10 bg-transparent text-ink hover:bg-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* List — hidden on mobile while a report is open. */}
        <section
          className={`min-h-0 w-full flex-col border-ink/10 md:flex md:w-[24rem] md:shrink-0 md:border-r ${selected ? "hidden" : "flex"}`}
        >
          {isAdmin && (
            <div
              className="flex flex-wrap gap-1.5 px-4 pt-3 md:px-5"
              role="tablist"
            >
              {FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={filter === option}
                  onClick={() => setFilter(option)}
                  className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[0.7rem] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 ${filter === option ? "border-ink bg-ink text-paper" : "border-ink/10 bg-transparent text-ink/60 hover:bg-ink/[0.06]"}`}
                >
                  {option === "all"
                    ? t(language, "adminFilterAll")
                    : option === "open"
                      ? t(language, "adminFilterOpen")
                      : t(language, STATUS_LABEL[option])}
                  <span
                    className={
                      filter === option ? "text-paper/60" : "text-ink/35"
                    }
                  >
                    {counts[option]}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-5">
            {loadError ? (
              <p className="m-0 rounded-lg border border-coral/20 bg-coral/10 px-3 py-2 text-[0.78rem] font-bold text-coral">
                {t(language, "adminLoadError")}
              </p>
            ) : !loading && visible.length === 0 ? (
              <p className="m-0 py-8 text-center text-[0.8rem] font-semibold text-ink/45">
                {t(language, isAdmin ? "adminNoReports" : "myReportsEmpty")}
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {visible.map((report) => (
                  <li key={report.report_id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(report.report_id)}
                      aria-current={report.report_id === selectedId}
                      className={`w-full rounded-xl border px-3.5 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 ${report.report_id === selectedId ? "border-fern bg-moss" : "border-ink/10 bg-white/60 hover:bg-white"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="m-0 line-clamp-1 text-[0.84rem] font-extrabold text-ink">
                          {categoryLabel(language, report.category)}
                        </p>
                        <StatusBadge status={report.status} language={language} />
                      </div>
                      <p className="m-0 mt-1 line-clamp-1 text-[0.72rem] font-semibold text-ink/55">
                        {describeLocation(report)}
                      </p>
                      <p className="m-0 mt-1 flex items-center gap-1.5 text-[0.66rem] font-semibold text-ink/40">
                        #{report.report_id} · {formatDate(report.created_at)}
                        {!isAdmin && report.admin_note && (
                          <MessageSquareText
                            aria-label={t(language, "adminResponse")}
                            size={12}
                            className="text-fern"
                          />
                        )}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Detail */}
        <section
          className={`min-h-0 flex-1 overflow-y-auto ${selected ? "block" : "hidden md:block"}`}
        >
          {selected ? (
            <ReportDetail
              key={selected.report_id}
              report={selected}
              editable={isAdmin}
              language={language}
              location={describeLocation(selected)}
              formatDate={formatDate}
              onBack={() => setSelectedId(null)}
              onSaved={handleSaved}
            />
          ) : (
            <div className="grid h-full place-items-center p-6">
              <HeaderIcon aria-hidden="true" size={28} className="text-ink/20" />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  language,
}: {
  status: ReportStatus;
  language: Language;
}) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.62rem] font-extrabold ${STATUS_STYLE[status]}`}
    >
      {t(language, STATUS_LABEL[status])}
    </span>
  );
}

type ReportDetailProps = {
  report: Report;
  editable: boolean;
  language: Language;
  location: string;
  formatDate: (value: string) => string;
  onBack: () => void;
  onSaved: (report: Report) => void;
};

function ReportDetail({
  report,
  editable,
  language,
  location,
  formatDate,
  onBack,
  onSaved,
}: ReportDetailProps) {
  return (
    <article className="mx-auto w-full max-w-[40rem] px-4 py-4 md:px-8 md:py-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ink/10 bg-transparent px-3 text-[0.72rem] font-extrabold text-ink hover:bg-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 md:hidden"
      >
        <ArrowLeft aria-hidden="true" size={15} />
        {t(language, "adminBack")}
      </button>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-fern">
            #{report.report_id}
          </p>
          <h3 className="m-0 mt-1 font-display text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-ink">
            {categoryLabel(language, report.category)}
          </h3>
        </div>
        <StatusBadge status={report.status} language={language} />
      </div>

      <dl className="m-0 mt-4 grid gap-2 text-[0.76rem]">
        <MetaRow icon={<Building2 size={14} />} label={t(language, "adminLocation")}>
          {location}
        </MetaRow>
        {editable && (
          <MetaRow icon={<Mail size={14} />} label={t(language, "adminReporter")}>
            {report.reporter_email ?? "—"}
          </MetaRow>
        )}
        <MetaRow icon={<CalendarClock size={14} />} label={t(language, "adminReportedAt")}>
          {formatDate(report.created_at)}
        </MetaRow>
        {report.resolved_at && (
          <MetaRow icon={<CircleCheck size={14} />} label={t(language, "adminResolvedAt")}>
            {formatDate(report.resolved_at)}
          </MetaRow>
        )}
      </dl>

      <p className="mb-0 mt-4 whitespace-pre-wrap rounded-xl border border-ink/10 bg-white/60 px-3.5 py-3 text-[0.82rem] font-semibold leading-relaxed text-ink/80">
        {report.details || (
          <span className="text-ink/40">{t(language, "adminNoDetails")}</span>
        )}
      </p>

      {report.photo_url && (
        <a
          href={report.photo_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block overflow-hidden rounded-xl border border-ink/10"
        >
          <img
            src={report.photo_url}
            alt={t(language, "issuePhoto")}
            className="block max-h-[22rem] w-full bg-ink/[0.04] object-contain"
          />
        </a>
      )}

      {editable ? (
        <ReportEditor report={report} language={language} onSaved={onSaved} />
      ) : (
        <div className="mt-6 border-t border-ink/10 pt-5">
          <p className="m-0 flex items-center gap-1.5 text-[0.72rem] font-extrabold text-ink">
            <MessageSquareText aria-hidden="true" size={14} className="text-fern" />
            {t(language, "adminResponse")}
          </p>
          {report.admin_note ? (
            <p className="mb-0 mt-2 whitespace-pre-wrap rounded-xl border border-fern/20 bg-fern/[0.06] px-3.5 py-3 text-[0.82rem] font-semibold leading-relaxed text-ink/80">
              {report.admin_note}
            </p>
          ) : (
            <p className="mb-0 mt-2 text-[0.78rem] font-semibold text-ink/45">
              {t(language, "adminNoResponse")}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function ReportEditor({
  report,
  language,
  onSaved,
}: {
  report: Report;
  language: Language;
  onSaved: (report: Report) => void;
}) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [note, setNote] = useState(report.admin_note ?? "");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<"saved" | "error" | null>(null);

  const trimmedNote = note.trim() || null;
  const dirty = status !== report.status || trimmedNote !== report.admin_note;

  async function save() {
    if (!supabase || saving || !dirty) return;
    setSaving(true);
    setResult(null);
    // Only status + admin_note are writable (column grant); the trigger fills
    // handled_by / updated_at / resolved_at.
    const { data, error } = await supabase
      .from("issue_report")
      .update({ status, admin_note: trimmedNote })
      .eq("report_id", report.report_id)
      .select(REPORT_COLUMNS)
      .single();
    setSaving(false);
    if (error || !data) {
      setResult("error");
      return;
    }
    onSaved(data as unknown as Report);
    setResult("saved");
  }

  return (
    <div className="mt-6 border-t border-ink/10 pt-5">
      <p className="m-0 text-[0.72rem] font-extrabold text-ink">
        {t(language, "adminStatus")}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1.5 lg:grid-cols-4">
        {STATUSES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={status === option}
            onClick={() => {
              setStatus(option);
              setResult(null);
            }}
            className={`min-h-10 whitespace-nowrap rounded-lg border px-2 text-[0.72rem] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 ${status === option ? `${STATUS_STYLE[option]} ring-1 ring-current` : "border-ink/10 bg-transparent text-ink/55 hover:bg-ink/[0.06]"}`}
          >
            {t(language, STATUS_LABEL[option])}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-[0.72rem] font-extrabold text-ink">
        {t(language, "adminNote")}
        <textarea
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setResult(null);
          }}
          rows={3}
          placeholder={t(language, "adminNotePlaceholder")}
          className="mt-1.5 w-full resize-y rounded-lg border border-ink/10 bg-[#fbfaf4] px-3 py-2.5 text-[0.82rem] font-semibold text-ink outline-none focus:border-fern focus:ring-2 focus:ring-fern/15"
        />
      </label>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border-0 bg-ink px-5 text-[0.82rem] font-extrabold text-paper transition hover:bg-fern focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? t(language, "adminSaving") : t(language, "adminSave")}
        </button>
        {result === "saved" && (
          <span className="text-[0.76rem] font-extrabold text-fern" role="status">
            {t(language, "adminSaved")}
          </span>
        )}
        {result === "error" && (
          <span className="text-[0.76rem] font-extrabold text-coral" role="status">
            {t(language, "adminSaveError")}
          </span>
        )}
      </div>
    </div>
  );
}

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <dt className="flex w-[7.5rem] shrink-0 items-center gap-1.5 font-extrabold text-ink/45">
        <span aria-hidden="true" className="text-ink/35">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="m-0 min-w-0 break-words font-semibold text-ink/80">
        {children}
      </dd>
    </div>
  );
}
