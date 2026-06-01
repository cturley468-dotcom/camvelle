"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, PenLine } from "lucide-react";

type SigningContract = {
  id: string;
  title: string;
  contract_type: string;
  status: string;
  client_name: string;
  client_email: string;
  notes: string | null;
  sent_date: string | null;
  signed_date: string | null;
  signed_name: string | null;
  signed_email: string | null;
  signed_at: string | null;
};

export default function ContractSignPage() {
  const params = useParams();
  const router = useRouter();

  const token = useMemo(() => String(params?.token || ""), [params]);

  const [contract, setContract] = useState<SigningContract | null>(null);
  const [signedName, setSignedName] = useState("");
  const [signedEmail, setSignedEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadContract() {
    if (!token) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/contracts/signing/${token}`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Contract could not be loaded.");
      }

      setContract(result.contract);

      if (result.contract?.client_name) {
        setSignedName(result.contract.client_name);
      }

      if (result.contract?.client_email) {
        setSignedEmail(result.contract.client_email);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Contract could not be loaded.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function signContract() {
    setSigning(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/contracts/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          signedName,
          signedEmail,
          agreed,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Contract could not be signed.");
      }

      setContract(result.contract);
      setNotice("Contract signed successfully.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Contract could not be signed.";
      setError(message);
    } finally {
      setSigning(false);
    }
  }

  const alreadySigned = Boolean(contract?.signed_at);

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <section className="mx-auto max-w-[720px] rounded-[3rem] border border-white/10 bg-black/50 px-6 py-9 shadow-2xl backdrop-blur">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
            Camvelle Creative
          </p>

          <h1 className="mt-8 text-5xl font-light tracking-[-0.08em] sm:text-7xl">
            Contract
            <br />
            Signing
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-lg leading-9 text-white/45">
            Review your agreement and sign securely below.
          </p>
        </div>

        {loading && (
          <div className="mt-12 flex items-center justify-center gap-3 rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-8 text-white/50">
            <Loader2 className="animate-spin" size={20} />
            Loading contract...
          </div>
        )}

        {!loading && error && (
          <div className="mt-12 rounded-[2rem] border border-red-400/20 bg-red-500/10 px-6 py-6 text-sm leading-7 text-red-100">
            {error}
          </div>
        )}

        {!loading && contract && (
          <>
            <div className="mt-12 rounded-[2.5rem] border border-white/10 bg-black/70 px-7 py-8">
              <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                Agreement
              </p>

              <h2 className="mt-5 text-4xl font-light tracking-[-0.06em]">
                {contract.title || "Photography Agreement"}
              </h2>

              <div className="mt-8 space-y-4 text-base leading-8 text-white/55">
                <p>
                  <span className="text-white/75">Client:</span>{" "}
                  {contract.client_name || "Client"}
                </p>

                <p>
                  <span className="text-white/75">Email:</span>{" "}
                  {contract.client_email || "Not listed"}
                </p>

                <p>
                  <span className="text-white/75">Status:</span>{" "}
                  {contract.status || "draft"}
                </p>

                {contract.sent_date && (
                  <p>
                    <span className="text-white/75">Sent Date:</span>{" "}
                    {contract.sent_date}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-[2.5rem] border border-white/10 bg-black/70 px-7 py-8">
              <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                Contract Terms
              </p>

              <div className="mt-6 space-y-5 text-base leading-8 text-white/55">
                <p>
                  This agreement confirms photography services provided by
                  Camvelle Creative. The client agrees to the session details,
                  payment expectations, delivery terms, and usage rights
                  connected to this booking.
                </p>

                {contract.notes ? (
                  <p>{contract.notes}</p>
                ) : (
                  <p>
                    Final images, delivery timing, payment terms, cancellation
                    expectations, and project details are agreed upon between the
                    client and Camvelle Creative.
                  </p>
                )}

                <p>
                  By signing below, the client confirms they have reviewed this
                  agreement and approve the terms for this photography service.
                </p>
              </div>
            </div>

            {alreadySigned ? (
              <div className="mt-6 rounded-[2.5rem] border border-emerald-400/20 bg-emerald-500/10 px-7 py-8">
                <div className="flex items-center gap-3 text-emerald-100">
                  <CheckCircle size={22} />
                  <p className="text-lg">Contract signed successfully.</p>
                </div>

                <div className="mt-6 space-y-3 text-white/55">
                  <p>Signed By: {contract.signed_name || "Client"}</p>
                  <p>Signed Email: {contract.signed_email || "Not listed"}</p>
                  <p>Signed Date: {contract.signed_date || "Not listed"}</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[2.5rem] border border-white/10 bg-black/70 px-7 py-8">
                <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                  Signature
                </p>

                <label className="mt-7 block">
                  <span className="text-[11px] uppercase tracking-[0.35em] text-white/30">
                    Full Name
                  </span>
                  <input
                    value={signedName}
                    onChange={(event) => setSignedName(event.target.value)}
                    placeholder="Type your full name"
                    className="mt-3 w-full rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-4 text-white outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </label>

                <label className="mt-5 block">
                  <span className="text-[11px] uppercase tracking-[0.35em] text-white/30">
                    Email
                  </span>
                  <input
                    value={signedEmail}
                    onChange={(event) => setSignedEmail(event.target.value)}
                    placeholder="Your email"
                    className="mt-3 w-full rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-4 text-white outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </label>

                <label className="mt-6 flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-5 text-sm leading-7 text-white/55">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                    className="mt-1 h-5 w-5"
                  />
                  <span>
                    I have reviewed this agreement and agree to electronically
                    sign this contract with Camvelle Creative.
                  </span>
                </label>

                <button
                  onClick={signContract}
                  disabled={signing}
                  className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-5 text-[12px] font-semibold uppercase tracking-[0.45em] text-black disabled:opacity-50"
                >
                  {signing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Signing...
                    </>
                  ) : (
                    <>
                      <PenLine size={18} />
                      Sign Contract
                    </>
                  )}
                </button>
              </div>
            )}

            {notice && (
              <div className="mt-6 rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 px-6 py-5 text-center text-emerald-100">
                {notice}
              </div>
            )}
          </>
        )}

        <button
          onClick={() => router.push("/")}
          className="mt-8 w-full rounded-full border border-white/10 px-6 py-5 text-[12px] font-semibold uppercase tracking-[0.45em] text-white/60"
        >
          Return Home
        </button>
      </section>
    </main>
  );
}
