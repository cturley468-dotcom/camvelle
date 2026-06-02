"use client";

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
};

function statusClass(status: string | undefined) {
  if (status === "Signed" || status === "Paid" || status === "Received") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  }

  if (status === "Sent") {
    return "border-sky-400/30 bg-sky-400/10 text-sky-200";
  }

  if (status === "Draft") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  }

  return "border-white/10 bg-white/5 text-white/45";
}

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
    } catch (error) {
      setNotice("Could not check status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-7 shadow-2xl sm:p-10">
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-white/35">
            Camvelle Creative
          </p>

          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            Booking Status
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/55">
            Enter the email used on your booking request to view your current
            Camvelle Creative status.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/35">
                Email Address
              </span>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none placeholder:text-white/25 focus:border-white/30"
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
          <section className="mt-6 rounded-[2.5rem] border border-white/10 bg-black/50 p-7 sm:p-10">
            {!result.found ? (
              <div>
                <p className="text-xl font-semibold text-white">
                  No status found
                </p>

                <p className="mt-4 text-sm leading-7 text-white/50">
                  {result.message}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-white/35">
                  Status Found
                </p>

                <h2 className="mt-5 text-3xl font-semibold text-white">
                  {result.clientName}
                </h2>

                <p className="mt-3 text-sm leading-7 text-white/45">
                  {result.sessionType}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/30">
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

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/30">
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

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/30">
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
