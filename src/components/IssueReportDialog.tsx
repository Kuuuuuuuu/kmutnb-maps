import { Camera, ImagePlus, Send, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { localizedBuildingName, localizedPlaceName, t } from "../lib/i18n";
import type { BuildingFeature, CampusPlace, Language } from "../types/geo";

export type IssueReport = {
  subject: string;
  category: string;
  details: string;
  photoName?: string;
  photoData?: string;
  createdAt?: string;
};

type IssueReportDialogProps = {
  language: Language;
  building: BuildingFeature | null;
  place: CampusPlace | null;
  onClose: () => void;
  onSubmit: (report: IssueReport) => void;
};

export function IssueReportDialog({
  language,
  building,
  place,
  onClose,
  onSubmit,
}: IssueReportDialogProps) {
  const [category, setCategory] = useState("broken");
  const [details, setDetails] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoData, setPhotoData] = useState("");
  const subject = building
    ? localizedBuildingName(building, language)
    : place
      ? localizedPlaceName(place, language)
      : t(language, "campusMap");

  function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () =>
      setPhotoData(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ subject, category, details, photoName, photoData });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[65] grid place-items-center bg-ink/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t(language, "issueTitle")}
    >
      <motion.form
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onSubmit={submit}
        className="max-h-[calc(100vh-2rem)] w-full max-w-[28rem] overflow-auto rounded-[1.2rem] border border-ink/10 bg-paper p-5 shadow-float md:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-[0.6rem] font-extrabold uppercase tracking-[0.16em] text-coral">
              {t(language, "report")}
            </p>
            <h2 className="m-0 mt-1 font-display text-[1.65rem] font-semibold leading-none tracking-[-0.035em] text-ink">
              {t(language, "issueTitle")}
            </h2>
            <p className="mb-0 mt-2 text-[0.76rem] font-semibold leading-relaxed text-ink/55">
              {subject} · {t(language, "issueDescription")}
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

        <label className="mt-5 block text-[0.72rem] font-extrabold text-ink">
          {t(language, "issueCategory")}
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-lg border border-ink/10 bg-[#fbfaf4] px-3 text-[0.82rem] font-semibold text-ink outline-none focus:border-fern focus:ring-2 focus:ring-fern/15"
          >
            <option value="broken">{t(language, "issueOptionBroken")}</option>
            <option value="building">
              {t(language, "issueOptionBuilding")}
            </option>
            <option value="cleanliness">
              {t(language, "issueOptionCleanliness")}
            </option>
            <option value="other">{t(language, "issueOptionOther")}</option>
          </select>
        </label>

        <label className="mt-4 block text-[0.72rem] font-extrabold text-ink">
          {t(language, "issueDetails")}
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder={t(language, "issueDetailsPlaceholder")}
            rows={4}
            className="mt-1.5 w-full resize-none rounded-lg border border-ink/10 bg-[#fbfaf4] px-3 py-2.5 text-[0.82rem] font-semibold text-ink outline-none placeholder:text-ink/35 focus:border-fern focus:ring-2 focus:ring-fern/15"
          />
        </label>

        <div className="mt-4">
          <span className="block text-[0.72rem] font-extrabold text-ink">
            {t(language, "issuePhoto")}
          </span>
          <label className="mt-1.5 flex min-h-20 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-ink/20 bg-[#fbfaf4] px-3 py-3 transition hover:border-fern hover:bg-fern/[0.04]">
            {photoData ? (
              <img
                src={photoData}
                alt={photoName}
                className="size-14 rounded-md object-cover"
              />
            ) : (
              <span className="grid size-12 place-items-center rounded-md bg-coral/10 text-coral">
                <ImagePlus aria-hidden="true" size={20} />
              </span>
            )}
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[0.78rem] font-extrabold text-ink">
                <Camera aria-hidden="true" size={15} />{" "}
                {t(language, "uploadPhoto")}
              </span>
              <span className="mt-1 block truncate text-[0.68rem] font-semibold text-ink/45">
                {photoName || "JPG, PNG"}
              </span>
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handlePhoto}
            />
          </label>
        </div>

        <button
          type="submit"
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border-0 bg-ink px-4 text-[0.82rem] font-extrabold text-paper transition hover:bg-fern focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 active:scale-[0.99]"
        >
          <Send aria-hidden="true" size={16} />
          {t(language, "issueSubmit")}
        </button>
      </motion.form>
    </motion.div>
  );
}
