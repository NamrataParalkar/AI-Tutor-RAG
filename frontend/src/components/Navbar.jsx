import React from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  Brain, 
  Lightbulb, 
  Smile, 
  Compass, 
  BookMarked, 
  Library, 
  Moon, 
  Sun,
  Flame
} from 'lucide-react';

export default function Navbar({ 
  activeMode, 
  onSelectMode, 
  onOpenQuiz, 
  onOpenFlashcards, 
  onOpenNotes, 
  onOpenKnowledge, 
  notesCount,
  statusData,
  theme,
  onToggleTheme 
}) {
  const modes = [
    { id: 'normal', label: 'Tutor', icon: GraduationCap },
    { id: 'simple', label: 'Like I\'m 10', icon: Smile },
    { id: 'hint', label: 'Hint Mode', icon: Lightbulb },
    { id: 'deep', label: 'In-Depth', icon: Compass },
  ];

  return (
    <header className="navbar">
      <div className="nav-left">
        <div className="brand-wrapper">
          <div className="brand-icon-box">
            <GraduationCap size={22} />
          </div>
          <div className="brand-info">
            <span className="brand-title">
              AI Tutor Copilot
              <span className="brand-badge">RAG 2.0</span>
            </span>
          </div>
        </div>
      </div>

      <div className="nav-center">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              className={`mode-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectMode(mode.id)}
              title={mode.label}
            >
              <Icon size={14} />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      <div className="nav-right">
        {statusData?.total_chunks > 0 && (
          <div className="status-pill" title={`Vector Store: ${statusData.total_chunks} chunks indexed`}>
            <span className="status-dot"></span>
            <span>{statusData.total_chunks} Chunks Ready</span>
          </div>
        )}

        <button 
          className="nav-tool-btn" 
          onClick={onOpenQuiz}
          title="Interactive Practice Quiz"
        >
          <Flame size={15} style={{ color: '#f59e0b' }} />
          <span>Quiz Me</span>
        </button>

        <button 
          className="nav-tool-btn" 
          onClick={onOpenFlashcards}
          title="Concept Flashcards"
        >
          <Brain size={15} style={{ color: '#38bdf8' }} />
          <span>Flashcards</span>
        </button>

        <button 
          className="icon-button" 
          onClick={onOpenKnowledge}
          title="Study Material & Knowledge Base"
        >
          <Library size={18} />
        </button>

        <button 
          className={`icon-button ${notesCount > 0 ? 'has-badge' : ''}`} 
          onClick={onOpenNotes}
          title={`Study Notes (${notesCount})`}
        >
          <BookMarked size={18} />
        </button>

        <button 
          className="icon-button" 
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
