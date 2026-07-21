import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const receiptSchema = {
  type: "object",
  properties: {
    amountCents: { anyOf: [{ type: "integer" }, { type: "null" }] },
  },
  required: ["amountCents"],
  additionalProperties: false,
};

export async function scanReceiptAmount(imageBase64: string, mediaType: "image/jpeg" | "image/png"): Promise<number | null> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 256,
    output_config: { format: { type: "json_schema", schema: receiptSchema } },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          {
            type: "text",
            text: "This is a photo of a restaurant receipt. Find the final total amount paid (the grand total, including tax and tip if included in it). Return it in cents as an integer. If you cannot confidently find a total, return null.",
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  const parsed = JSON.parse(textBlock.text) as { amountCents: number | null };
  return parsed.amountCents && parsed.amountCents > 0 ? parsed.amountCents : null;
}
