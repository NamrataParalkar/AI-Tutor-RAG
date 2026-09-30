import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  Volume2, 
  Bookmark, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Smile,
  GraduationCap,
  Lightbulb,
  Compass,
  ArrowRight,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle
} from 'lucide-react';

export default function ChatArea({ 
  messages, 
  isLoading, 
  onSendMessage, 
  onClearChat, 
  activeMode, 
  onSelectMode, 
  onBookmarkMessage, 
  bookmarkedIds,
  sidebarOpen,
  onToggleSidebar,
  onTriggerQuizFromTopic
}) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), activeMode);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputResize = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text, id) => {
    if ('speechSynthesis' in window) {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*_`]/g, ''));
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleSourceExcerpt = (msgIdx, srcIdx) => {
    const key = `${msgIdx}-${srcIdx}`;
    setExpandedSources(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const modeDescriptions = {
    normal: { title: 'Standard Tutor', desc: 'Detailed, structured teaching with examples and conceptual clarity.' },
    simple: { title: 'Explain Like I\'m 10', desc: 'Everyday analogies, friendly tone, and simple vocabulary for beginners.' },
    hint: { title: 'Socratic Hint Mode', desc: 'Guiding clues and questions to help you reach the answer independently.' },
    deep: { title: 'In-Depth Academic', desc: 'Formulas, rigorous derivations, and comprehensive textbook grounding.' },
  };

  return (
    <main className="chat-canvas">
      <button 
        className="sidebar-toggle-btn"
        onClick={onToggleSidebar}
        title={sidebarOpen ? 'Hide Curriculum Panel' : 'Show Curriculum Panel'}
      >
        {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
      </button>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="hero-view">
            <div className="hero-glow-badge">
              <Sparkles size={15} style={{ color: 'var(--accent-indigo)' }} />
              <span>Next-Gen RAG Study Companion</span>
            </div>

            <h1 className="hero-heading">What would you like to master today?</h1>
            
            <p className="hero-subtext">
              Grounded in official Class 9 Mathematics & Science NCERT textbooks. 
              Ask questions, explore concept hints, or take an instant practice quiz.
            </p>

            <div className="mode-cards-grid">
              <div 
                className={`mode-card ${activeMode === 'normal' ? 'active' : ''}`}
                onClick={() => onSelectMode('normal')}
              >
                <div className="mode-card-icon"><GraduationCap size={22} /></div>
                <div className="mode-card-title">Normal Tutor</div>
                <div className="mode-card-desc">Clear structured explanations with formulas and examples</div>
              </div>

              <div 
                className={`mode-card ${activeMode === 'simple' ? 'active' : ''}`}
                onClick={() => onSelectMode('simple')}
              >
                <div className="mode-card-icon"><Smile size={22} /></div>
                <div className="mode-card-title">Like I'm 10</div>
                <div className="mode-card-desc">Intuitive real-life analogies, super easy to understand</div>
              </div>

              <div 
                className={`mode-card ${activeMode === 'hint' ? 'active' : ''}`}
                onClick={() => onSelectMode('hint')}
              >
                <div className="mode-card-icon"><Lightbulb size={22} /></div>
                <div className="mode-card-title">Socratic Hint</div>
                <div className="mode-card-desc">Step-by-step clues so you solve problems yourself</div>
              </div>

              <div 
                className={`mode-card ${activeMode === 'deep' ? 'active' : ''}`}
                onClick={() => onSelectMode('deep')}
              >
                <div className="mode-card-icon"><Compass size={22} /></div>
                <div className="mode-card-title">In-Depth</div>
                <div className="mode-card-desc">Academic rigor, derivations, and underlying principles</div>
              </div>
            </div>

            <div className="starter-cards-grid">
              <div 
                className="starter-action-card"
                onClick={() => onSendMessage('Explain Newton\'s Second Law of Motion with an everyday example and derive F = ma.', activeMode)}
              >
                <div className="starter-card-icon"><Sparkles size={16} /></div>
                <div>
                  <div className="starter-card-category">Physics • Chapter 9</div>
                  <div className="starter-card-prompt">Explain Newton's Second Law & derive F = ma with real examples</div>
                </div>
              </div>

              <div 
                className="starter-action-card"
                onClick={() => onSendMessage('Why is the cell known as the structural and functional unit of life? What organelles are inside?', activeMode)}
              >
                <div className="starter-card-icon"><Sparkles size={16} /></div>
                <div>
                  <div className="starter-card-category">Biology • Chapter 5</div>
                  <div className="starter-card-prompt">Why is the cell called the fundamental unit of life?</div>
                </div>
              </div>

              <div 
                className="starter-action-card"
                onClick={() => onSendMessage('How do you factorise quadratic polynomials using the splitting the middle term method? Give 2 examples.', activeMode)}
              >
                <div className="starter-card-icon"><Sparkles size={16} /></div>
                <div>
                  <div className="starter-card-category">Mathematics • Chapter 2</div>
                  <div className="starter-card-prompt">Factorising polynomials by splitting the middle term</div>
                </div>
              </div>

              <div 
                className="starter-action-card"
                onClick={() => onSendMessage('What is Archimedes’ principle and how does buoyant force determine whether an object floats or sinks?', activeMode)}
              >
                <div className="starter-card-icon"><Sparkles size={16} /></div>
                <div>
                  <div className="starter-card-category">Physics • Gravitation</div>
                  <div className="starter-card-prompt">Archimedes’ principle & why objects float or sink</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isBookmarked = bookmarkedIds?.includes(msg.id || index);

            return (
              <div key={msg.id || index} className={`message-row ${isUser ? 'user' : 'assistant'}`}>
                {!isUser && (
                  <div className="message-avatar tutor">
                    <GraduationCap size={18} />
                  </div>
                )}

                <div className="message-bubble-wrapper">
                  {!isUser && (
                    <div className="message-meta">
                      <span className="mode-tag">
                        {msg.mode === 'simple' ? 'Like I\'m 10' : 
                         msg.mode === 'hint' ? 'Socratic Hint' : 
                         msg.mode === 'deep' ? 'In-Depth' : 'Tutor Mode'}
                      </span>
                      <span>Class 9 AI Tutor</span>
                    </div>
                  )}

                  <div className="message-bubble">
                    {isUser ? (
                      <div>{msg.content}</div>
                    ) : (
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>

                        {/* RAG Source Citations */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="citations-wrapper">
                            <div className="citations-header">
                              <FileText size={12} style={{ color: 'var(--accent-indigo)' }} />
                              <span>Retrieved Textbook Sources ({msg.sources.length})</span>
                            </div>
                            <div className="sources-chips-list">
                              {msg.sources.map((src, srcIdx) => {
                                const key = `${index}-${srcIdx}`;
                                const isExpanded = !!expandedSources[key];
                                const matchPct = Math.min(Math.round((src.score + 0.3) * 100), 99);

                                return (
                                  <div key={srcIdx} style={{ display: 'flex', flexDirection: 'column' }}>
                                    <button
                                      className={`source-badge ${isExpanded ? 'active' : ''}`}
                                      onClick={() => toggleSourceExcerpt(index, srcIdx)}
                                      title="Click to view context excerpt"
                                    >
                                      <BookOpen size={12} />
                                      <span>{src.source}</span>
                                      <span className="source-score">{matchPct}% match</span>
                                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                    {isExpanded && (
                                      <div className="source-excerpt-box">
                                        <em>Excerpt:</em> "{src.excerpt}"
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions & Follow-ups on Tutor Messages */}
                  {!isUser && (
                    <>
                      <div className="message-actions">
                        <button 
                          className="action-btn-small" 
                          onClick={() => handleCopy(msg.content, msg.id || index)}
                          title="Copy response"
                        >
                          {copiedId === (msg.id || index) ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                          <span>{copiedId === (msg.id || index) ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button 
                          className="action-btn-small" 
                          onClick={() => handleSpeak(msg.content, msg.id || index)}
                          title="Read aloud"
                        >
                          <Volume2 size={13} style={{ color: speakingId === (msg.id || index) ? '#6366f1' : 'inherit' }} />
                          <span>{speakingId === (msg.id || index) ? 'Stop' : 'Listen'}</span>
                        </button>

                        <button 
                          className={`action-btn-small ${isBookmarked ? 'bookmarked' : ''}`} 
                          onClick={() => onBookmarkMessage(msg, index)}
                          title="Save to Study Notes"
                        >
                          <Bookmark size={13} fill={isBookmarked ? 'currentColor' : 'none'} />
                          <span>{isBookmarked ? 'Saved' : 'Save Note'}</span>
                        </button>

                        <button 
                          className="action-btn-small" 
                          onClick={() => onSendMessage(`Explain this again in simpler terms for a beginner: "${msg.content.slice(0, 150)}..."`, 'simple')}
                          title="Explain simpler"
                        >
                          <Smile size={13} />
                          <span>Simpler</span>
                        </button>

                        <button 
                          className="action-btn-small" 
                          onClick={() => onTriggerQuizFromTopic(msg.topic || msg.content.slice(0, 80))}
                          title="Quiz me on this topic"
                        >
                          <Sparkles size={13} style={{ color: '#f59e0b' }} />
                          <span>Quiz Me</span>
                        </button>
                      </div>

                      {/* Suggested Follow-up chips */}
                      {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                        <div className="followups-container">
                          {msg.suggested_followups.map((followup, fIdx) => (
                            <button
                              key={fIdx}
                              className="followup-chip"
                              onClick={() => onSendMessage(followup, activeMode)}
                            >
                              <span>{followup}</span>
                              <ArrowRight size={11} />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {isUser && (
                  <div className="message-avatar user">
                    <span>You</span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="message-row assistant">
            <div className="message-avatar tutor">
              <GraduationCap size={18} />
            </div>
            <div className="message-bubble-wrapper">
              <div className="message-bubble">
                <div className="thinking-box">
                  <div className="pulsing-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                  <span>Consulting Class 9 textbooks and reasoning...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* COMPOSER DOCK */}
      <div className="composer-dock">
        <form onSubmit={handleSubmit} className="composer-box">
          <textarea
            ref={textareaRef}
            className="composer-textarea"
            placeholder={
              activeMode === 'simple' 
                ? 'Ask me anything! I will explain it with fun analogies...' 
                : activeMode === 'hint'
                ? 'Ask a question or homework problem to receive guiding hints...'
                : activeMode === 'deep'
                ? 'Ask for an in-depth academic breakdown or proof...'
                : 'Ask a question about your Class 9 Science or Math materials...'
            }
            value={input}
            onChange={handleInputResize}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          <div className="composer-footer">
            <div className="composer-left">
              <select 
                className="mode-select-dropdown"
                value={activeMode}
                onChange={(e) => onSelectMode(e.target.value)}
                title="Select Tutor Explanation Mode"
              >
                <option value="normal">🎓 Normal Tutor</option>
                <option value="simple">🧒 Explain Like I'm 10</option>
                <option value="hint">💡 Socratic Hint Mode</option>
                <option value="deep">🔬 In-Depth Academic</option>
              </select>

              {messages.length > 0 && (
                <button 
                  type="button" 
                  className="clear-btn" 
                  onClick={onClearChat}
                  title="Clear chat session"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="composer-right">
              <button 
                type="submit" 
                className="send-button"
                disabled={!input.trim() || isLoading}
                title="Send question (Enter)"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
