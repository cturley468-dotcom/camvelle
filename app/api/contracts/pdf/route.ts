import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

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

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);

    if (width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

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

    let result;

    if (token) {
      result = await supabaseAdmin
        .from("contracts")
        .select("*")
        .eq("signing_token", token)
        .single();
    } else {
      result = await supabaseAdmin
        .from("contracts")
        .select("*")
        .eq("id", contractId)
        .single();
    }

    const { data: contract, error } = result;

    if (error || !contract) {
      return NextResponse.json(
        { error: "Contract not found." },
        { status: 404 }
      );
    }

    const pdfDoc = await PDFDocument.create();

    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const black = rgb(0.08, 0.08, 0.08);
    const gray = rgb(0.35, 0.35, 0.35);
    const lightGray = rgb(0.78, 0.78, 0.78);
    const veryLightGray = rgb(0.96, 0.96, 0.96);

    const pageWidth = 612;
    const pageHeight = 792;
    const left = 64;
    const right = 548;
    const contentWidth = right - left;
    const topY = 720;
    const bottomSafeY = 110;

    let page: PDFPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = topY;

    function drawFooter(targetPage: PDFPage) {
      targetPage.drawText("Thank you for choosing Camvelle Creative.", {
        x: left,
        y: 58,
        size: 10,
        font: regular,
        color: gray,
      });

      targetPage.drawText("Camvelle.com", {
        x: left,
        y: 38,
        size: 10,
        font: regular,
        color: gray,
      });
    }

    function addNewPage() {
      drawFooter(page);
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = topY;
    }

    function ensureSpace(requiredHeight: number) {
      if (y - requiredHeight < bottomSafeY) {
        addNewPage();
      }
    }

    function drawLineGap(gap = 34) {
      ensureSpace(gap + 10);

      y -= 8;

      page.drawLine({
        start: { x: left, y },
        end: { x: right, y },
        thickness: 1,
        color: lightGray,
      });

      y -= gap;
    }

    function drawLabel(label: string, value: string) {
      ensureSpace(24);

      page.drawText(label, {
        x: left,
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

    function drawSectionTitle(title: string) {
      ensureSpace(36);

      page.drawText(title, {
        x: left,
        y,
        size: 17,
        font: bold,
        color: black,
      });

      y -= 30;
    }

    function drawParagraph(text: string) {
      const lines = wrapText(text, regular, 11, contentWidth);
      ensureSpace(lines.length * 17 + 14);

      for (const line of lines) {
        page.drawText(line, {
          x: left,
          y,
          size: 11,
          font: regular,
          color: black,
        });

        y -= 17;
      }

      y -= 12;
    }

    // Header
    page.drawText("CAMVELLE CREATIVE", {
      x: left,
      y,
      size: 16,
      font: bold,
      color: black,
    });

    y -= 22;

    page.drawText("Photography • Video • Design", {
      x: left,
      y,
      size: 9,
      font: regular,
      color: gray,
    });

    y -= 48;

    page.drawText("SIGNED CONTRACT", {
      x: left,
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

    drawLineGap(36);

    drawSectionTitle("Agreement Terms");

    const agreementText =
      clean(contract.notes, "") ||
      "This agreement confirms photography services provided by Camvelle Creative. The client agrees to the session details, payment expectations, delivery terms, image usage rights, and project terms connected to this booking.";

    drawParagraph(
      "This agreement confirms photography services provided by Camvelle Creative."
    );

    drawParagraph(
      "The client confirms that they reviewed the agreement and approved the terms for this photography service."
    );

    drawParagraph(agreementText);

    drawParagraph(
      "This document records the client's electronic signature and agreement confirmation."
    );

    drawLineGap(36);

    // Signature section
    const signatureDataUrl = String(
      contract.signed_signature_data_url || ""
    ).trim();

    const hasDrawnSignature = signatureDataUrl.startsWith(
      "data:image/png;base64,"
    );

    const signatureBoxHeight = hasDrawnSignature ? 170 : 0;
    const signatureDetailsHeight = 140;

    ensureSpace(40 + signatureBoxHeight + signatureDetailsHeight);

    drawSectionTitle("Electronic Signature");

    if (hasDrawnSignature) {
      const base64 = signatureDataUrl.split(",")[1];
      const signatureBytes = Buffer.from(base64, "base64");
      const signatureImage = await pdfDoc.embedPng(signatureBytes);

      const boxHeight = 155;
      const boxTop = y;
      const boxBottom = boxTop - boxHeight;

      page.drawRectangle({
        x: left,
        y: boxBottom,
        width: contentWidth,
        height: boxHeight,
        color: veryLightGray,
        borderColor: lightGray,
        borderWidth: 1,
      });

      page.drawText("Drawn Signature", {
        x: left + 18,
        y: boxTop - 28,
        size: 10,
        font: bold,
        color: gray,
      });

      const maxSignatureWidth = 250;
      const maxSignatureHeight = 82;

      const scale = Math.min(
        maxSignatureWidth / signatureImage.width,
        maxSignatureHeight / signatureImage.height
      );

      const signatureWidth = signatureImage.width * scale;
      const signatureHeight = signatureImage.height * scale;

      page.drawImage(signatureImage, {
        x: left + 18,
        y: boxBottom + 24,
        width: signatureWidth,
        height: signatureHeight,
      });

      y -= boxHeight + 32;
    }

    drawLabel("Signed Name:", clean(contract.signed_name));
    drawLabel("Signed Email:", clean(contract.signed_email));
    drawLabel("Signed At:", clean(contract.signed_at));
    drawLabel("Signing Method:", clean(contract.signed_method, "electronic"));
    drawLabel("IP Record:", clean(contract.signed_ip));
    drawLabel("Record ID:", clean(contract.id));

    drawFooter(page);

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
