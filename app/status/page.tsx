"use client";

import Link from "next/link";
import { useState } from "react";

type StatusResult = {
  found: boolean;
  message: string;
  clientName?: string;
  sessionType?: string;
  bookingStatus?: string;
  contractStatus?: string;
  invoiceStatus?: string;
  lastUpdated?: string;
  photoStatus?: string;
  photoProgress?: number;
  estimatedDelivery?: string;
  galleryUrl?: string;
  photoNotes?: string;
};

function statusClass(status: string | undefined) {
  if (
    status === "Signed" ||
    status === "Paid" ||
    status === "Received" ||
    status === "Gallery Ready"
  ) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  }

  if (status === "Sent" || status === "Editing" || status === "Uploading") {
    return "border-sky-400/30 bg-sky-400/10 text-sky-200";
  }

  if (status === "Draft" || status === "Photos Received") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  }

  return "border-white/10 bg-white/5 text-white/45";
}

const crystalBubble =
  "rounded-[2.8rem] border border-white/15 bg-gradient-to-br from-white/[0.14] via-white/[0.045] to-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_30px_100px_rgba(0,0,0,0.75)] backdrop-blur-3xl";

const crystalCard =
  "rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.10] via-white/[0.035] to-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl";


export default function ClientStatusPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<StatusResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setNotice("");
    setResult(null);

    try {
      const response = await fetch("/api/status/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setNotice(data.error || "Could not check status.");
        return;
      }

      setResult(data);
    } catch {
      setNotice("Could not check status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const progress = Math.max(0, Math.min(100, Number(result?.photoProgress || 0)));

  return (
    <main
      className="min-h-screen bg-[#020202] bg-cover bg-center bg-fixed px-5 py-7 text-white sm:px-8"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, rgba(0,0,0,.15), rgba(0,0,0,.92)), url('/backgrounds/camvelle-background.png')",
      }}
    >
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="text-xs uppercase tracking-[0.45em] text-white/50">
            Camvelle Creative
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.3em] text-white backdrop-blur-2xl"
          >
            Home
          </Link>
        </header>

        <section className={`mt-6 ${crystalBubble} p-7 sm:p-10`}>
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-white/40">
            Camvelle Creative
          </p>

          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            Booking Status
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">
            Enter the email used on your booking request to view your current
            status, contract progress, invoice status, and photo delivery update.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">
                Email Address
              </span>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-[1.4rem] border border-white/20 bg-white/90 px-5 py-4 text-black outline-none placeholder:text-black/35 focus:border-white"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white px-6 py-4 text-sm font-bold uppercase tracking-[0.35em] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Checking..." : "Check Status"}
            </button>
          </form>

          {notice && (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
              {notice}
            </div>
          )}
        </section>

        {result && (
          <section className={`${crystalBubble} p-7 sm:p-10`}>
            {!result.found ? (
              <div>
                <p className="text-xl font-semibold text-white">
                  No status found
                </p>

                <p className="mt-4 text-sm leading-7 text-white/55">
                  {result.message}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-white/40">
                  Status Found
                </p>

                <h2 className="mt-5 text-4xl font-semibold text-white">
                  {result.clientName}
                </h2>

                <p className="mt-3 text-sm leading-7 text-white/50">
                  {result.sessionType}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-2xl">
                    <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/35">
                      Booking
                    </p>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                        result.bookingStatus
                      )}`}
                    >
                      {result.bookingStatus}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-2xl">
                    <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/35">
                      Contract
                    </p>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                        result.contractStatus
                      )}`}
                    >
                      {result.contractStatus}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-2xl">
                    <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/35">
                      Invoice
                    </p>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                        result.invoiceStatus
                      )}`}
                    >
                      {result.invoiceStatus}
                    </span>
                  </div>
                </div>

                <div className={`mt-6 ${crystalCard} p-6`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                        Photo Delivery
                      </p>

                      <h3 className="mt-3 text-2xl font-semibold text-white">
                        {result.photoStatus || "Not Started"}
                      </h3>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                        result.photoStatus
                      )}`}
                    >
                      {progress}%
                    </span>
                  </div>

                  <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                        Estimated Delivery
                      </p>
                      <p className="mt-2 text-sm text-white/60">
                        {result.estimatedDelivery || "Not listed"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                        Gallery
                      </p>

                      {result.galleryUrl ? (
                        <a
                          href={result.galleryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex text-sm font-semibold text-white underline underline-offset-4"
                        >
                          Open Gallery
                        </a>
                      ) : (
                        <p className="mt-2 text-sm text-white/60">
                          Not available yet
                        </p>
                      )}
                    </div>
                  </div>

                  {result.photoNotes && (
                    <p className="mt-5 text-sm leading-7 text-white/50">
                      {result.photoNotes}
                    </p>
                  )}
                </div>

                <p className="mt-8 text-sm leading-7 text-white/40">
                  Last updated: {result.lastUpdated}
                </p>

                <p className="mt-4 text-sm leading-7 text-white/45">
                  For questions or updates, reply to your Camvelle Creative
                  email thread.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
