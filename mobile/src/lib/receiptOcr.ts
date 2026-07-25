import { createWorker } from "tesseract.js";

const TOTAL_KEYWORDS = /\b(totaal|total|te betalen|amount due|balance due|grand total)\b/i;
const MONEY_PATTERN = /(\d{1,4}[.,]\d{2})\b/g;

function parseAmountToken(token: string): number | null {
  const value = parseFloat(token.replace(",", "."));
  if (Number.isNaN(value) || value <= 0) return null;
  return Math.round(value * 100);
}

function extractTotalCents(text: string): number | null {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!TOTAL_KEYWORDS.test(line)) continue;
    const matches = [...line.matchAll(MONEY_PATTERN)];
    if (matches.length === 0) continue;
    const cents = parseAmountToken(matches[matches.length - 1][1]);
    if (cents) return cents;
  }

  return null;
}

export async function recognizeReceiptTotal(
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png"
): Promise<number | null> {
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(`data:${mimeType};base64,${imageBase64}`);
    return extractTotalCents(data.text);
  } finally {
    await worker.terminate();
  }
}
