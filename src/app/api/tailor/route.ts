import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Force this route to run per-request on the Node runtime, never prerendered at build time.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Instantiate lazily so the client is only constructed when a request comes in, not during build.
function getOpenAIClient() {
  return new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: process.env.NVIDIA_API_KEY,
  });
}

const SYSTEM_PROMPT = `You are "Kagaz AI", a document tailoring engine for an Indian creative agency's client-onboarding tool.

Your job: take a business document template and a deal object, then rewrite the template so it is fully tailored to the specific client and deal.

Rules (strict):
- Replace ALL placeholders (like [CLIENT NAME], [SCOPE OF WORK], [TOTAL AMOUNT], [TIMELINE], etc.) with real data from the deal object.
- Adapt scope, payment, and timeline clauses to accurately match the deal data.
- Format monetary amounts in Indian Rupees (₹) with proper comma formatting (e.g., ₹49,560.00). All amounts in the deal are in PAISE — divide by 100 to get rupees.
- Keep the document's professional structure, tone, and formatting.
- Output clean markdown only. No code fences, no commentary, no preamble.
- Do NOT invent terms, dates, amounts, or details not supported by the deal data.
- If a placeholder has no corresponding data in the deal, use a reasonable default like "To be confirmed" rather than leaving the placeholder raw.
- For line items, format them as a bulleted list or table showing description, quantity, and amount.
- Use today's date for [DATE] fields.`;

export async function POST(request: Request) {
  try {
    const { template_body, deal } = await request.json();

    if (!template_body || !deal) {
      return NextResponse.json(
        { ok: false, error: 'Missing template_body or deal in request body' },
        { status: 400 }
      );
    }

    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'missing key' },
        { status: 500 }
      );
    }

    const openai = getOpenAIClient();

    const userContent = `TEMPLATE TO TAILOR:
---
${template_body}
---

DEAL DATA (JSON):
${JSON.stringify(deal, null, 2)}

Rewrite the template above, fully tailored to this deal. Output only the final markdown document.`;

    const response = await openai.chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content || '';
    if (!content) {
      return NextResponse.json(
        { ok: false, error: 'No content in response from model' },
        { status: 500 }
      );
    }

    // Strip code fences if the model wraps output anyway
    let cleaned = content.trim();
    if (cleaned.startsWith('```markdown')) cleaned = cleaned.substring(11);
    else if (cleaned.startsWith('```md')) cleaned = cleaned.substring(5);
    else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
    cleaned = cleaned.trim();

    return NextResponse.json({ ok: true, tailored_markdown: cleaned });
  } catch (error: any) {
    console.error('API /tailor Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
