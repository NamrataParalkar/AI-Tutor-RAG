import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import QuizModal from './components/QuizModal';
import FlashcardsModal from './components/FlashcardsModal';
import KnowledgeBaseModal from './components/KnowledgeBaseModal';
import StudyNotesModal from './components/StudyNotesModal';
import './App.css';

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  const [activeMode, setActiveMode] = useState('normal');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('ai_tutor_theme') || 'dark');

  // Modals state
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizTopic, setQuizTopic] = useState('Laws of Motion');
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  const [flashcardsTopic, setFlashcardsTopic] = useState('Cell Biology');
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  // Backend state
  const [statusData, setStatusData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isRebuilding, setIsRebuilding] = useState(false);

  // Saved bookmarks
  const [savedNotes, setSavedNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_tutor_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ai_tutor_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ai_tutor_notes', JSON.stringify(savedNotes));
  }, [savedNotes]);

  // Fetch telemetry and documents on mount
  useEffect(() => {
    fetchStatus();
    fetchDocuments();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err) {
      console.warn('Backend status fetch:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.warn('Backend documents fetch:', err);
    }
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSendMessage = async (promptText, mode = activeMode) => {
    if (!promptText.trim()) return;

    const userMsgId = Date.now();
    const newMessages = [
      ...messages,
      { id: userMsgId, role: 'user', content: promptText }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: promptText,
          mode: mode,
          top_k: 4,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        mode: data.mode || mode,
        suggested_followups: data.suggested_followups || [],
        question: promptText,
        topic: promptText.slice(0, 50),
      };

      setMessages([...newMessages, assistantMsg]);
    } catch (error) {
      console.error('Ask error:', error);
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `⚠️ **Unable to retrieve response**: ${error.message}\n\nPlease verify that the backend FastAPI service is running.`,
        sources: [],
        mode: mode,
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmarkMessage = (msg, index) => {
    const noteId = msg.id || index;
    const exists = savedNotes.some(n => n.id === noteId);

    if (exists) {
      setSavedNotes(prev => prev.filter(n => n.id !== noteId));
    } else {
      setSavedNotes(prev => [
        ...prev,
        {
          id: noteId,
          question: msg.question || 'Concept Explanation',
          content: msg.content,
          sources: msg.sources || [],
          mode: msg.mode,
          timestamp: Date.now(),
        }
      ]);
    }
  };

  const handleRemoveNote = (index) => {
    setSavedNotes(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllNotes = () => {
    setSavedNotes([]);
  };

  const handleUploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Upload failed');
      }

      const data = await res.json();
      fetchDocuments();
      fetchStatus();
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleRebuildIndex = async () => {
    setIsRebuilding(true);
    try {
      const res = await fetch(`${API_BASE}/api/rebuild-index`, { method: 'POST' });
      if (res.ok) {
        await fetchStatus();
        await fetchDocuments();
      }
    } catch (e) {
      console.error('Rebuild index error:', e);
    } finally {
      setIsRebuilding(false);
    }
  };

  const handleTriggerQuizFromTopic = (topic) => {
    setQuizTopic(topic);
    setQuizOpen(true);
  };

  return (
    <div className="app-container">
      <Navbar
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        onOpenQuiz={() => {
          setQuizTopic('Laws of Motion & Force');
          setQuizOpen(true);
        }}
        onOpenFlashcards={() => {
          setFlashcardsTopic('Cell Structure & Biology');
          setFlashcardsOpen(true);
        }}
        onOpenNotes={() => setNotesOpen(true)}
        onOpenKnowledge={() => setKnowledgeOpen(true)}
        notesCount={savedNotes.length}
        statusData={statusData}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <div className="main-body">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          documents={documents}
          statusData={statusData}
          onSelectPrompt={(prompt) => handleSendMessage(prompt, activeMode)}
          onOpenKnowledge={() => setKnowledgeOpen(true)}
          onUploadFile={handleUploadFile}
        />

        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onClearChat={() => setMessages([])}
          activeMode={activeMode}
          onSelectMode={setActiveMode}
          onBookmarkMessage={handleBookmarkMessage}
          bookmarkedIds={savedNotes.map(n => n.id)}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onTriggerQuizFromTopic={handleTriggerQuizFromTopic}
        />
      </div>

      {/* MODALS */}
      <QuizModal
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
        initialTopic={quizTopic}
      />

      <FlashcardsModal
        isOpen={flashcardsOpen}
        onClose={() => setFlashcardsOpen(false)}
        initialTopic={flashcardsTopic}
      />

      <KnowledgeBaseModal
        isOpen={knowledgeOpen}
        onClose={() => setKnowledgeOpen(false)}
        documents={documents}
        statusData={statusData}
        onUploadFile={handleUploadFile}
        onRebuildIndex={handleRebuildIndex}
        isRebuilding={isRebuilding}
      />

      <StudyNotesModal
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
        notes={savedNotes}
        onRemoveNote={handleRemoveNote}
        onClearAllNotes={handleClearAllNotes}
      />
    </div>
  );
}
