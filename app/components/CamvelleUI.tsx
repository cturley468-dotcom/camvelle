import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export function getCamvelleBackgroundStyle(
  backgroundImage = "/backgrounds/camvelle-background.png"
): CSSProperties {
  return {
    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.78)), url('${backgroundImage}')`,
  };
}

export const camvelleBackgroundStyle = getCamvelleBackgroundStyle();

export const camvellePanel =
  "rounded-[3rem] border border-white/10 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-[2px]";

export const camvelleInnerPanel =
  "rounded-[2.4rem] border border-white/10 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[2px]";

export const camvelleCreamButton =
  "rounded-full bg-[#f5f0e7] px-7 py-4 text-center text-[11px] font-bold uppercase tracking-[0.35em] text-black transition hover:scale-[1.02] hover:bg-white";

export const camvelleGhostButton =
  "rounded-full border border-white/10 bg-black/20 px-7 py-4 text-center text-[11px] font-bold uppercase tracking-[0.35em] text-white/70 transition hover:bg-white hover:text-black";

export function CamvellePageShell({
  children,
  backgroundImage = "/backgrounds/camvelle-background.png",
}: {
  children: ReactNode;
  backgroundImage?: string;
}) {
  return (
    <main
      className="min-h-screen bg-[#020202] bg-cover bg-center bg-fixed px-5 py-7 text-white sm:px-8"
      style={getCamvelleBackgroundStyle(backgroundImage)}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
  );
}

export function CamvellePublicTopBar({
  homeLabel = "Home",
}: {
  homeLabel?: string;
}) {
  return (
    <header className="mb-10 flex items-center justify-between gap-4">
      <Link
        href="/"
        className="text-xs uppercase tracking-[0.55em] text-white/45"
      >
        Camvelle Creative
      </Link>

      <Link href="/" className={camvelleGhostButton}>
        {homeLabel}
      </Link>
    </header>
  );
}

export function CamvellePanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`${camvellePanel} ${className}`}>{children}</section>;
}

export function CamvelleInnerPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${camvelleInnerPanel} ${className}`}>{children}</div>;
}

export function CamvelleEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
      {children}
    </p>
  );
}

export function CamvelleHeading({ children }: { children: ReactNode }) {
  return (
    <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
      {children}
    </h1>
  );
}

export function CamvelleBody({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-base leading-8 text-white/55">{children}</p>;
}

export function CamvelleInput({
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-full border border-white/10 bg-[#f5f0e7] px-7 py-5 text-black outline-none placeholder:text-black/35 focus:border-white"
    />
  );
}

export function CamvelleStatusPill({ status }: { status?: string }) {
  const value = status || "Not Started";
  const normalized = value.toLowerCase();

  const className =
    normalized.includes("signed") ||
    normalized.includes("paid") ||
    normalized.includes("received") ||
    normalized.includes("ready")
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
      : normalized.includes("sent") ||
          normalized.includes("editing") ||
          normalized.includes("uploading")
        ? "border-sky-400/25 bg-sky-400/10 text-sky-200"
        : normalized.includes("draft") || normalized.includes("photos")
          ? "border-amber-400/25 bg-amber-400/10 text-amber-200"
          : "border-white/10 bg-white/[0.04] text-white/50";

  return (
    <span
      className={`inline-flex rounded-full border px-4 py-2 text-xs font-semibold ${className}`}
    >
      {value}
    </span>
  );
}

export function CamvelleProgressBar({ progress }: { progress: number }) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress || 0)));

  return (
    <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-[#f5f0e7] transition-all"
        style={{ width: `${safeProgress}%` }}
      />
    </div>
  );
}
