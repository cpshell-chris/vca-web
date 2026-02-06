import advisorPrinciples from "./knowledge/advisorPrinciples.js";
import customerPsychology from "./knowledge/customerPsychology.js";
import maintenanceLogic from "./knowledge/maintenanceLogic.js";
import shopPhilosophy from "./knowledge/shopPhilosophy.js";
import complianceRules from "./knowledge/complianceRules.js";
let openaiClient;

async function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  if (!openaiClient) {
    const { default: OpenAI } = await import("openai");
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

/**
 * Build VCA intelligence from Tekmetric context.
 * This function MUST return the exact intelligence shape
 * expected by the UI renderer.
 */
export async function buildVcaIntelligence({ repairOrder }) {
  if (!repairOrder) {
    throw new Error("Missing repairOrder context");
  }

  const systemPrompt = `
You are an experienced automotive service advisor.

Rules you MUST follow:
- Use ONLY the provided repair order data.
- Do NOT invent findings.
- Do NOT infer unverified problems.
- Ignore any inspection items that are unchecked or gray.
- Be conservative and factual.
- Return ONLY valid JSON.
- Do not include markdown or commentary.
`;

  const userPrompt = `
Repair Order Data:
${JSON.stringify(repairOrder, null, 2)}

Return JSON in EXACTLY this shape:

{
  "buyingProfile": string,
  "roNotes": string,
  "customerFacingNotes": string,
  "internalNotes": {
    "Safety Issues": string[],
    "Maintenance": string[],
    "Repairs": string[]
  },
  "salesScript": string,
  "followUpSchedule": {
    "sixMonth": string[],
    "twelveMonth": string[]
  },
  "aiSuggestedOpportunities": string[]
}

Constraints:
- roNotes: 2–3 concise sentences, copy/paste ready.
- customerFacingNotes: plain language, no sales pressure.
- aiSuggestedOpportunities: OPTIONAL, conservative, clearly non-authoritative.
`;

  try {
    const openai = await getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Empty GPT response");
    }

    const parsed = JSON.parse(raw);

    return parsed;
  } catch (err) {
    console.error("⚠️ GPT intelligence failure:", err.message);

    // Safe fallback (UI-compatible)
    return {
      buyingProfile: "Information unavailable.",
      roNotes: "Inspection completed. Recommendations pending review.",
      customerFacingNotes:
        "We completed your inspection and will follow up with details shortly.",
      internalNotes: {
        "Safety Issues": [],
        "Maintenance": [],
        "Repairs": [],
      },
      salesScript:
        "Once we review the inspection results, we can discuss next steps together.",
      followUpSchedule: {
        sixMonth: [],
        twelveMonth: [],
      },
      aiSuggestedOpportunities: [],
    };
  }
}
