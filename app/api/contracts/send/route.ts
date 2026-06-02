import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { buildContract } from "../../../lib/contractTemplate";
import type { ContractType } from "../../../lib/contracts";

export const runtime = "nodejs";

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    const contractFromEmail =
      process.env.CONTRACT_FROM_EMAIL ||
      "Camvelle Creative <contracts@camvelle.com>";

    const replyToEmail =
      process.env.CAMVELLE_REPLY_TO_EMAIL || "cam@camvelle.com";

    const ownerEmail = process.env.CAMVELLE_OWNER_EMAIL;

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL." },
        { status: 500 }
      );
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY." },
        { status: 500 }
      );
    }

    const { contractId } = await request.json();

    if (!contractId) {
      return NextResponse.json(
        { error: "Missing contractId." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: contractError?.message || "Contract not found." },
        { status: 404 }
      );
    }

    let client: any = null;

    if (contract.client_id) {
      const { data: clientData } = await supabaseAdmin
        .from("clients")
        .select("*")
        .eq("id", contract.client_id)
        .single();

      client = clientData;
    }

    const clientName = clean(
      contract.client_name || client?.full_name || client?.name,
      "there"
    );

    const clientEmail = clean(contract.client_email || client?.email);

  const rawContractType = clean(
  contract.contract_type || contract.type || contract.session_type || contract.service_type || contract.title,
  "portrait"
);

const normalizedContractType = rawContractType
  .toLowerCase()
  .trim()
  .replace(/_/g, "-");

let contractType: ContractType = "portrait";

if (normalizedContractType.includes("proposal")) {
  contractType = "proposal";
} else if (normalizedContractType.includes("engagement")) {
  contractType = "engagement";
} else if (normalizedContractType.includes("couple")) {
  contractType = "couples";
} else if (normalizedContractType.includes("family")) {
  contractType = "family";
} else if (normalizedContractType.includes("portrait")) {
  contractType = "portrait";
} else if (
  normalizedContractType.includes("business") ||
  normalizedContractType.includes("branding")
) {
  contractType = "business";
} else if (
  normalizedContractType.includes("real-estate") ||
  normalizedContractType.includes("real estate") ||
  normalizedContractType.includes("realestate")
) {
  contractType = "real-estate";
} else if (
  normalizedContractType.includes("automotive") ||
  normalizedContractType.includes("auto")
) {
  contractType = "automotive";
} else if (normalizedContractType.includes("event")) {
  contractType = "events";
} else if (normalizedContractType.includes("wedding")) {
  contractType = "wedding";
}
console.log("Contract Type:", rawContractType);
console.log("Normalized:", normalizedContractType);
console.log("Matched:", contractType);


    if (!clientEmail) {
      return NextResponse.json(
        { error: "This contract does not have a client email." },
        { status: 400 }
      );
    }

    const token = contract.signing_token || crypto.randomUUID();

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://camvelle.vercel.app";

    const signingUrl = `${origin}/contract-sign/${token}`;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("contracts")
      .update({
        signing_token: token,
        signing_url: signingUrl,
        status: "sent",
        sent_date: today,
        sent_at: now,
      })
      .eq("id", contract.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    const bcc =
      ownerEmail &&
      ownerEmail.toLowerCase().trim() !== clientEmail.toLowerCase().trim()
        ? [ownerEmail]
        : undefined;

    const builtContract = buildContract(contractType);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "camvelle-app/1.0",
      },
      body: JSON.stringify({
        from: contractFromEmail,
        reply_to: replyToEmail,
        to: [clientEmail],
        bcc,
        subject: `${builtContract.title} from Camvelle Creative`,
        html: `
          <div style="margin:0;padding:0;background:#f7f4ef;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
              Your Camvelle Creative contract is ready for review and signature.
            </div>

            <div style="margin:24px 0;padding:20px;border:1px solid #e5e7eb;border-radius:16px;background:#fafafa;">
             <h2 style="margin:0 0 12px;font-size:18px;color:#111827;">
             ${builtContract.title}
             </h2>
            <pre style="white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:#374151;margin:0;">
             ${builtContract.body}
             </pre>
            </div>

            <div style="max-width:640px;margin:0 auto;padding:32px 18px;font-family:Arial,Helvetica,sans-serif;color:#151515;">
              <div style="background:#ffffff;border:1px solid #e8e2d8;border-radius:28px;padding:34px;">
                <p style="margin:0 0 10px 0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#777;">
                  Camvelle Creative
                </p>

                <h1 style="margin:0 0 26px 0;font-size:34px;line-height:1.05;font-weight:500;letter-spacing:-1px;">
                  Contract Ready
                </h1>

                <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;">
                  Hi ${escapeHtml(clientName)},
                </p>

                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.7;color:#333;">
                  Your contract from Camvelle Creative is ready for review and signature.
                </p>

                <div style="border:1px solid #eee6dc;border-radius:22px;padding:22px;margin:0 0 26px 0;background:#fbfaf8;">
                  <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;">
                    <strong>Contract:</strong> ${escapeHtml(contractType)}
                  </p>

                  <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;">
                    <strong>Client:</strong> ${escapeHtml(clientName)}
                  </p>

                  <p style="margin:0;font-size:14px;line-height:1.6;">
                    <strong>Status:</strong> Ready to Sign
                  </p>
                </div>


                <p style="margin:0 0 28px 0;">
                  <a href="${escapeHtml(signingUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:999px;padding:15px 24px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                    Review & Sign Contract
                  </a>
                </p>

                <p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:#333;">
                  After signing, a completed copy will be emailed for your records.
                </p>

                <p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:#333;">
                  Thank you for choosing Camvelle Creative.
                </p>

                <p style="margin:0;font-size:13px;color:#777;">
                  Camvelle.com
                </p>
              </div>

              <p style="margin:18px 0 0 0;text-align:center;font-size:12px;color:#999;">
                Replies go directly to Camvelle Creative.
              </p>
            </div>
          </div>
        `,
        text: `Hi ${clientName},

Your contract from Camvelle Creative is ready for review and signature.


Contract: ${contractType}
Client: ${clientName}
Status: Ready to Sign

Review and sign your contract here:
${signingUrl}

After signing, a completed copy will be emailed for your records.

Thank you for choosing Camvelle Creative.

Camvelle.com`,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      return NextResponse.json(
        { error: emailResult?.message || "Contract email could not be sent." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contract sent successfully.",
      signingUrl,
      resendId: emailResult?.id || null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
