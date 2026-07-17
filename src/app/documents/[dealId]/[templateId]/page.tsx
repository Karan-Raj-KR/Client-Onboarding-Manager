'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import { useKagazStore } from '@/lib/store';

/**
 * Lightweight markdown-to-HTML renderer.
 * Handles: headings, bold, italic, horizontal rules, tables, ordered/unordered lists, paragraphs.
 * No external dependency needed.
 */
function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  let html = '';
  let inTable = false;
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
      if (inTable) { html += '</tbody></table>'; inTable = false; }
      html += '<hr class="my-6 border-border/60" />';
      continue;
    }

    // Table row
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
      const cells = line.split('|').filter((c) => c.trim() !== '');
      
      // Check if this is a separator row
      if (cells.every((c) => /^[\s-:]+$/.test(c))) continue;

      if (!inTable) {
        inTable = true;
        // First row is header
        html += '<table class="w-full text-xs my-4 border-collapse"><thead><tr class="border-b-2 border-border">';
        cells.forEach((cell) => {
          html += `<th class="py-2 px-3 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">${inlineFormat(cell.trim())}</th>`;
        });
        html += '</tr></thead><tbody>';
        continue;
      }

      html += '<tr class="border-b border-border/50">';
      cells.forEach((cell) => {
        html += `<td class="py-2 px-3 font-medium text-foreground">${inlineFormat(cell.trim())}</td>`;
      });
      html += '</tr>';
      continue;
    } else if (inTable) {
      html += '</tbody></table>';
      inTable = false;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
      const level = headingMatch[1].length;
      const text = inlineFormat(headingMatch[2]);
      const styles: Record<number, string> = {
        1: 'text-xl font-black tracking-tighter text-foreground mt-8 mb-4',
        2: 'text-base font-black tracking-tight text-foreground mt-6 mb-3',
        3: 'text-sm font-bold text-foreground mt-5 mb-2',
        4: 'text-xs font-bold text-muted-foreground uppercase tracking-widest mt-4 mb-2',
        5: 'text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-3 mb-1',
        6: 'text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-3 mb-1',
      };
      html += `<h${level} class="${styles[level] || styles[3]}">${text}</h${level}>`;
      continue;
    }

    // Unordered list items
    if (/^[-*]\s+/.test(line.trim())) {
      if (!inList || listType !== 'ul') {
        if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
        html += '<ul class="space-y-1.5 my-3 ml-4">';
        inList = true;
        listType = 'ul';
      }
      const text = inlineFormat(line.trim().replace(/^[-*]\s+/, ''));
      html += `<li class="text-xs font-medium text-foreground leading-relaxed list-disc">${text}</li>`;
      continue;
    }

    // Ordered list items
    if (/^\d+\.\s+/.test(line.trim())) {
      if (!inList || listType !== 'ol') {
        if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
        html += '<ol class="space-y-1.5 my-3 ml-4">';
        inList = true;
        listType = 'ol';
      }
      const text = inlineFormat(line.trim().replace(/^\d+\.\s+/, ''));
      html += `<li class="text-xs font-medium text-foreground leading-relaxed list-decimal">${text}</li>`;
      continue;
    }

    // Close list if we're not in a list item anymore
    if (inList && line.trim() !== '') {
      html += listType === 'ul' ? '</ul>' : '</ol>';
      inList = false;
    }

    // Empty line
    if (line.trim() === '') {
      continue;
    }

    // Paragraph
    html += `<p class="text-xs font-medium text-foreground leading-relaxed my-2">${inlineFormat(line)}</p>`;
  }

  if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
  if (inTable) html += '</tbody></table>';

  return html;
}

/** Inline formatting: bold, italic, inline code */
function inlineFormat(text: string): string {
  // Bold + Italic
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code
  text = text.replace(/`(.*?)`/g, '<code class="bg-neutral-100 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>');
  return text;
}

export default function DocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.dealId as string;
  const templateId = params.templateId as string;

  const state = useKagazStore();
  const deal = state.deals.find((d) => d.id === dealId);
  const doc = deal?.tailored_documents?.find((d) => d.template_id === templateId);

  if (!deal || !doc || doc.status !== 'ready') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="p-10 text-center glass rounded-3xl animate-in fade-in max-w-md mx-auto space-y-3">
          <h2 className="text-2xl font-black text-rose-600 tracking-tight">Document Not Found</h2>
          <p className="text-sm font-medium text-muted-foreground">This document does not exist or is still being generated.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 transition-colors text-white text-sm font-bold rounded-full shadow-[0_4px_14px_0_rgb(0,0,0,0.15)]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const renderedHtml = renderMarkdown(doc.markdown);

  return (
    <div className="min-h-screen bg-background/50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl space-y-6 animate-in slide-in-from-bottom-4 duration-700 fade-in pb-12">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4 no-print">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 border border-border bg-white rounded-full hover:bg-neutral-50 text-muted-foreground transition-all hover:-translate-x-1 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-foreground">{doc.name}</h1>
              <p className="text-xs font-medium text-muted-foreground">Tailored for {deal.client_name} &middot; {deal.project_title}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 border border-border bg-white hover:bg-neutral-50 text-xs font-bold rounded-full text-foreground transition-all shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Download PDF / Print</span>
            </button>
          </div>
        </div>

        {/* Document Card */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-border/40 p-8 md:p-12 print-container print-card relative overflow-hidden">
          
          {/* Subtle background pattern */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-neutral-900/5 rounded-bl-full -z-10 blur-3xl pointer-events-none" />

          {/* Brand header */}
          <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-border/60 pb-8 mb-8">
            <div className="space-y-2.5">
              <span className="text-2xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-500">{state.business.brand_name}</span>
              <p className="text-[11px] font-medium text-muted-foreground max-w-sm leading-relaxed">{state.business.address}</p>
              <p className="text-[11px] font-bold text-foreground">GSTIN: {state.business.gstin}</p>
            </div>
            
            <div className="md:text-right space-y-2">
              <h2 className="text-lg font-black text-foreground tracking-tighter uppercase">{doc.name}</h2>
              <div className="text-[11px] font-medium text-muted-foreground space-y-1">
                <p>Client: <span className="font-bold text-foreground">{deal.client_name}</span></p>
                <p>Project: <span className="font-bold text-foreground">{deal.project_title}</span></p>
              </div>
            </div>
          </div>

          {/* Rendered markdown content */}
          <div 
            className="document-content"
            dangerouslySetInnerHTML={{ __html: renderedHtml }} 
          />

          {/* Footer */}
          <div className="border-t border-dashed border-border/80 pt-8 mt-12 text-center text-muted-foreground text-[10px] space-y-1.5 font-medium">
            <p>This document was prepared via <strong>KĀRYO</strong> Client Onboarding Manager.</p>
            <p>Tailored specifically for {deal.client_name} &middot; {deal.project_title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
