import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Force this route to run per-request on the Node runtime, never prerendered at build time.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Instantiate lazily so the client is only constructed when a request comes in, not during build.
function getOpenAIClient() {
  return new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
  });
}

const SYSTEM_PROMPT = `You are KĀRYO AI. You are given a business's OWN document template and a specific client deal. Return the SAME document, edited only where needed to fit this client and deal — replace placeholders and adapt client-specific details (names, scope, amounts, timeline, dates, payment terms). Preserve the template's structure, clauses, tone, and wording everywhere else. Do not add new clauses or invent terms not supported by the deal. Output clean markdown only, no code fences, no commentary.`;

export async function POST(request: Request) {
  try {
    const { template_body, deal } = await request.json();

    if (!template_body || !deal) {
      return NextResponse.json(
        { ok: false, error: 'Missing template_body or deal in request body' },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
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
      model: 'llama-3.3-70b-versatile',
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
