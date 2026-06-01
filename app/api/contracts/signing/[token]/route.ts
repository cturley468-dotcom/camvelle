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

export async function GET(_request: Request, context: any) {
  try {
    const params = await context.params;
    const token = params?.token;

    if (!token) {
      return NextResponse.json(
        { error: "Missing signing token." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: contract, error } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("signing_token", token)
      .single();

    if (error || !contract) {
      return NextResponse.json(
        { error: "Contract not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      contract: {
        id: contract.id,
        title:
          contract.title ||
          contract.contract_type ||
          "Photography Agreement",
        contract_type:
          contract.contract_type || "Photography Agreement",
        status: contract.status || "draft",
        client_name: contract.client_name || "",
        client_email: contract.client_email || "",
        notes: contract.notes || "",
        sent_date: contract.sent_date || null,
        signed_date: contract.signed_date || null,
        signed_name: contract.signed_name || null,
        signed_email: contract.signed_email || null,
        signed_at: contract.signed_at || null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
