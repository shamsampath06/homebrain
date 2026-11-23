import React, { useState, useRef, useEffect } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { isSupabaseConfigured, uploadPrivateFile } from '../../lib/supabase';
import { CleanChatMessage } from './CleanChatMessage';
import {
  Bot,
  Send,
  Mic,
  Paperclip,
  Sparkles,
  Trash2,
  ShieldCheck,
  User,
  Image as ImageIcon,
  FileText,
  Volume2,
  X,
  Archive,
  CheckCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  Pill,
  ShoppingCart,
  Zap,
  Cpu,
  Clock,
  Database,
  Activity,
  Camera,
  Square
} from 'lucide-react';
import { MultimodalVisionModal } from './MultimodalVisionModal';

interface LocalAttachment {
  name: string;
  url: string;
  type: string;
  base64?: string;
  mimeType?: string;
  previewUrl?: string;
  file?: File;
}

export const AIChatScreen: React.FC = () => {
  const {
    aiMessages,
    isAITyping,
    sendAIMessage,
    clearAIConversation,
    navigateToSubScreen,
    currentUser,
    addDocument
  } = useHomeBrain();

  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [savedVaultNotice, setSavedVaultNotice] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAITyping]);

  const suggestedQuestions = [
    'Analyze household clinical compliance & missed doses',
    'Add 2 Litres of Milk to grocery list',
    'Remind me to check Dad blood pressure tomorrow at 6 PM',
    'Audit monthly household burn rate & unpaid bills',
    'Predict grocery restock dates & pantry depletion',
    'Schedule Family Weekend Dinner on Sunday at 7 PM',
    'Add expense 450 for fresh vegetables',
    'What medicines are due today?',
    'What is happening today?',
    'Where is my passport or medical records?'
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

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // strip data url prefix
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleMultipleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    setIsUploading(true);
    const uploadedList: LocalAttachment[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isAllowed = validTypes.includes(file.type) || ext === 'docx' || ext === 'txt';

      if (!isAllowed) {
        alert(`File "${file.name}" is not supported. Please choose PDF, DOCX, TXT, or images (JPG, PNG, WEBP).`);
        continue;
      }

      if (file.size > 15 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 15 MB limit.`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        let storagePath = '';
        if (isSupabaseConfigured && currentUser.familyId) {
          storagePath = `${currentUser.familyId}/ai-uploads/${crypto.randomUUID()}-${file.name}`;
          await uploadPrivateFile('documents', storagePath, file);
        }

        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;

        uploadedList.push({
          name: file.name,
          url: storagePath || file.name,
          type: file.type.startsWith('image/') ? 'Image' : 'Document',
          mimeType: file.type || (ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain'),
          base64,
          previewUrl,
          file
        });
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        alert(`Failed to upload ${file.name}: ${uploadError instanceof Error ? uploadError.message : 'Upload failed'}`);
      }
    }

    setAttachments(prev => [...prev, ...uploadedList]);
    setIsUploading(false);
    setShowUploadModal(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Explicit option to save uploaded attachment directly to Document Vault
  const handleSaveToDocumentVault = (att: LocalAttachment) => {
    if (!att.file && !att.url) return;
    try {
      addDocument({
        title: att.name.replace(/\.[^/.]+$/, ''),
        category: 'General' as any,
        fileType: att.name.split('.').pop()?.toUpperCase() || 'DOC',
        fileSize: att.file ? `${(att.file.size / 1024 / 1024).toFixed(2)} MB` : '1.0 MB',
        fileUrl: att.url,
        storagePath: att.url,
        description: `Imported directly via HomeBrain AI Chat on ${new Date().toLocaleDateString()}.`,
        summaryContent: undefined,
        uploaderName: currentUser.name
      });
      setSavedVaultNotice(`Saved "${att.name}" to Document Vault!`);
      setTimeout(() => setSavedVaultNotice(null), 3000);
    } catch (e: any) {
      alert(`Could not save to Document Vault: ${e.message}`);
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
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsVoiceActive(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      setIsVoiceActive(true);
      setVoiceText('Listening for voice command... Speak now!');

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setVoiceText(transcript);
        setInputText(transcript);
      };

      recognition.onerror = (err: any) => {
        console.warn('Voice recognition error:', err);
        setIsVoiceActive(false);
      };

      recognition.onend = () => {
        setIsVoiceActive(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsVoiceActive(false);
    }
  };

  const toggleSpeakMessage = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }
    if (speakingMsgId === msgId || window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      if (speakingMsgId === msgId) return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const stopGlobalSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && speakingMsgId) {
        stopGlobalSpeech();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speakingMsgId]);

  return (
    <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col bg-white dark:bg-slate-900 sm:rounded-3xl shadow-card sm:border sm:border-slate-200/80 sm:dark:border-slate-700/80 overflow-hidden min-h-0">
      {/* AI Header */}
      <div className="p-3.5 sm:p-4 sm:px-6 bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 text-white flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden shadow-sm ring-1 ring-white/30 flex-shrink-0 bg-slate-900">
            <img src="/homebrain-logo.jpg" alt="HomeBrain Logo" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm sm:text-base flex items-center gap-1.5 truncate">
              HomeBrain Multimodal AI <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            </h2>
            <p className="text-[11px] sm:text-xs text-brand-100 truncate">Live RAG grounded in your family records</p>
          </div>
        </div>

        <button
          onClick={clearAIConversation}
          className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Suggested Chips Carousel */}
      <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-700 overflow-x-auto flex gap-1.5 sm:gap-2 scrollbar-none shrink-0">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 px-1 sm:px-2">
          💡 Try Asking:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestedClick(q)}
            className="px-2.5 sm:px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 transition-all shrink-0 shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Vault Notification Toast */}
      {savedVaultNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs flex items-center justify-between animate-fadeIn shrink-0">
          <span className="flex items-center gap-1.5 font-semibold">
            <CheckCircle className="w-4 h-4" /> {savedVaultNotice}
          </span>
          <button
            onClick={() => navigateToSubScreen('documents')}
            className="underline font-bold text-[11px] hover:text-emerald-100"
          >
            Open Document Vault →
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 min-h-0">
        {aiMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
            <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl shadow-cyan-500/25 ring-2 ring-cyan-400/40">
              <img src="/homebrain-logo.jpg" alt="HomeBrain Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Welcome to HomeBrain AI Assistant
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                Your private family assistant with live real-time access to your calendar, medicines, groceries, bills, vault documents, and milestones.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg w-full text-left pt-2">
              <div
                onClick={() => handleSuggestedClick("What is happening today?")}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-700 hover:border-brand-400 cursor-pointer transition-all"
              >
                <Calendar className="w-4 h-4 text-brand-500 mb-1" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Daily Schedule</p>
                <p className="text-[11px] text-slate-400">Events & urgent reminders</p>
              </div>

              <div
                onClick={() => handleSuggestedClick("What medicines are due today?")}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-700 hover:border-rose-400 cursor-pointer transition-all"
              >
                <Pill className="w-4 h-4 text-rose-500 mb-1" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Medicine Tracker</p>
                <p className="text-[11px] text-slate-400">Prescriptions & doses</p>
              </div>

              <div
                onClick={() => handleSuggestedClick("What is left on the grocery list?")}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-400 cursor-pointer transition-all"
              >
                <ShoppingCart className="w-4 h-4 text-emerald-500 mb-1" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Smart Groceries</p>
                <p className="text-[11px] text-slate-400">Pantry & shopping items</p>
              </div>
            </div>
          </div>
        ) : (
          aiMessages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 overflow-hidden ${isUser
                      ? 'bg-brand-600 text-white'
                      : 'ring-1 ring-cyan-400/40 shadow-sm'
                    }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <img src="/homebrain-logo.jpg" alt="HomeBrain AI" className="w-full h-full object-cover" />}
                </div>

                <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                  <div
                    className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${isUser
                        ? 'bg-brand-600 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white rounded-tl-none border border-slate-200/70 dark:border-slate-700 shadow-sm'
                      }`}
                  >
                    <CleanChatMessage
                      text={msg.text}
                      isUser={isUser}
                      onNavigate={navigateToSubScreen}
                      isSpeaking={speakingMsgId === msg.id}
                      onToggleSpeak={() => toggleSpeakMessage(msg.id, msg.text)}
                    />

                    {/* Multimodal Attachments Previews */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-white/20 dark:border-slate-600 space-y-2">
                        <p className="text-[11px] font-semibold opacity-90 flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5" /> Attachments ({msg.attachments.length}):
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.attachments.map((att, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded-2xl flex items-center justify-between gap-2 text-xs ${isUser ? 'bg-white/10' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                {att.type === 'Image' ? (
                                  att.previewUrl ? (
                                    <img src={att.previewUrl} alt={att.name} className="w-8 h-8 rounded-lg object-cover" />
                                  ) : (
                                    <ImageIcon className="w-4 h-4 shrink-0 text-brand-400" />
                                  )
                                ) : (
                                  <FileText className="w-4 h-4 shrink-0 text-indigo-400" />
                                )}
                                <span className="truncate text-[11px] font-medium">{att.name}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSaveToDocumentVault(att as LocalAttachment)}
                                className={`p-1 rounded-lg text-[10px] font-semibold flex items-center gap-0.5 hover:underline shrink-0 ${isUser ? 'text-brand-100 hover:text-white' : 'text-brand-600 dark:text-brand-400'
                                  }`}
                                title="Save to Document Vault"
                              >
                                <Archive className="w-3 h-3" /> Save to Vault
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Autonomous Multi-Tool Actions Executed */}
                  {!isUser && msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
                    <div className="p-3 bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-indigo-500/10 rounded-2xl border border-amber-500/30 dark:border-amber-400/20 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>Autonomous Agent Mutation Executed:</span>
                      </div>
                      <div className="space-y-1.5">
                        {msg.actionsExecuted.map((act, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white/95 dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700 shadow-sm text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-mono text-[10px] uppercase font-bold">
                                {act.type.replace('_', ' ')}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{act.title}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{act.detail}</p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Database Updated
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clean Assistant Verification Footer */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Grounded in Household Database</span>
                        {msg.latencyMs && (
                          <span className="text-[10px] text-slate-400 font-mono">({msg.latencyMs}ms)</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleSpeakMessage(msg.id, msg.text)}
                          className={`p-1.5 rounded-xl transition-all ${
                            speakingMsgId === msg.id
                              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800 animate-pulse'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-brand-500'
                          }`}
                          title={speakingMsgId === msg.id ? 'Stop speaking audio' : 'Read aloud'}
                        >
                          {speakingMsgId === msg.id ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold">
                              <Square className="w-3 h-3 fill-current" /> Stop
                            </span>
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isAITyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center text-white text-xs">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-3xl bg-slate-100 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
              Thinking and consulting family records...
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

      {/* Active Attachments Tray (Multiple files support) */}
      {attachments.length > 0 && (
        <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Attachments ({attachments.length}):
          </span>
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs shrink-0 shadow-sm"
            >
              {att.type === 'Image' ? (
                att.previewUrl ? (
                  <img src={att.previewUrl} alt={att.name} className="w-6 h-6 rounded object-cover" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-brand-500" />
                )
              ) : (
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span className="truncate max-w-[140px] font-medium text-slate-700 dark:text-slate-200">
                {att.name}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="text-slate-400 hover:text-rose-500"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setAttachments([])}
            className="text-[11px] text-rose-500 hover:underline font-semibold ml-auto shrink-0"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Active Voice Listening Banner with Audio Waves */}
      {isVoiceActive && (
        <div className="p-3.5 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 text-white flex items-center justify-between gap-3 shadow-lg border-b border-white/20 animate-fadeIn">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-9 h-9 rounded-2xl bg-white/30 animate-ping absolute inset-0 opacity-40" />
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 shadow-inner">
                <Mic className="w-4 h-4 text-white animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-200">
                  Live Voice Assistant
                </span>
                <div className="flex items-center gap-1 h-5 px-1">
                  <span className="w-1 bg-white rounded-full animate-bounce [animation-duration:600ms] [animation-delay:-0.4s] h-2.5" />
                  <span className="w-1 bg-white rounded-full animate-bounce [animation-duration:800ms] [animation-delay:-0.2s] h-4.5" />
                  <span className="w-1 bg-white rounded-full animate-bounce [animation-duration:500ms] [animation-delay:-0.5s] h-5" />
                  <span className="w-1 bg-white rounded-full animate-bounce [animation-duration:700ms] [animation-delay:-0.1s] h-3.5" />
                  <span className="w-1 bg-white rounded-full animate-bounce [animation-duration:650ms] [animation-delay:-0.3s] h-4.5" />
                  <span className="w-1 bg-white rounded-full animate-bounce [animation-duration:550ms] h-2" />
                </div>
              </div>
              <p className="text-xs font-semibold text-white/95 truncate">
                "{voiceText || 'Listening... Speak your household instruction now!'}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {inputText.trim() && (
              <button
                type="button"
                onClick={() => {
                  if (recognitionRef.current) {
                    try { recognitionRef.current.stop(); } catch {}
                  }
                  setIsVoiceActive(false);
                  void handleSend();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white text-brand-700 font-bold text-xs shadow-md hover:bg-white/90 hover:scale-105 active:scale-95 transition-all"
              >
                Send Voice 🚀
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (recognitionRef.current) {
                  try { recognitionRef.current.abort(); } catch {}
                }
                setIsVoiceActive(false);
                setVoiceText('');
              }}
              className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs transition-colors"
              title="Cancel Voice Input"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Speaking Active Bar with Stop Button */}
      {speakingMsgId && (
        <div className="p-3 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 text-white flex items-center justify-between px-5 border-t border-white/20 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">HomeBrain is speaking aloud...</p>
              <p className="text-[10px] text-rose-100">Press Escape or click Stop Speaking to interrupt</p>
            </div>
          </div>
          <button
            type="button"
            onClick={stopGlobalSpeech}
            className="px-4 py-2 rounded-xl bg-white text-rose-600 hover:bg-rose-50 font-black text-xs flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Speaking</span>
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-700 flex items-center gap-1 sm:gap-2 shrink-0 z-10 w-full"
      >
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors relative shrink-0 active:scale-95 touch-manipulation"
            title="Upload Documents or Photos (Multimodal)"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            {attachments.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowVisionModal(true)}
            className="p-1.5 sm:p-2 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors shrink-0 active:scale-95 touch-manipulation"
            title="Multimodal Camera & Vision Scanner"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-1.5 sm:p-2 rounded-xl transition-colors shrink-0 active:scale-95 touch-manipulation ${
              isVoiceActive
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Voice Assistant Mode"
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <input
          type="text"
          placeholder="Ask HomeBrain AI..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          className="flex-1 w-0 min-w-0 px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
        />

        <button
          type="submit"
          disabled={!inputText.trim() && attachments.length === 0}
          className="shrink-0 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white shadow-md transition-all flex items-center justify-center min-w-[36px] h-[36px] sm:min-w-[42px] sm:h-[42px] active:scale-95 touch-manipulation cursor-pointer"
          title="Send message"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>

      {/* Multiple Files Upload Dialog (Multimodal) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                📎 Upload Files for Multimodal AI Analysis
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload photos, scanned receipts, prescriptions, bills, or PDFs/Word docs. HomeBrain AI will analyze and answer questions about them.
            </p>

            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-500 text-center space-y-2 cursor-pointer transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt"
                onChange={handleMultipleFiles}
                disabled={isUploading}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
              <p className="text-[11px] text-slate-400">
                Supported: PDF, DOCX, TXT, PNG, JPG, WEBP (Up to 15 MB each)
              </p>
            </div>

            {isUploading && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-brand-600 py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading and encoding files...
              </div>
            )}

            <button
              onClick={() => setShowUploadModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Multimodal Camera Vision Scanner Modal */}
      <MultimodalVisionModal
        isOpen={showVisionModal}
        onClose={() => setShowVisionModal(false)}
      />
    </div>
  );
};
