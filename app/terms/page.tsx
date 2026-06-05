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

export default function TermsPage() {
  return (
    <CamvellePageShell>
      <CamvellePanel className="p-8 text-center md:p-14">
        <CamvelleEyebrow>Camvelle Creative</CamvelleEyebrow>

        <CamvelleHeading>
          Terms of
          <br />
          Service.
        </CamvelleHeading>

        <CamvelleBody>
          These terms apply to the use of camvelle.com and services provided by
          Camvelle Creative.
        </CamvelleBody>

        <div className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className={camvelleCreamButton}>
            Return Home
          </Link>

          <Link href="/privacy" className={camvelleGhostButton}>
            Privacy
          </Link>
        </div>
      </CamvellePanel>

      <CamvellePanel className="mt-6 p-7 md:p-12">
        <LegalSection title="Services">
          Camvelle Creative provides photography, video, design, digital gallery,
          and creative services. Specific services, deliverables, pricing,
          timelines, and usage rights may be described in a client contract,
          invoice, proposal, or written communication.
        </LegalSection>

        <LegalSection title="Bookings">
          Submitting a booking request does not guarantee availability. A session
          is considered confirmed only after Camvelle Creative accepts the
          booking and any required contract, deposit, retainer, or invoice terms
          are completed.
        </LegalSection>

        <LegalSection title="Client Responsibilities">
          Clients are responsible for providing accurate contact information,
          session details, location information, deadlines, permissions, and any
          required access needed to complete the work.
        </LegalSection>

        <LegalSection title="Payments">
          Invoices are due according to the terms listed on the invoice or
          contract. Payments may be processed through Stripe or another approved
          payment method. Failure to pay may delay scheduling, editing, delivery,
          or release of final materials.
        </LegalSection>

        <LegalSection title="Contracts">
          Some services may require a signed agreement before work begins or
          before final delivery. Electronic signatures submitted through
          Camvelle Creative systems are treated as client authorization.
        </LegalSection>

        <LegalSection title="Image and Gallery Delivery">
          Final galleries are delivered digitally unless otherwise agreed.
          Delivery timelines may vary depending on project size, editing needs,
          client communication, and business workload.
        </LegalSection>

        <LegalSection title="Usage Rights">
          Unless otherwise agreed in writing, Camvelle Creative retains copyright
          ownership of original creative work. Clients receive usage rights for
          the final delivered images, videos, or materials according to the
          contract or written agreement.
        </LegalSection>

        <LegalSection title="Website Use">
          You agree not to misuse camvelle.com, attempt unauthorized access,
          interfere with the website, copy protected materials without
          permission, or use the site for unlawful purposes.
        </LegalSection>

        <LegalSection title="Limitation of Liability">
          Camvelle Creative is not responsible for indirect, incidental, or
          consequential damages related to use of the website or services. The
          maximum responsibility for a service issue is limited to the amount
          paid for the specific service involved.
        </LegalSection>

        <LegalSection title="Contact">
          Questions about these Terms can be sent to cam@camvelle.com.
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
