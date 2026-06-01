"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function ContractSignPage() {
  const params = useParams();

  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/35">
          CamVelle Creative
        </p>

        <h1 className="mt-6 text-5xl font-light tracking-[-0.07em]">
          Contract Signing
        </h1>

        <p className="mt-6 leading-8 text-white/55">
          This signing page is connected and ready for the next build step.
        </p>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/40 p-5 text-left text-sm text-white/45">
          <p>Signing Token:</p>
          <p className="mt-2 break-all text-white/70">{token}</p>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-[#f5f0e7] px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-black"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
