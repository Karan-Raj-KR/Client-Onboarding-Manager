import { POST as ExtractPOST } from '../src/app/api/extract/route';
import { POST as TailorPOST } from '../src/app/api/tailor/route';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
  console.log('Testing /api/extract...');
  const extractReq = new Request('http://localhost/api/extract', {
    method: 'POST',
    body: JSON.stringify({
      rawText: "bhai ek naya restaurant khol rahe hain hum 'Spice Route' naam se koramangala me. Hame ek badhiya website chahiye jisme online ordering bhi ho, whatsapp integration ke saath. Budget around 30k se 40k max hai. Kitne din lagenge banne me? jaldi start karna hai",
      sourceType: "WhatsApp chat"
    })
  });
  
  const extractRes = await ExtractPOST(extractReq);
  const extractData = await extractRes.json();
  console.log('Extract Result:', JSON.stringify(extractData, null, 2));

  if (!extractData.ok) {
    console.error('Extract failed, aborting tailor test.');
    return;
  }

  console.log('\nTesting /api/tailor...');
  const tailorReq = new Request('http://localhost/api/tailor', {
    method: 'POST',
    body: JSON.stringify({
      template_body: "Hi [CLIENT NAME],\n\nThis is a proposal for [PROJECT TITLE].\n\nThe timeline is [TIMELINE_DAYS] days.\n\nBudget is ₹[BUDGET_MIN] to ₹[BUDGET_MAX].",
      deal: extractData.data
    })
  });
  
  const tailorRes = await TailorPOST(tailorReq);
  const tailorData = await tailorRes.json();
  console.log('Tailor Result:\n', tailorData.tailored_markdown);
}

run().catch(console.error);
