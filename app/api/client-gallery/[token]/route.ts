import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

type RouteContext = {
  params: {
    token: string;
  } | Promise<{
    token: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { token } = await Promise.resolve(context.params);
    const cleanToken = String(token || "").trim();

    if (!cleanToken) {
      return NextResponse.json(
        { error: "Missing gallery token." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from("client_galleries")
      .select(
        "id, client_id, client_name, title, description, status, share_token, cover_image_url, expires_at, delivered_at, created_at"
      )
      .eq("share_token", cleanToken)
      .single();

    if (galleryError || !gallery) {
      return NextResponse.json(
        { error: "Gallery not found." },
        { status: 404 }
      );
    }

    if (gallery.status === "archived") {
      return NextResponse.json(
        { error: "This gallery is no longer available." },
        { status: 404 }
      );
    }

    if (gallery.expires_at) {
      const expiresAt = new Date(gallery.expires_at).getTime();

      if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
        return NextResponse.json(
          { error: "This gallery link has expired." },
          { status: 410 }
        );
      }
    }

    const { data: photos, error: photosError } = await supabaseAdmin
      .from("client_gallery_photos")
      .select(
        "id, gallery_id, file_name, file_url, file_type, file_size, sort_order, is_cover, created_at"
      )
      .eq("gallery_id", gallery.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (photosError) {
      return NextResponse.json(
        { error: photosError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      gallery,
      photos: photos || [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
