"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  CamvelleBody,
  CamvelleEyebrow,
  CamvelleHeading,
  CamvelleInnerPanel,
  CamvelleInput,
  CamvellePageShell,
  CamvellePanel,
  CamvelleProgressBar,
  CamvelleStatusPill,
  camvelleCreamButton,
} from "../components/CamvelleUI";

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
    <CamvellePageShell>
      <header className="mb-10 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/branding/camvelle-logo.png"
            alt="Camvelle Creative"
            width={420}
            height={120}
            priority
            unoptimized
            className="h-14 w-auto object-contain sm:h-16 md:h-20"
          />
        </Link>

        <Link href="/" className={camvelleCreamButton}>
          Home
        </Link>
      </header>

      <CamvellePanel className="p-8 sm:p-10 md:p-14">
        <CamvelleEyebrow>Camvelle Creative</CamvelleEyebrow>

        <CamvelleHeading>
          Booking
          <br />
          Status
        </CamvelleHeading>

        <CamvelleBody>
          Enter the email used on your booking request to view your current
          project status, contract progress, invoice status, and photo delivery
          update.
        </CamvelleBody>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <label className="block">
            <span className="mb-3 block text-[11px] uppercase tracking-[0.45em] text-white/35">
              Email Address
            </span>

            <CamvelleInput
              type="email"
              required
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className={`${camvelleCreamButton} w-full disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {loading ? "Checking..." : "Check Status"}
          </button>
        </form>

        {notice && (
          <div className="mt-6 rounded-[2rem] border border-red-400/20 bg-red-400/10 p-5 text-sm leading-7 text-red-100">
            {notice}
          </div>
        )}
      </CamvellePanel>

      {result && (
        <CamvellePanel className="mt-8 p-8 sm:p-10 md:p-14">
          {!result.found ? (
            <div>
              <CamvelleEyebrow>Status</CamvelleEyebrow>

              <h2 className="mt-6 text-4xl font-light tracking-[-0.06em] text-white">
                No status found.
              </h2>

              <p className="mt-5 text-base leading-8 text-white/55">
                {result.message}
              </p>
            </div>
          ) : (
            <div>
              <CamvelleEyebrow>Status Found</CamvelleEyebrow>

              <h2 className="mt-6 text-5xl font-light leading-[0.95] tracking-[-0.07em] text-white sm:text-6xl">
                {result.clientName}
              </h2>

              <p className="mt-5 text-base leading-8 text-white/50">
                {result.sessionType}
              </p>

              <div className="mt-10 grid gap-5 md:grid-cols-3">
                <CamvelleInnerPanel className="p-6">
                  <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                    Booking
                  </p>

                  <div className="mt-5">
                    <CamvelleStatusPill status={result.bookingStatus} />
                  </div>
                </CamvelleInnerPanel>

                <CamvelleInnerPanel className="p-6">
                  <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                    Contract
                  </p>

                  <div className="mt-5">
                    <CamvelleStatusPill status={result.contractStatus} />
                  </div>
                </CamvelleInnerPanel>

                <CamvelleInnerPanel className="p-6">
                  <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                    Invoice
                  </p>

                  <div className="mt-5">
                    <CamvelleStatusPill status={result.invoiceStatus} />
                  </div>
                </CamvelleInnerPanel>
              </div>

              <CamvelleInnerPanel className="mt-6 p-7 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                      Photo Delivery
                    </p>

                    <h3 className="mt-5 text-4xl font-light tracking-[-0.06em] text-white">
                      {result.photoStatus || "Not Started"}
                    </h3>
                  </div>

                  <CamvelleStatusPill status={`${progress}%`} />
                </div>

                <CamvelleProgressBar progress={progress} />

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-white/30">
                      Estimated Delivery
                    </p>

                    <p className="mt-3 text-base leading-7 text-white/55">
                      {result.estimatedDelivery || "Not listed"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-white/30">
                      Gallery
                    </p>

                    {result.galleryUrl ? (
                      <a
                        href={result.galleryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex text-base font-semibold text-white underline underline-offset-4"
                      >
                        Open Gallery
                      </a>
                    ) : (
                      <p className="mt-3 text-base leading-7 text-white/55">
                        Not available yet
                      </p>
                    )}
                  </div>
                </div>

                {result.photoNotes && (
                  <p className="mt-8 text-base leading-8 text-white/50">
                    {result.photoNotes}
                  </p>
                )}
              </CamvelleInnerPanel>

              <p className="mt-8 text-sm leading-7 text-white/40">
                Last updated: {result.lastUpdated}
              </p>

              <p className="mt-4 text-sm leading-7 text-white/45">
                For questions or updates, reply to your Camvelle Creative email
                thread.
              </p>
            </div>
          )}
        </CamvellePanel>
      )}
    </CamvellePageShell>
  );
}
