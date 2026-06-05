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

export default function PaymentCancelPage() {
  return (
    <CamvellePageShell>
      <CamvellePanel className="mx-auto max-w-4xl p-8 text-center md:p-14">
        <CamvelleEyebrow>Payment Canceled</CamvelleEyebrow>

        <CamvelleHeading>
          Payment
          <br />
          not completed.
        </CamvelleHeading>

        <CamvelleBody>
          No payment was processed. You can return to your invoice email and try
          again whenever you are ready.
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
