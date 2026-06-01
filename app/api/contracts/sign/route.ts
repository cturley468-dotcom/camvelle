import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token = String(body.token || "").trim();
    const signedName = String(body.signedName || "").trim();
    const signedEmail = String(body.signedEmail || "").trim();
    const agreed = Boolean(body.agreed);
    const signatureDataUrl = String(body.signatureDataUrl || "").trim();

    if (!token) {
      return NextResponse.json(
        { error: "Missing signing token." },
        { status: 400 }
      );
    }

    if (!signedName) {
      return NextResponse.json(
        { error: "Please type your full name to sign." },
        { status: 400 }
      );
    }

    if (!signedEmail) {
      return NextResponse.json(
        { error: "Please enter your email to sign." },
        { status: 400 }
      );
    }

    if (!agreed) {
      return NextResponse.json(
        { error: "Please confirm that you agree to the contract terms." },
        { status: 400 }
      );
    }

    if (!signatureDataUrl.startsWith("data:image/png;base64,")) {
  return NextResponse.json(
    { error: "Please draw your signature before submitting." },
    { status: 400 }
  );
}


    const supabaseAdmin = getSupabaseAdmin();

    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("signing_token", token)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Contract not found." },
        { status: 404 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://camvelle.vercel.app";

    const signedPdfUrl = `${origin}/api/contracts/pdf?token=${encodeURIComponent(
      token
    )}`;

    if (contract.signed_at) {
      return NextResponse.json({
        success: true,
        message: "Contract was already signed.",
        contract: {
          ...contract,
          signed_pdf_url: contract.signed_pdf_url || signedPdfUrl,
        },
      });
    }

    const now = new Date();
    const signedDate = now.toISOString().slice(0, 10);

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "";

    const userAgent = request.headers.get("user-agent") || "";

    const { data: updatedContract, error: updateError } = await supabaseAdmin
      .from("contracts")
      .update({
        status: "signed",
        signed_name: signedName,
        signed_email: signedEmail,
        signed_date: signedDate,
        signed_at: now.toISOString(),
        signed_ip: ip,
        signed_user_agent: userAgent,
        signed_pdf_url: signedPdfUrl,
        signed_signature_data_url: signatureDataUrl,
        signed_method: "drawn",
      })
      .eq("id", contract.id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contract signed successfully.",
      contract: updatedContract,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
