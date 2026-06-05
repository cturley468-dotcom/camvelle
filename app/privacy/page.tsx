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

export default function PrivacyPage() {
  return (
    <CamvellePageShell>
      <CamvellePanel className="p-8 text-center md:p-14">
        <CamvelleEyebrow>Camvelle Creative</CamvelleEyebrow>

        <CamvelleHeading>
          Privacy
          <br />
          Policy.
        </CamvelleHeading>

        <CamvelleBody>
          This page explains how Camvelle Creative collects, uses, and protects
          information submitted through camvelle.com.
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
        <LegalSection title="Information We Collect">
          Camvelle Creative may collect your name, email address, phone number,
          event/session details, location preferences, booking details, contract
          information, invoice information, payment status, and messages you
          submit through the website.
        </LegalSection>

        <LegalSection title="How We Use Information">
          Information is used to respond to inquiries, manage bookings, prepare
          photography or creative services, send contracts and invoices, deliver
          galleries, process payments, and communicate with clients.
        </LegalSection>

        <LegalSection title="Payments">
          Payments may be processed through Stripe. Camvelle Creative does not
          store full credit card numbers on this website. Payment processing is
          handled through Stripe’s secure payment system.
        </LegalSection>

        <LegalSection title="Client Galleries">
          Client galleries may include images, videos, filenames, and delivery
          links. Private gallery links should only be shared with people you want
          to have access to the delivered materials.
        </LegalSection>

        <LegalSection title="Email Communications">
          By submitting a booking request, signing a contract, receiving an
          invoice, or using the client gallery system, you agree that Camvelle
          Creative may contact you by email regarding your project, booking,
          invoice, contract, payment, gallery, or service updates.
        </LegalSection>

        <LegalSection title="Data Protection">
          Camvelle Creative uses reasonable technical and organizational steps to
          protect client information. However, no website, database, or online
          transmission can be guaranteed completely secure.
        </LegalSection>

        <LegalSection title="Third-Party Services">
          Camvelle Creative may use third-party services such as Supabase,
          Resend, Vercel, Stripe, and other business tools to operate the
          website, store records, send emails, host files, and process payments.
        </LegalSection>

        <LegalSection title="Contact">
          Questions about this Privacy Policy can be sent to cam@camvelle.com.
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
