import React, { useState } from 'react';
import { 
  X, 
  Brain, 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  CheckCircle, 
  Sparkles,
  Layers
} from 'lucide-react';

export default function FlashcardsModal({ isOpen, onClose, initialTopic = 'Cell Structure' }) {
  const [topic, setTopic] = useState(initialTopic);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerateCards = async (selectedTopic = topic) => {
    setIsLoading(true);
    setIsFlipped(false);
    setCurrentIndex(0);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedTopic, count: 4 }),
      });
      const data = await res.json();
      if (data.flashcards && data.flashcards.length > 0) {
        setCards(data.flashcards);
      } else {
        throw new Error('No flashcards returned');
      }
    } catch (e) {
      console.error('Flashcard generation error:', e);
      // Fallback cards
      setCards([
        {
          front: 'What is the function of Mitochondria in a cell?',
          back: 'Mitochondria are the "powerhouses of the cell". They generate cellular energy in the form of ATP (Adenosine Triphosphate) molecules through cellular respiration.',
          category: 'Biology • Chapter 5'
        },
        {
          front: 'State Newton\'s First Law of Motion (Law of Inertia).',
          back: 'An object remains in a state of rest or of uniform motion in a straight line unless compelled to change that state by an applied unbalanced external force.',
          category: 'Physics • Chapter 9'
        },
        {
          front: 'What does the Remainder Theorem state in polynomials?',
          back: 'Let p(x) be any polynomial of degree ≥ 1 and a be any real number. If p(x) is divided by the linear polynomial (x - a), then the remainder is equal to p(a).',
          category: 'Mathematics • Chapter 2'
        },
        {
          front: 'What is the difference between speed and velocity?',
          back: 'Speed is a scalar quantity (magnitude only, distance/time). Velocity is a vector quantity (both magnitude and direction, displacement/time).',
          category: 'Physics • Chapter 8'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge" style={{ background: 'var(--grad-cyan)' }}>
              <Brain size={20} />
            </div>
            <div>
              <div className="modal-title">Concept Flashcards</div>
              <div className="modal-subtitle">High-Yield NCERT Class 9 Revision</div>
            </div>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {cards.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Enter Topic for Revision Cards:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Cell Structure, Motion, Atoms and Molecules..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    marginTop: '0.4rem',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Cell Organelles', 'Laws of Motion', 'Gravitation', 'Polynomials'].map((t, i) => (
                  <button
                    key={i}
                    className="followup-chip"
                    onClick={() => {
                      setTopic(t);
                      handleGenerateCards(t);
                    }}
                  >
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{currentCard?.category || topic}</span>
              </div>

              {/* 3D Flip Card */}
              <div 
                className={`flashcard-stage ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
                title="Click to flip card"
              >
                <div className="flashcard-inner">
                  {/* FRONT */}
                  <div className="flashcard-face flashcard-front">
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)', marginBottom: '0.75rem', fontWeight: 700 }}>
                      Question / Concept
                    </span>
                    <div className="flashcard-prompt">{currentCard?.front}</div>
                    <div className="flip-hint">
                      <RotateCw size={13} />
                      <span>Click to flip</span>
                    </div>
                  </div>

                  {/* BACK */}
                  <div className="flashcard-face flashcard-back">
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a5b4fc', marginBottom: '0.75rem', fontWeight: 700 }}>
                      Textbook Answer
                    </span>
                    <div className="flashcard-answer">{currentCard?.back}</div>
                    <div className="flip-hint">
                      <RotateCw size={13} />
                      <span>Click to return</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  className="icon-button"
                  disabled={currentIndex === 0}
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentIndex(prev => Math.max(prev - 1, 0));
                  }}
                  title="Previous card"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <RotateCw size={14} />
                  <span>Flip Card</span>
                </button>

                <button
                  className="icon-button"
                  disabled={currentIndex === cards.length - 1}
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentIndex(prev => Math.min(prev + 1, cards.length - 1));
                  }}
                  title="Next card"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {cards.length === 0 ? (
            <button 
              className="btn-primary" 
              onClick={() => handleGenerateCards()}
              disabled={isLoading || !topic.trim()}
            >
              <Sparkles size={16} />
              <span>{isLoading ? 'Generating Cards...' : 'Generate Flashcards'}</span>
            </button>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setCards([])}>
                <span>Change Topic</span>
              </button>
              <button className="btn-primary" onClick={onClose}>
                <span>Done</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
