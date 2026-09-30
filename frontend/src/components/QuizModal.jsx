import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Flame, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  RotateCcw, 
  Sparkles,
  Award
} from 'lucide-react';

export default function QuizModal({ isOpen, onClose, initialTopic = 'Laws of Motion' }) {
  const [topic, setTopic] = useState(initialTopic);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);

  if (!isOpen) return null;

  const popularTopics = [
    'Laws of Motion & Force',
    'Cell Structure & Organelles',
    'Polynomials & Factorisation',
    'Gravitation & Floatation',
    'Matter in Our Surroundings'
  ];

  const handleStartQuiz = async (selectedTopic = topic) => {
    setIsGenerating(true);
    setQuizFinished(false);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowHint(false);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedTopic, count: 3 }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        throw new Error('No questions returned');
      }
    } catch (e) {
      console.error('Quiz generation error:', e);
      // Fallback sample questions
      setQuestions([
        {
          question: `Regarding ${selectedTopic}, what is the fundamental principle established in the Class 9 NCERT curriculum?`,
          options: [
            'Every action has an equal and opposite reaction',
            'Energy can be created from nothing under high pressure',
            'Mass changes constantly when moving at constant speed',
            'Forces cannot be exerted in a vacuum',
          ],
          correct_index: 0,
          hint: 'Think of Newton’s third law or standard conservation principles.',
          explanation: 'Newton’s third law states that to every action there is always an equal and opposite reaction.',
        },
        {
          question: 'Which unit is used to measure force in the International System of Units (SI)?',
          options: ['Joule (J)', 'Newton (N)', 'Pascal (Pa)', 'Watt (W)'],
          correct_index: 1,
          hint: 'Named after Sir Isaac Newton.',
          explanation: 'The SI unit of force is the Newton (N), which equals kg·m/s².',
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (optionIndex) => {
    if (selectedAnswers[currentIndex] !== undefined) return; // Already answered

    const isCorrect = optionIndex === questions[currentIndex].correct_index;
    const newAnswers = { ...selectedAnswers, [currentIndex]: optionIndex };
    setSelectedAnswers(newAnswers);

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Auto advance or show summary if last question
    if (currentIndex === questions.length - 1) {
      setTimeout(() => {
        setQuizFinished(true);
        const finalScore = (isCorrect ? score + 1 : score);
        if (finalScore >= questions.length * 0.6) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }, 1500);
    }
  };

  const currentQ = questions[currentIndex];
  const answered = selectedAnswers[currentIndex] !== undefined;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge" style={{ background: 'var(--grad-amber)' }}>
              <Flame size={20} />
            </div>
            <div>
              <div className="modal-title">Interactive Practice Quiz</div>
              <div className="modal-subtitle">Grounded in NCERT Class 9 Study Materials</div>
            </div>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {questions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Enter Topic to Test:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Laws of Motion, Cell Biology, Polynomials..."
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

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Recommended Topics:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.5rem' }}>
                  {popularTopics.map((t, i) => (
                    <button
                      key={i}
                      className="followup-chip"
                      onClick={() => {
                        setTopic(t);
                        handleStartQuiz(t);
                      }}
                    >
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : quizFinished ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                background: 'rgba(16, 185, 129, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#10b981'
              }}>
                <Award size={36} />
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Quiz Completed!</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                You scored <strong style={{ color: '#10b981', fontSize: '1.3rem' }}>{score}</strong> out of <strong>{questions.length}</strong> on <em>"{topic}"</em>.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div className="quiz-stepper">
                  <span>Question {currentIndex + 1} of {questions.length}</span>
                  <span>Topic: {topic}</span>
                </div>
                <div className="quiz-progress-bar">
                  <div 
                    className="quiz-progress-fill" 
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="quiz-question-text">{currentQ?.question}</div>

              <div className="quiz-options-list">
                {currentQ?.options?.map((option, optIdx) => {
                  const letters = ['A', 'B', 'C', 'D'];
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  const isCorrect = optIdx === currentQ.correct_index;

                  let optClass = 'quiz-option-btn';
                  if (answered) {
                    if (isCorrect) optClass += ' correct';
                    else if (isSelected) optClass += ' wrong';
                  }

                  return (
                    <button
                      key={optIdx}
                      className={optClass}
                      disabled={answered}
                      onClick={() => handleSelectOption(optIdx)}
                    >
                      <span className="quiz-option-letter">{letters[optIdx]}</span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Hint and Explanation */}
              {currentQ?.hint && !answered && (
                <div>
                  <button 
                    className="action-btn-small" 
                    onClick={() => setShowHint(!showHint)}
                    style={{ color: 'var(--accent-indigo)' }}
                  >
                    <HelpCircle size={14} />
                    <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
                  </button>
                  {showHint && (
                    <div className="quiz-feedback-box" style={{ marginTop: '0.4rem' }}>
                      💡 <strong>Hint:</strong> {currentQ.hint}
                    </div>
                  )}
                </div>
              )}

              {answered && (
                <div className="quiz-feedback-box">
                  <strong>Explanation:</strong> {currentQ?.explanation}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {questions.length === 0 ? (
            <button 
              className="btn-primary" 
              onClick={() => handleStartQuiz()}
              disabled={isGenerating || !topic.trim()}
            >
              <Sparkles size={16} />
              <span>{isGenerating ? 'Generating Quiz...' : 'Start Quiz'}</span>
            </button>
          ) : quizFinished ? (
            <>
              <button className="btn-secondary" onClick={() => setQuestions([])}>
                <RotateCcw size={15} />
                <span>Try Another Topic</span>
              </button>
              <button className="btn-primary" onClick={onClose}>
                <span>Done</span>
              </button>
            </>
          ) : (
            <>
              {currentIndex < questions.length - 1 && answered && (
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    setCurrentIndex(prev => prev + 1);
                    setShowHint(false);
                  }}
                >
                  <span>Next Question</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
