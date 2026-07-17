'use client';

import React, { useState } from 'react';
import { Save, HelpCircle, FileText, Plus, X, Upload } from 'lucide-react';
import { useKagazStore, saveKagazState } from '@/lib/store';
import OwnerShell from '@/components/OwnerShell';

export default function DocumentTemplatesSettings() {
  const state = useKagazStore();
  const templates = state.templates || [];

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBody, setNewBody] = useState('');
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use FileReader to read text content
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewBody(event.target.result as string);
        if (!newName) {
          // Default to the file name without extension
          setNewName(file.name.replace(/\.[^/.]+$/, ""));
        }
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be uploaded again if needed
    e.target.value = '';
  };

  // Save new template to state
  const handleSaveNew = () => {
    if (!newName.trim() || !newBody.trim()) return;

    const newTemplateId = `tpl_${Math.random().toString(36).substring(2, 9)}`;
    const newTemplate = {
      id: newTemplateId,
      name: newName,
      body_markdown: newBody,
    };

    saveKagazState({
      ...state,
      templates: [...templates, newTemplate],
    });

    setIsAdding(false);
    setNewName('');
    setNewBody('');
  };

  return (
    <OwnerShell>
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 fade-in pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-foreground">Document Templates</h1>
            <p className="text-xs font-medium text-muted-foreground">Manage templates for AI-tailored client documents.</p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-full transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.2)] hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Template</span>
          </button>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/50 p-4 rounded-2xl space-y-2 shadow-sm">
          <h4 className="font-black text-xs text-blue-800 uppercase tracking-wider flex items-center">
            <HelpCircle className="w-4 h-4 mr-1.5" /> Template Variables
          </h4>
          <p className="text-xs font-medium text-blue-900/80 leading-relaxed">
            Write your templates in plain text or Markdown. The AI will automatically tailor the document by reading the context of the deal, replacing placeholders, and adjusting wording where appropriate. Good placeholders to use: <strong>[CLIENT NAME]</strong>, <strong>[PROJECT TITLE]</strong>, <strong>[TIMELINE]</strong>, <strong>[TOTAL AMOUNT]</strong>, <strong>[SCOPE OF WORK]</strong>.
          </p>
        </div>

        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="glass rounded-3xl p-6 border border-border/60 hover:border-border/80 transition-all group flex flex-col space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-neutral-100 p-2 rounded-xl">
                    <FileText className="w-5 h-5 text-neutral-600" />
                  </div>
                  <h3 className="font-bold text-base text-foreground">{template.name}</h3>
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-xl p-4 border border-border/40">
                <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {template.body_markdown}
                </pre>
              </div>
            </div>
          ))}
          
          {templates.length === 0 && (
            <div className="text-center py-12 glass rounded-3xl border border-dashed border-border">
              <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm font-bold text-foreground">No templates found</p>
              <p className="text-xs font-medium text-muted-foreground mt-1">Add a new document template to get started.</p>
            </div>
          )}
        </div>

        {/* Add Template Modal */}
        {isAdding && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-6 border-b border-border/50">
                <h3 className="font-black text-lg text-foreground tracking-tight">Add New Template</h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Template Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Non-Disclosure Agreement"
                    className="w-full px-4 py-3 bg-neutral-50 border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
                
                <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Template Body (Markdown)
                    </label>
                    <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold rounded-lg transition-colors border border-border">
                      <Upload className="w-3 h-3" />
                      <span>Upload .md / .txt file</span>
                      <input 
                        type="file" 
                        accept=".md,.txt,text/plain,text/markdown" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                      />
                    </label>
                  </div>
                  <textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    placeholder="Paste your template content here..."
                    className="w-full flex-1 min-h-[300px] p-4 bg-neutral-50 border border-border rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-muted-foreground/50 resize-y custom-scrollbar"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-border/50 bg-neutral-50/50 flex justify-end gap-3">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-5 py-2.5 bg-white border border-border hover:bg-neutral-50 text-neutral-900 text-xs font-bold rounded-xl transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNew}
                  disabled={!newName.trim() || !newBody.trim()}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Template</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </OwnerShell>
  );
}
