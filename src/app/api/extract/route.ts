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

const SYSTEM_PROMPT = `You are "Kagaz AI", an extraction engine for an Indian freelancer's client-onboarding tool.

Your job: read a single, often messy, Hinglish, WhatsApp-style client enquiry and return the structured deal data as ONE JSON object.

Output rules (strict):
- Return ONLY the raw JSON object. Do not include any text before or after the JSON object. Do not wrap it in markdown code fences.
- Use exactly these keys and value types:

{
  "project_title": string | null,        // short title for the work, e.g. "Restaurant Website with Online Ordering"
  "client_name": string | null,          // the client's name only if stated; otherwise null
  "client_phone": string | null,         // the client's phone number only if present in the text; otherwise null
  "scope_summary": string | null,        // 1-2 sentence plain-English summary of what they want built
  "timeline_days": number | null,        // delivery timeline in whole days, only if the client commits to one
  "budget_min_paise": number | null,     // lower budget bound in PAISE (rupees x 100)
  "budget_max_paise": number | null,     // upper budget bound in PAISE (rupees x 100)
  "missing_information": string[],        // short questions/items you would need to ask to produce a complete quote
  "confidence_bps": number               // 0-10000 basis points (10000 = 100%) for how much was clearly stated vs inferred
}

Extraction rules:
- For any field you cannot confidently determine from the text, use null. Do NOT fabricate a value.
- NEVER invent client_name or client_phone. If the enquiry does not contain them, set them to null and add them to missing_information.
- Budgets are in PAISE: convert rupee amounts by multiplying by 100. "k" means thousand. Example: "budget 30-40k" -> budget_min_paise: 3000000, budget_max_paise: 4000000. A single figure like "around 50k" sets both min and max to 5000000.
- timeline_days is only a number the client commits to. A question such as "kitne din lagenge?" is the client ASKING, not stating - leave timeline_days null and add the question to missing_information.
- missing_information lists what is genuinely absent and needed for a quote (e.g. "Client name", "Phone number", "GSTIN", "Menu item pricing", "Confirmed delivery timeline"). Return [] only if nothing meaningful is missing.
- confidence_bps reflects overall clarity: mostly explicit -> high (e.g. 9000+), heavily inferred or vague -> low (e.g. 4000-6000).

Do not include any text before or after the JSON object. Do not wrap it in markdown code fences.`;

export async function POST(request: Request) {
  try {
    const { rawText } = await request.json();

    if (!rawText) {
      return NextResponse.json({ ok: false, error: 'Missing rawText in request body' }, { status: 400 });
    }

    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json({ ok: false, error: 'missing key' }, { status: 500 });
    }

    const openai = getOpenAIClient();
    
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: rawText }
    ];

    let content = '';
    let parsedData = null;

    try {
      const response = await openai.chat.completions.create({
        model: 'meta/llama-3.3-70b-instruct',
        messages,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      content = response.choices[0]?.message?.content || '';
      if (!content) throw new Error('No content in response from model');

      let cleanStr = content.trim();
      if (cleanStr.startsWith('```json')) cleanStr = cleanStr.substring(7);
      else if (cleanStr.startsWith('```')) cleanStr = cleanStr.substring(3);
      if (cleanStr.endsWith('```')) cleanStr = cleanStr.substring(0, cleanStr.length - 3);
      cleanStr = cleanStr.trim();

      parsedData = JSON.parse(cleanStr);
    } catch (initialError: any) {
      console.warn('Initial extraction or parse failed, retrying once...', initialError.message);
      
      messages.push({ role: 'assistant', content });
      messages.push({ 
        role: 'user', 
        content: `Your previous response failed to parse as valid JSON. Error: ${initialError.message}. Please fix the format and return ONLY a valid JSON object without markdown fences.` 
      });

      const retryResponse = await openai.chat.completions.create({
        model: 'meta/llama-3.3-70b-instruct',
        messages,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const retryContent = retryResponse.choices[0]?.message?.content || '';
      if (!retryContent) throw new Error('No content in retry response from model');

      let cleanStr = retryContent.trim();
      if (cleanStr.startsWith('```json')) cleanStr = cleanStr.substring(7);
      else if (cleanStr.startsWith('```')) cleanStr = cleanStr.substring(3);
      if (cleanStr.endsWith('```')) cleanStr = cleanStr.substring(0, cleanStr.length - 3);
      cleanStr = cleanStr.trim();

      parsedData = JSON.parse(cleanStr);
    }

    return NextResponse.json({ ok: true, data: parsedData });
  } catch (error: any) {
    console.error('API /extract Error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
