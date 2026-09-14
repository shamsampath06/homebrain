import React, { useState, useRef, useEffect } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { Bot, Send, Mic, Paperclip, Sparkles, Trash2, ShieldCheck, User, Image, FileText, Volume2 } from 'lucide-react';

export const AIChatScreen: React.FC = () => {
  const { aiMessages, isAITyping, sendAIMessage, clearAIConversation, navigateToSubScreen } = useHomeBrain();
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; url: string; type: string }[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAITyping]);

  const suggestedQuestions = [
    'What is happening today?',
    'What medicines are due today?',
    'When should Grandma take her medicine?',
    'What is left on the grocery list?',
    'Who bought the milk?',
    'What bills are due this week?',
    'Where is my passport?',
    'Is Grandma allergic to anything?'
  ];

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;

    const query = inputText;
    const atts = [...attachments];

    setInputText('');
    setAttachments([]);

    await sendAIMessage(query, atts);
  };

  const handleSuggestedClick = async (q: string) => {
    await sendAIMessage(q);
  };

  const handleSimulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachments([
        {
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type.includes('image') ? 'Image' : 'Document'
        }
      ]);
      setShowUploadModal(false);
    }
  };

  // Web Speech Recognition API Voice Assistant
  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Falling back to text mode.');
      return;
    }

    if (isVoiceActive) {
      setIsVoiceActive(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      setIsVoiceActive(true);
      setVoiceText('Listening for voice command...');

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setVoiceText(transcript);
        setInputText(transcript);
      };

      recognition.onerror = () => {
        setIsVoiceActive(false);
      };

      recognition.onend = () => {
        setIsVoiceActive(false);
      };

      recognition.start();
    } catch (e) {
      setIsVoiceActive(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-slate-800 rounded-3xl shadow-card border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
      {/* AI Header */}
      <div className="p-4 sm:px-6 bg-gradient-to-r from-brand-600 to-indigo-600 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
            🤖
          </div>
          <div>
            <h2 className="font-bold text-base flex items-center gap-1.5">
              HomeBrain AI Assistant <Sparkles className="w-4 h-4 text-amber-300" />
            </h2>
            <p className="text-xs text-brand-100">Grounded in your family database & documents</p>
          </div>
        </div>

        <button
          onClick={clearAIConversation}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1 transition-colors"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Suggested Chips Carousel */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-700 overflow-x-auto flex gap-2 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 px-2">
          💡 Try Asking:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestedClick(q)}
            className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-brand-500 transition-all shrink-0 shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {aiMessages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  isUser
                    ? 'bg-brand-600 text-white'
                    : 'bg-gradient-to-tr from-brand-500 to-indigo-500 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                <div
                  className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-brand-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700/70 text-slate-900 dark:text-white rounded-tl-none border border-slate-200/50 dark:border-slate-600'
                  }`}
                >
                  {msg.text}

                  {/* Attachments preview */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-2 text-xs">
                      <Paperclip className="w-3.5 h-3.5" /> Attachment: {msg.attachments[0].name}
                    </div>
                  )}
                </div>

                {/* Grounding Sources Badge */}
                {!isUser && msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> Grounded in:
                    </span>
                    {msg.groundingSources.map((src, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      >
                        {src}
                      </span>
                    ))}
                    <button
                      onClick={() => speakText(msg.text)}
                      className="p-1 text-slate-400 hover:text-brand-500"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isAITyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center text-white text-xs">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-3xl bg-slate-100 dark:bg-slate-700 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse delay-100" />
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse delay-200" />
              Searching family database...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Voice Assistant Overlay */}
      {isVoiceActive && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border-t border-rose-200 text-center animate-pulse flex items-center justify-between px-6">
          <span className="text-xs font-bold text-rose-600 flex items-center gap-2">
            <Mic className="w-4 h-4" /> {voiceText || 'Listening... Speak your family question now'}
          </span>
          <button
            onClick={() => setIsVoiceActive(false)}
            className="text-xs font-bold text-rose-700 hover:underline"
          >
            Stop Voice
          </button>
        </div>
      )}

      {/* Attachments Chip */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/60 flex items-center justify-between text-xs">
          <span className="font-semibold text-brand-600 flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5" /> Upload ready: {attachments[0].name}
          </span>
          <button onClick={() => setAttachments([])} className="text-slate-400 hover:text-rose-500">
            Remove
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="p-2.5 rounded-2xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Upload Document or Photo"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleToggleVoice}
          className={`p-2.5 rounded-2xl transition-colors ${
            isVoiceActive
              ? 'bg-rose-500 text-white animate-pulse'
              : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Voice Assistant Mode"
        >
          <Mic className="w-5 h-5" />
        </button>

        <input
          type="text"
          placeholder="Ask HomeBrain AI anything about schedules, medicines, groceries..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim() && attachments.length === 0}
          className="p-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white shadow-md transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* File Upload Dialog */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Upload File for AI Analysis</h3>
            <p className="text-xs text-slate-500">Upload a photo of a document or record to query HomeBrain AI.</p>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleSimulateFileUpload}
              className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700"
            />
            <button
              onClick={() => setShowUploadModal(false)}
              className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
