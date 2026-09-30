import React, { useRef } from 'react';
import { 
  BookOpen, 
  UploadCloud, 
  FileText, 
  Layers, 
  Sparkles, 
  HelpCircle, 
  Database, 
  Cpu, 
  CheckCircle2,
  X
} from 'lucide-react';

export default function Sidebar({ 
  isOpen, 
  onClose, 
  documents, 
  statusData, 
  onSelectPrompt,
  onOpenKnowledge,
  onUploadFile 
}) {
  const fileInputRef = useRef(null);

  const starters = [
    {
      category: 'Physics',
      prompt: 'Explain Newton’s Three Laws of Motion with simple everyday examples.',
    },
    {
      category: 'Biology',
      prompt: 'Why is the cell called the fundamental structural and functional unit of life?',
    },
    {
      category: 'Chemistry',
      prompt: 'What is the key difference between a mixture and a chemical compound?',
    },
    {
      category: 'Mathematics',
      prompt: 'How do you find the zeroes of a polynomial? Give a step-by-step example.',
    },
    {
      category: 'Physics',
      prompt: 'What is the Universal Law of Gravitation and why is G called a constant?',
    }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <span className="sidebar-title">
          <BookOpen size={16} style={{ color: 'var(--accent-indigo)' }} />
          Study Materials
        </span>
        <button className="icon-button" onClick={onClose} title="Collapse Sidebar">
          <X size={16} />
        </button>
      </div>

      <div className="sidebar-content">
        {/* Document Library Section */}
        <div className="sidebar-section">
          <div className="section-label">
            <span>Textbooks & Notes</span>
            <span style={{ color: 'var(--accent-indigo)', fontWeight: 'bold' }}>
              {documents?.length || 2}
            </span>
          </div>

          {documents && documents.length > 0 ? (
            documents.map((doc, idx) => (
              <div key={idx} className="doc-card" title={doc.name}>
                <div className="doc-icon-box">
                  <FileText size={16} />
                </div>
                <div className="doc-info">
                  <div className="doc-name">{doc.name.replace('.pdf', '')}</div>
                  <div className="doc-meta">
                    {doc.size_mb ? `${doc.size_mb} MB` : doc.size_kb ? `${Math.round(doc.size_kb / 1024 * 10) / 10} MB` : 'PDF'} • NCERT
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="doc-card">
                <div className="doc-icon-box">
                  <FileText size={16} />
                </div>
                <div className="doc-info">
                  <div className="doc-name">Mathematics Class 9</div>
                  <div className="doc-meta">6.1 MB • NCERT Textbook</div>
                </div>
              </div>
              <div className="doc-card">
                <div className="doc-icon-box">
                  <FileText size={16} />
                </div>
                <div className="doc-info">
                  <div className="doc-name">Science Class 9</div>
                  <div className="doc-meta">27.3 MB • NCERT Textbook</div>
                </div>
              </div>
            </>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf" 
            style={{ display: 'none' }} 
          />
          <button 
            className="upload-btn-compact"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={16} />
            <span>Upload Additional PDF</span>
          </button>
        </div>

        {/* Quick Question Starters */}
        <div className="sidebar-section">
          <div className="section-label">
            <span>Explore Curriculum</span>
            <Sparkles size={13} style={{ color: 'var(--accent-amber)' }} />
          </div>
          {starters.map((item, i) => (
            <button
              key={i}
              className="starter-btn"
              onClick={() => onSelectPrompt(item.prompt)}
            >
              <span className="starter-tag">{item.category}</span>
              <span>{item.prompt}</span>
            </button>
          ))}
        </div>

        {/* System RAG Telemetry */}
        <div className="sidebar-section">
          <div className="section-label">
            <span>RAG Architecture</span>
            <Database size={13} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="system-info-box">
            <div className="info-row">
              <span>LLM Engine</span>
              <span className="info-val">Gemini 2.5 Flash</span>
            </div>
            <div className="info-row">
              <span>Embeddings</span>
              <span className="info-val">3,072 Dim Vector</span>
            </div>
            <div className="info-row">
              <span>Vector Index</span>
              <span className="info-val">{statusData?.total_chunks || 450}+ Chunks</span>
            </div>
            <div className="info-row">
              <span>Retrieval Mode</span>
              <span className="info-val">Cosine FlatIP RAG</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
