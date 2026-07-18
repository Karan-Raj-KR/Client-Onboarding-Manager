import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function maskKey(key?: string) {
  if (!key) return 'MISSING';
  if (key.length < 8) return '***';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

async function testGroq() {
  console.log('\n--- 1. GROQ ---');
  const apiKey = process.env.GROQ_API_KEY;
  console.log(`Key present: ${maskKey(apiKey)}`);
  
  if (!apiKey) {
    console.log('❌ FAIL: Missing GROQ_API_KEY');
    return;
  }

  try {
    const openai = new OpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey,
      timeout: 10000, // 10 second timeout
    });
    const res = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Say "hello world" in exactly 2 words.' }],
      max_tokens: 20,
    });
    console.log(`✅ SUCCESS: Model replied: "${res.choices[0]?.message?.content?.trim()}"`);
  } catch (error: any) {
    console.log(`❌ FAIL: ${error.message}`);
  }
}

async function testSupabase() {
  console.log('\n--- 2. SUPABASE ---');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log(`URL present: ${url ? 'YES' : 'MISSING'}`);
  console.log(`Key present: ${maskKey(key)}`);

  if (!url || !key) {
    console.log('❌ FAIL: Missing Supabase URL or Key');
    return;
  }

  try {
    const supabase = createClient(url, key);
    const { count, error } = await supabase.from('deals').select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ FAIL: ${error.message}`);
    } else {
      console.log(`✅ SUCCESS: Connected to 'deals' table. Row count: ${count}`);
    }
  } catch (error: any) {
    console.log(`❌ FAIL: ${error.message}`);
  }
}

async function testResend() {
  console.log('\n--- 3. RESEND ---');
  const key = process.env.RESEND_API_KEY;
  console.log(`Key present: ${maskKey(key)}`);

  if (!key) {
    console.log('❌ FAIL: Missing RESEND_API_KEY (Not strictly required unless using email features)');
    return;
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000);
    // Make a safe GET request to test auth without sending an email
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal
    });
    clearTimeout(id);
    
    if (res.ok) {
      console.log('✅ SUCCESS: Key is valid and authenticated.');
    } else {
      const data = await res.json().catch(() => null);
      console.log(`❌ FAIL: ${res.status} ${res.statusText} - ${data?.message || 'Unknown Auth Error'}`);
    }
  } catch (error: any) {
    console.log(`❌ FAIL: ${error.message}`);
  }
}

async function run() {
  console.log('Starting Diagnostic Checks...');
  await testSupabase();
  await testResend();
  await testGroq();
  console.log('\nDiagnostic Checks Complete.');
}

run();
