import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");

  return createClient(supabaseUrl, serviceRoleKey);
}

function clean(value: unknown, fallback = "Not listed") {
  const text = String(value || "").trim();
  return text || fallback;
}

function money(value: unknown) {
  const number = Number(value || 0);
  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function wrapText(text: string, maxChars = 86) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;

    if (testLine.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });

  if (line) lines.push(line);
  return lines;
}

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const url = new URL(request.url);

    const token = url.searchParams.get("token");
    const contractId = url.searchParams.get("contractId");

    if (!token && !contractId) {
      return NextResponse.json(
        { error: "Missing contract token or contractId." },
        { status: 400 }
      );
    }

    let query = supabaseAdmin.from("contracts").select("*");

    if (token) {
      query = query.eq("signing_token", token);
    } else {
      query = query.eq("id", contractId);
    }

    const { data: contract, error } = await query.single();

    if (error || !contract) {
      return NextResponse.json(
        { error: "Contract not found." },
        { status: 404 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);

    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const black = rgb(0.08, 0.08, 0.08);
    const gray = rgb(0.35, 0.35, 0.35);
    const lightGray = rgb(0.75, 0.75, 0.75);

    let y = 720;

    function drawLabel(label: string, value: string) {
      page.drawText(label, {
        x: 64,
        y,
        size: 11,
        font: bold,
        color: black,
      });

      page.drawText(value, {
        x: 190,
        y,
        size: 11,
        font: regular,
        color: black,
      });

      y -= 24;
    }

    page.drawText("CAMVELLE CREATIVE", {
      x: 64,
      y,
      size: 16,
      font: bold,
      color: black,
    });

    y -= 22;

    page.drawText("Photography • Video • Design", {
      x: 64,
      y,
      size: 9,
      font: regular,
      color: gray,
    });

    y -= 48;

    page.drawText("SIGNED CONTRACT", {
      x: 64,
      y,
      size: 32,
      font: bold,
      color: black,
    });

    y -= 50;

    drawLabel(
      "Contract:",
      clean(contract.title || contract.contract_type, "Photography Agreement")
    );
    drawLabel("Client:", clean(contract.client_name));
    drawLabel("Email:", clean(contract.client_email));
    drawLabel("Status:", clean(contract.status, "signed"));
    drawLabel("Sent Date:", clean(contract.sent_date));
    drawLabel("Signed Date:", clean(contract.signed_date));
    drawLabel("Signed By:", clean(contract.signed_name));
    drawLabel("Signed Email:", clean(contract.signed_email));

    y -= 20;

    page.drawLine({
      start: { x: 64, y },
      end: { x: 548, y },
      thickness: 1,
      color: lightGray,
    });

    y -= 42;

    page.drawText("Agreement Terms", {
      x: 64,
      y,
      size: 16,
      font: bold,
      color: black,
    });

    y -= 28;

    const agreementText =
      clean(contract.notes, "") ||
      "This agreement confirms photography services provided by Camvelle Creative. The client agrees to the session details, payment expectations, delivery terms, image usage rights, and project terms connected to this booking.";

    const terms = [
      "This agreement confirms photography services provided by Camvelle Creative.",
      "The client confirms that they reviewed the agreement and approved the terms for this photography service.",
      agreementText,
      "This document records the client's electronic signature and agreement confirmation.",
    ];

    terms.forEach((paragraph) => {
      const lines = wrapText(paragraph, 82);

      lines.forEach((line) => {
        page.drawText(line, {
          x: 64,
          y,
          size: 11,
          font: regular,
          color: black,
        });

        y -= 17;
      });

      y -= 12;
    });

    y -= 20;

    page.drawLine({
      start: { x: 64, y },
      end: { x: 548, y },
      thickness: 1,
      color: lightGray,
    });

    y -= 42;

    page.drawText("Electronic Signature", {
      x: 64,
      y,
      size: 16,
      font: bold,
      color: black,
    });

    const signatureDataUrl = clean(contract.signed_signature_data_url, "");

if (signatureDataUrl.startsWith("data:image/png;base64,")) {
  const base64 = signatureDataUrl.split(",")[1];
  const signatureBytes = Buffer.from(base64, "base64");
  const signatureImage = await pdfDoc.embedPng(signatureBytes);

  y -= 30;

  page.drawText("Drawn Signature:", {
    x: 64,
    y,
    size: 11,
    font: bold,
    color: black,
  });

  const maxWidth = 220;
  const scale = maxWidth / signatureImage.width;
  const signatureWidth = signatureImage.width * scale;
  const signatureHeight = signatureImage.height * scale;

  page.drawImage(signatureImage, {
    x: 190,
    y: y - signatureHeight + 18,
    width: signatureWidth,
    height: signatureHeight,
  });

  y -= signatureHeight + 24;
}


    y -= 30;

    drawLabel("Signed Name:", clean(contract.signed_name));
    drawLabel("Signed Email:", clean(contract.signed_email));
    drawLabel("Signed At:", clean(contract.signed_at));
    drawLabel("IP Record:", clean(contract.signed_ip));
    drawLabel("Record ID:", clean(contract.id));

    page.drawText("Thank you for choosing Camvelle Creative.", {
      x: 64,
      y: 58,
      size: 10,
      font: regular,
      color: gray,
    });

    page.drawText("Camvelle.com", {
      x: 64,
      y: 38,
      size: 10,
      font: regular,
      color: gray,
    });

    const pdfBytes = await pdfDoc.save();

    const filename = `${clean(contract.client_name, "client")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-signed-contract.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
