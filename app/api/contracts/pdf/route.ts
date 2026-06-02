import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { buildContract } from "../../../lib/contractTemplate";
import type { ContractType } from "../../../lib/contracts";

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

function formatStatus(value: string | null) {
  const status = String(value || "draft").trim();

  return status
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: unknown) {
  const text = String(value || "").trim();

  if (!text) return "Not listed";

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) return text;

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function makeFileName(value: unknown) {
  return (
    clean(value, "client")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "client"
  );
}

function getContractType(contract: any): ContractType {
  const rawContractType = clean(
    contract.contract_type ||
      contract.type ||
      contract.session_type ||
      contract.service_type ||
      contract.title,
    ""
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

  return contractType;
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

    const query = token
      ? supabaseAdmin
          .from("contracts")
          .select("*")
          .eq("signing_token", token)
          .single()
      : supabaseAdmin
          .from("contracts")
          .select("*")
          .eq("id", contractId)
          .single();

    const { data: contract, error } = await query;

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
    const softGray = rgb(0.72, 0.72, 0.72);
    const lightGray = rgb(0.88, 0.88, 0.88);
    const warmPanel = rgb(0.98, 0.97, 0.95);
    const veryLightGray = rgb(0.96, 0.96, 0.96);

    const pageWidth = 612;
    const pageHeight = 792;
    const left = 58;
    const right = 554;
    const contentWidth = right - left;
    const topY = 720;
    const bottomSafeY = 108;

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

    function drawDivider(gap = 34) {
      ensureSpace(gap + 12);

      y -= 8;

      page.drawLine({
        start: { x: left, y },
        end: { x: right, y },
        thickness: 1,
        color: lightGray,
      });

      y -= gap;
    }

    function drawSectionTitle(title: string) {
      ensureSpace(38);

      page.drawText(title, {
        x: left,
        y,
        size: 16,
        font: bold,
        color: black,
      });

      y -= 30;
    }

    function drawLabel(label: string, value: string) {
      ensureSpace(24);

      page.drawText(label, {
        x: left,
        y,
        size: 10.5,
        font: bold,
        color: black,
      });

      page.drawText(value, {
        x: 190,
        y,
        size: 10.5,
        font: regular,
        color: black,
      });

      y -= 24;
    }

    function drawParagraph(text: string) {
      const lines = wrapText(text, regular, 10.5, contentWidth);
      ensureSpace(lines.length * 16 + 14);

      for (const line of lines) {
        page.drawText(line, {
          x: left,
          y,
          size: 10.5,
          font: regular,
          color: black,
        });

        y -= 16;
      }

      y -= 12;
    }

   const contractType = getContractType(contract);
const builtContract = buildContract(contractType);

const contractTitle = builtContract.title;
const contractTerms = builtContract.body;

    const clientName = clean(contract.client_name);
    const clientEmail = clean(contract.client_email);
    const status = formatStatus(contract.status);
    const sentDate = clean(contract.sent_date);
    const signedDate = clean(contract.signed_date);
    const signedName = clean(contract.signed_name);
    const signedEmail = clean(contract.signed_email);
    const signedAt = formatDateTime(contract.signed_at);
    const isSigned = Boolean(contract.signed_at || contract.status === "signed");

    const documentTitle = isSigned ? "SIGNED CONTRACT" : "CONTRACT";

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

    y -= 50;

    page.drawText(documentTitle, {
      x: left,
      y,
      size: 34,
      font: bold,
      color: black,
    });

    page.drawText(status, {
      x: 430,
      y: y + 8,
      size: 12,
      font: bold,
      color: gray,
    });

    y -= 54;

    // Summary card
const cardHeight = 156;

page.drawRectangle({
  x: left,
  y: y - cardHeight,
  width: contentWidth,
  height: cardHeight,
  color: warmPanel,
  borderColor: lightGray,
  borderWidth: 1,
});

page.drawText("Agreement", {
  x: left + 24,
  y: y - 34,
  size: 10,
  font: bold,
  color: gray,
});

const contractTitleLines = wrapText(contractTitle, bold, 15, 300).slice(0, 3);

contractTitleLines.forEach((line, index) => {
  page.drawText(line, {
    x: left + 24,
    y: y - 62 - index * 19,
    size: 15,
    font: bold,
    color: black,
  });
});

page.drawText("Client", {
  x: left + 24,
  y: y - 126,
  size: 10,
  font: bold,
  color: gray,
});

page.drawText(clientName, {
  x: left + 76,
  y: y - 126,
  size: 10.5,
  font: regular,
  color: black,
});

page.drawText("Status", {
  x: 420,
  y: y - 34,
  size: 10,
  font: bold,
  color: gray,
});

page.drawText(status, {
  x: 420,
  y: y - 58,
  size: 13,
  font: bold,
  color: black,
});

page.drawText("Signed Date", {
  x: 420,
  y: y - 92,
  size: 10,
  font: bold,
  color: gray,
});

page.drawText(signedDate, {
  x: 420,
  y: y - 114,
  size: 10.5,
  font: regular,
  color: black,
});


    y -= cardHeight + 44;

    drawSectionTitle("Contract Details");

    drawLabel("Contract:", contractTitle);
    drawLabel("Client:", clientName);
    drawLabel("Email:", clientEmail);
    drawLabel("Status:", status);
    drawLabel("Sent Date:", sentDate);
    drawLabel("Signed Date:", signedDate);
    drawLabel("Signed By:", signedName);
    drawLabel("Signed Email:", signedEmail);

    drawDivider(36);

    drawSectionTitle("Agreement Terms");

const contractParagraphs = contractTerms
  .split(/\n{2,}/)
  .map((section) => section.trim())
  .filter(Boolean);

for (const paragraph of contractParagraphs) {
  drawParagraph(paragraph);
}

if (clean(contract.notes, "")) {
  drawSectionTitle("Additional Notes");
  drawParagraph(clean(contract.notes));
}

drawParagraph(
  "This document records the client's electronic signature and agreement confirmation."
);


    drawDivider(36);

    const signatureDataUrl = String(
      contract.signed_signature_data_url || ""
    ).trim();

    const hasDrawnSignature = signatureDataUrl.startsWith(
      "data:image/png;base64,"
    );

    const signatureBoxHeight = hasDrawnSignature ? 168 : 0;
    const signatureDetailsHeight = 160;

    ensureSpace(44 + signatureBoxHeight + signatureDetailsHeight);

    drawSectionTitle("Electronic Signature");

    if (hasDrawnSignature) {
      const base64 = signatureDataUrl.split(",")[1];
      const signatureBytes = Buffer.from(base64, "base64");
      const signatureImage = await pdfDoc.embedPng(signatureBytes);

      const boxHeight = 150;
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
        y: boxTop - 26,
        size: 10,
        font: bold,
        color: gray,
      });

      const maxSignatureWidth = 260;
      const maxSignatureHeight = 78;

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

    drawLabel("Signed Name:", signedName);
    drawLabel("Signed Email:", signedEmail);
    drawLabel("Signed At:", signedAt);
    drawLabel("Signing Method:", clean(contract.signed_method, "Electronic"));
    drawLabel("IP Record:", clean(contract.signed_ip));
    drawLabel("Record ID:", clean(contract.id));

    page.drawLine({
      start: { x: left, y: 124 },
      end: { x: right, y: 124 },
      thickness: 1,
      color: softGray,
    });

    drawFooter(page);

    const pdfBytes = await pdfDoc.save();

    const filename = `${makeFileName(contract.client_name)}-signed-contract.pdf`;

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
