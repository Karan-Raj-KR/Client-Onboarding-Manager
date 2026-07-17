// Mock localStorage before importing store
const storageMock: Record<string, string> = {};
if (typeof global.window === 'undefined') {
  (global as any).window = {
    localStorage: {
      getItem: (key: string) => storageMock[key] || null,
      setItem: (key: string, value: string) => {
        storageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete storageMock[key];
      },
      clear: () => {
        for (const k in storageMock) delete storageMock[k];
      },
    },
  } as any;
}

import {
  getKagazState,
  resetKagazStore,
  extractDealWithAI,
  updateDeal,
  generateQuote,
  acceptQuote,
  simulatePayment,
  api,
  paiseToRupee,
  rupeeToPaise,
  formatINR,
} from './store';

function runTests() {
  console.log('🧪 Starting Kagaz Core Logic Tests...\n');

  // Test 1: Currency Conversion
  console.log('Test 1: Currency Conversion');
  if (paiseToRupee(3500000) !== 35000) throw new Error('paiseToRupee failed');
  if (rupeeToPaise(35000) !== 3500000) throw new Error('rupeeToPaise failed');
  if (rupeeToPaise(41300.55) !== 4130055) throw new Error('rupeeToPaise with decimals failed');
  console.log('✅ Currency Conversion passed.');

  // Test 2: Store Initialization and Seed Data
  console.log('\nTest 2: Store Initialization and Seed Data');
  resetKagazStore();
  const state = getKagazState();
  if (state.deals.length !== 4) throw new Error('Deals length should be 4');
  if (state.business.brand_name !== 'KĀRYO') throw new Error('Brand name should be KĀRYO');
  
  // Dashboard state check (Seed totals)
  const initialSummary = api.getDashboardSummary();
  // Paid (₹50,000) + Payment Pending (₹28,000) = Won (₹78,000)
  if (initialSummary.amounts_paise.won !== 7800000) {
    throw new Error(`Initial won should be 7800000 paise, got ${initialSummary.amounts_paise.won}`);
  }
  // Paid = Collected (₹50,000)
  if (initialSummary.amounts_paise.collected !== 5000000) {
    throw new Error(`Initial collected should be 5000000 paise, got ${initialSummary.amounts_paise.collected}`);
  }
  // Quoted = Quoted (₹42,000)
  if (initialSummary.amounts_paise.quoted !== 4200000) {
    throw new Error(`Initial quoted should be 4200000 paise, got ${initialSummary.amounts_paise.quoted}`);
  }
  console.log('✅ Store Initialization and Dashboard seed data calculations passed.');

  // Test 3: AI Extraction
  console.log('\nTest 3: AI Extraction');
  const demoDeal = state.deals.find(d => d.id === 'dl_demo');
  if (!demoDeal) throw new Error('Demo deal dl_demo not found');
  if (demoDeal.status !== 'New') throw new Error('Demo deal should start as status: New');

  const extracted = extractDealWithAI('dl_demo');
  if (!extracted || extracted.status !== 'Draft') throw new Error('AI Extraction failed to set status Draft');
  if (extracted.line_items.length === 0) throw new Error('AI Extraction should populate line items');
  console.log('✅ AI Extraction flow passed.');

  // Test 4: Editable Deal details
  console.log('\nTest 4: Editable Deal Details');
  const updated = updateDeal('dl_demo', {
    project_title: 'Restaurant Website with Online Ordering (Updated)',
  });
  if (!updated || updated.project_title !== 'Restaurant Website with Online Ordering (Updated)') {
    throw new Error('Update deal details failed');
  }
  console.log('✅ Deal editing passed.');

  // Test 5: Quotation Generation
  console.log('\nTest 5: Quotation Generation');
  const quote = generateQuote('dl_demo', '2026-07-24', '50% advance.');
  if (!quote) throw new Error('Generate quote failed');
  if (quote.number !== 'Q-2026-0004') throw new Error(`Quote number mismatch, got ${quote.number}`);
  // Subtotal should be ₹35,000 (pre-GST)
  if (quote.subtotal_paise !== 3500000) throw new Error(`Quote subtotal should be 3500000 paise, got ${quote.subtotal_paise}`);
  // Tax should be 18% of ₹35,000 = ₹6,300
  if (quote.tax_paise !== 630000) throw new Error(`Quote tax should be 630000 paise, got ${quote.tax_paise}`);
  // Total should be ₹41,300
  if (quote.total_paise !== 4130000) throw new Error(`Quote total should be 4130000 paise, got ${quote.total_paise}`);
  
  // Dashboard check after quote
  const summaryAfterQuote = api.getDashboardSummary();
  // Quoted should now be seed ₹42,000 + new ₹35,000 = ₹77,000
  if (summaryAfterQuote.amounts_paise.quoted !== 7700000) {
    throw new Error(`Quoted should be 7700000 paise, got ${summaryAfterQuote.amounts_paise.quoted}`);
  }
  console.log('✅ Quote generation and pre-GST Quoted value aggregation passed.');

  // Test 6: Acceptance Cascade (Idempotency and Dashboard Won Transition)
  console.log('\nTest 6: Acceptance Cascade and Idempotency');
  const cascade1 = acceptQuote(quote.public_token, 'Aditi Sharma');
  if (!cascade1) throw new Error('First quote acceptance failed');
  if (cascade1.invoice.number !== 'INV-2026-0003') {
    throw new Error(`Expected invoice INV-2026-0003, got ${cascade1.invoice.number}`);
  }
  
  // Idempotency check: accept again
  const cascade2 = acceptQuote(quote.public_token, 'Aditi Sharma');
  if (!cascade2) throw new Error('Second quote acceptance failed');
  if (cascade2.invoice.id !== cascade1.invoice.id) {
    throw new Error('Idempotency failed: generated a duplicate invoice');
  }

  // Dashboard check: Won value should increase by ₹35,000 (pre-GST value)
  // Won = initial ₹78,000 + ₹35,000 = ₹113,000 (11,300,000 paise)
  const summaryAfterAccept = api.getDashboardSummary();
  if (summaryAfterAccept.amounts_paise.won !== 11300000) {
    throw new Error(`Won amount should be 11300000 paise (pre-GST), got ${summaryAfterAccept.amounts_paise.won}`);
  }
  // Quoted should drop back to ₹42,000 since this deal transitioned to Won/Payment Pending
  if (summaryAfterAccept.amounts_paise.quoted !== 4200000) {
    throw new Error(`Quoted amount should be 4200000 paise, got ${summaryAfterAccept.amounts_paise.quoted}`);
  }
  console.log('✅ Acceptance cascade, idempotency, and pre-GST Won value aggregation passed.');

  // Test 7: Simulated Payment Completion
  console.log('\nTest 7: Simulated Payment');
  const paidInvoice = simulatePayment(cascade1.invoice.id);
  if (!paidInvoice || paidInvoice.status !== 'Paid') throw new Error('Simulate payment failed');

  // Dashboard check: Collected should increase by ₹35,000 (pre-GST value)
  // Collected = initial ₹50,000 + ₹35,000 = ₹85,000 (8,500,000 paise)
  const finalSummary = api.getDashboardSummary();
  if (finalSummary.amounts_paise.collected !== 8500000) {
    throw new Error(`Collected amount should be 8500000 paise (pre-GST), got ${finalSummary.amounts_paise.collected}`);
  }
  // Won remains ₹113,000
  if (finalSummary.amounts_paise.won !== 11300000) {
    throw new Error(`Won amount should still be 11300000 paise, got ${finalSummary.amounts_paise.won}`);
  }
  console.log('✅ Simulated payment and pre-GST Collected value aggregation passed.');

  console.log('\n🎉 ALL KAGAZ CORE TESTS PASSED SUCCESSFULLY! 🎉\n');
}

try {
  runTests();
} catch (e) {
  console.error('❌ Test execution failed:');
  console.error(e);
  process.exit(1);
}
