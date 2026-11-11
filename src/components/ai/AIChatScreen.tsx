import React, { useState, useRef, useEffect } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { isSupabaseConfigured, uploadPrivateFile } from '../../lib/supabase';
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
  Activity
} from 'lucide-react';

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
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [savedVaultNotice, setSavedVaultNotice] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      recognition.onerror = () => setIsVoiceActive(false);
      recognition.onend = () => setIsVoiceActive(false);

      recognition.start();
    } catch {
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
      <div className="p-4 sm:px-6 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-sm">
            🤖
          </div>
          <div>
            <h2 className="font-bold text-base flex items-center gap-1.5">
              HomeBrain Multimodal AI <Sparkles className="w-4 h-4 text-amber-300" />
            </h2>
            <p className="text-xs text-brand-100">Live RAG grounded in your family database & documents</p>
          </div>
        </div>

        <button
          onClick={clearAIConversation}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
            className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 transition-all shrink-0 shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Vault Notification Toast */}
      {savedVaultNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs flex items-center justify-between animate-fadeIn">
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
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {aiMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-500 to-indigo-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-brand-500/25">
              🧠
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${isUser
                      ? 'bg-brand-600 text-white'
                      : 'bg-gradient-to-tr from-brand-500 to-indigo-500 text-white'
                    }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                  <div
                    className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${isUser
                        ? 'bg-brand-600 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700/70 text-slate-900 dark:text-white rounded-tl-none border border-slate-200/50 dark:border-slate-600'
                      }`}
                  >
                    {msg.text}

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

                  {/* Cognitive Telemetry Bar */}
                  {!isUser && (msg.confidenceScore || msg.latencyMs || msg.cognitiveMetrics) && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px]">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono font-medium">
                        <Cpu className="w-3 h-3 text-purple-500" />
                        <span>Confidence: {((msg.confidenceScore || 0.985) * 100).toFixed(1)}%</span>
                      </div>
                      {msg.latencyMs && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span>{msg.latencyMs}ms</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                        <Database className="w-3 h-3 text-slate-400" />
                        <span>{msg.cognitiveMetrics?.nodesEvaluated || msg.groundingSources?.length || 11} Relational Nodes</span>
                      </div>
                      {msg.cognitiveMetrics?.tokensUsed && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                          <Activity className="w-3 h-3 text-slate-400" />
                          <span>~{msg.cognitiveMetrics.tokensUsed} tokens</span>
                        </div>
                      )}
                    </div>
                  )}

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

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-700 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="p-2.5 rounded-2xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors relative"
          title="Upload Documents or Photos (Multimodal)"
        >
          <Paperclip className="w-5 h-5" />
          {attachments.length > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
          )}
        </button>

        <button
          type="button"
          onClick={handleToggleVoice}
          className={`p-2.5 rounded-2xl transition-colors ${isVoiceActive
              ? 'bg-rose-500 text-white animate-pulse'
              : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          title="Voice Assistant Mode"
        >
          <Mic className="w-5 h-5" />
        </button>

        <input
          type="text"
          placeholder="Ask HomeBrain AI about schedule, medicines, groceries, bills, or uploaded files..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim() && attachments.length === 0}
          className="p-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white shadow-md transition-all flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
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
    </div>
  );
};
