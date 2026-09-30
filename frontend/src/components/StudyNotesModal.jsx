import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  X, 
  BookMarked, 
  Download, 
  Trash2, 
  Copy, 
  Check, 
  Search,
  BookOpen
} from 'lucide-react';

export default function StudyNotesModal({ isOpen, onClose, notes = [], onRemoveNote, onClearAllNotes }) {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(search.toLowerCase()) || 
    (n.question && n.question.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExportMarkdown = () => {
    let md = `# AI Tutor Copilot — Study Notes & Revision Sheet\n\n`;
    md += `*Exported on: ${new Date().toLocaleDateString()}*\n\n---\n\n`;
    notes.forEach((note, i) => {
      md += `### Note ${i + 1}: ${note.question || 'Concept Explanation'}\n`;
      md += `*Mode: ${note.mode || 'Normal Tutor'}*\n\n`;
      md += `${note.content}\n\n`;
      if (note.sources && note.sources.length > 0) {
        md += `**Sources:**\n`;
        note.sources.forEach(s => {
          md += `- ${s.source}: ${s.excerpt}\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Tutor_Study_Notes_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    let text = notes.map((n, i) => `Note ${i + 1}: ${n.question || ''}\n${n.content}\n`).join('\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge" style={{ background: 'var(--grad-amber)' }}>
              <BookMarked size={20} />
            </div>
            <div>
              <div className="modal-title">Saved Study Notes ({notes.length})</div>
              <div className="modal-subtitle">Bookmarked concepts and textbook explanations</div>
            </div>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-tertiary)' }}>
              <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p>You haven't bookmarked any explanations yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
                Click the <strong>Bookmark</strong> button on any tutor response to save it here for fast revision!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Search saved notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem 0.65rem 2.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {filteredNotes.map((note, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                        {note.question ? `Q: ${note.question.slice(0, 60)}...` : `Note #${idx + 1}`}
                      </span>
                      <button 
                        className="action-btn-small" 
                        onClick={() => onRemoveNote(idx)}
                        title="Remove note"
                      >
                        <Trash2 size={13} style={{ color: '#f43f5e' }} />
                      </button>
                    </div>

                    <div className="markdown-body" style={{ fontSize: '0.85rem', maxHeight: '180px', overflowY: 'auto' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {note.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {notes.length > 0 && (
            <>
              <button className="btn-secondary" onClick={handleCopyAll}>
                {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy All'}</span>
              </button>
              <button className="btn-secondary" onClick={handleExportMarkdown}>
                <Download size={14} />
                <span>Export Markdown</span>
              </button>
            </>
          )}
          <button className="btn-primary" onClick={onClose}>
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
