import Link from "next/link";
import {
  CamvellePageShell,
  CamvellePanel,
  CamvelleEyebrow,
  CamvelleHeading,
  CamvelleBody,
  camvelleCreamButton,
  camvelleGhostButton,
} from "@/app/components/CamvelleUI";

export default function PaymentSuccessPage() {
  return (
    <CamvellePageShell>
      <CamvellePanel className="mx-auto max-w-4xl p-8 text-center md:p-14">
        <CamvelleEyebrow>Payment Received</CamvelleEyebrow>

        <CamvelleHeading>
          Thank you.
          <br />
          Payment complete.
        </CamvelleHeading>

        <CamvelleBody>
          Your Camvelle invoice payment was received successfully. Your invoice
          status has been updated.
        </CamvelleBody>

        <div className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className={camvelleCreamButton}>
            Return Home
          </Link>

          <Link href="/status" className={camvelleGhostButton}>
            Client Status
          </Link>
        </div>
      </CamvellePanel>
    </CamvellePageShell>
  );
}
