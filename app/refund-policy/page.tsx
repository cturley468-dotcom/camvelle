import Link from "next/link";
import {
  CamvellePageShell,
  CamvellePanel,
  CamvelleInnerPanel,
  CamvelleEyebrow,
  CamvelleHeading,
  CamvelleBody,
  camvelleCreamButton,
  camvelleGhostButton,
} from "@/app/components/CamvelleUI";

export default function RefundPolicyPage() {
  return (
    <CamvellePageShell>
      <CamvellePanel className="p-8 text-center md:p-14">
        <CamvelleEyebrow>Camvelle Creative</CamvelleEyebrow>

        <CamvelleHeading>
          Refund
          <br />
          Policy.
        </CamvelleHeading>

        <CamvelleBody>
          This policy explains how cancellations, rescheduling, retainers,
          payments, and refunds are handled for Camvelle Creative services.
        </CamvelleBody>

        <div className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className={camvelleCreamButton}>
            Return Home
          </Link>

          <Link href="/terms" className={camvelleGhostButton}>
            Terms
          </Link>
        </div>
      </CamvellePanel>

      <CamvellePanel className="mt-6 p-7 md:p-12">
        <LegalSection title="Deposits and Retainers">
          Deposits or retainers may be required to reserve a date, begin work, or
          secure creative services. Unless otherwise stated in writing, deposits
          and retainers are generally non-refundable because they reserve time,
          preparation, planning, and availability.
        </LegalSection>

        <LegalSection title="Rescheduling">
          Camvelle Creative will make reasonable efforts to reschedule when
          possible. Rescheduling is subject to availability and may require a new
          date, updated agreement, or revised invoice.
        </LegalSection>

        <LegalSection title="Client Cancellations">
          If a client cancels a confirmed session or project, any refund will
          depend on the amount of work already completed, preparation time,
          booked time, expenses, and the terms of the specific contract or
          invoice.
        </LegalSection>

        <LegalSection title="Weather or Unforeseen Conditions">
          Outdoor sessions may be affected by weather, venue restrictions, safety
          concerns, or other conditions. When possible, Camvelle Creative may
          recommend rescheduling instead of canceling.
        </LegalSection>

        <LegalSection title="Completed Digital Work">
          Once digital files, edited images, videos, galleries, PDFs, or final
          deliverables have been released, payments for completed work are
          generally not refundable.
        </LegalSection>

        <LegalSection title="No-Show Policy">
          If a client does not arrive for a scheduled session and does not
          communicate in a reasonable timeframe, payments may be forfeited and a
          new booking may be required.
        </LegalSection>

        <LegalSection title="Refund Review">
          Refund requests are reviewed case by case. Approved refunds may be
          returned to the original payment method when possible. Processing times
          may vary depending on the payment provider.
        </LegalSection>

        <LegalSection title="Contact">
          Refund or rescheduling questions can be sent to cam@camvelle.com.
        </LegalSection>

        <p className="mt-10 text-sm leading-7 text-white/35">
          Last updated: June 2026
        </p>
      </CamvellePanel>
    </CamvellePageShell>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <CamvelleInnerPanel className="mb-4 p-6">
      <h2 className="text-2xl font-light tracking-[-0.04em] text-white">
        {title}
      </h2>

      <p className="mt-4 text-sm leading-7 text-white/55">{children}</p>
    </CamvelleInnerPanel>
  );
}
