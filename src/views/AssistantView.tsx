import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SectionHero } from '../components/ui/SectionHero';
import { HealthOverviewIllustration } from '../components/ContextualIllustrations';
import { SafeMarkdown } from '../components/ui/SafeMarkdown';
import { ChatMessage } from '../types';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  HeartHandshake,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  RotateCcw,
  Stethoscope,
  Database,
  ClipboardCheck,
  AlertTriangle,
  UserRound,
  FileCheck2
} from 'lucide-react';
import { generateRAGAssistantResponse } from '../services/rag/ragGenerationService';
import { RAGSourcesBadge } from '../components/RAGSourcesBadge';
import { RAGVaultModal } from '../components/RAGVaultModal';
import { getVaultStats } from '../services/rag/ragVaultService';

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg-welcome',
  sender: 'assistant',
  copilotMode: 'patient',
  text: "**Namaste!** I am HealYaar, your accessible health friend. You can describe any symptom, ask about a medical term, or discuss lab test results in simple everyday words.\n\nMy responses are grounded in your private **Health Knowledge Vault** and verified **clinical guidelines**. Switch to **Clinician Copilot Mode** above to generate verifiable **SOAP Notes** with differential considerations and interaction checks.",
  timestamp: 'Just now',
  suggestedFollowUps: [
    "What does my hemoglobin level indicate and what foods help absorption?",
    "What does 'borderline high cholesterol' mean?",
    "Home care for mild fever and cold",
    "Why does my left knee ache after walking?"
  ],
  uncertaintyNote: "General health education only. I cannot diagnose diseases or replace your doctor."
};

export const AssistantView: React.FC = () => {
  const {
    t,
    setTab,
    startVoiceListening,
    stopVoiceListening,
    isListening,
    speakText,
    stopSpeaking,
    isAudioPlaying,
    currentUser
  } = useApp();

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [vaultChunkCount, setVaultChunkCount] = useState(0);
  const [copilotMode, setCopilotMode] = useState<'patient' | 'clinician'>('patient');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getStorageKey = () => `healyaar_user_${currentUser?.id || 'anonymous'}_chat_history`;

  // Load chat history scoped to current user
  useEffect(() => {
    if (!currentUser?.id) {
      setMessages([DEFAULT_WELCOME_MESSAGE]);
      setVaultChunkCount(0);
      return;
    }

    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        } else {
          setMessages([DEFAULT_WELCOME_MESSAGE]);
        }
      } else {
        setMessages([DEFAULT_WELCOME_MESSAGE]);
      }
    } catch {
      setMessages([DEFAULT_WELCOME_MESSAGE]);
    }

    getVaultStats(currentUser.id).then(stats => setVaultChunkCount(stats.totalChunks));
  }, [currentUser?.id]);

  // Reset in-memory chat immediately on session reset / sign out
  useEffect(() => {
    const handleReset = () => {
      setMessages([DEFAULT_WELCOME_MESSAGE]);
      setInputQuery('');
      setVaultChunkCount(0);
    };
    window.addEventListener('healyaar_session_reset', handleReset);
    return () => window.removeEventListener('healyaar_session_reset', handleReset);
  }, []);

  // Save chat history scoped to current user
  useEffect(() => {
    if (!currentUser?.id || messages.length === 0) return;
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history:', e);
    }
  }, [messages, currentUser?.id]);

  // Check if a pending voice query or prefill was set by another tab
  useEffect(() => {
    const pending = sessionStorage.getItem('healyaar_pending_voice_query');
    if (pending) {
      sessionStorage.removeItem('healyaar_pending_voice_query');
      void handleUserSubmit(pending);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleUserSubmit = async (userText: string, overrideMode?: 'patient' | 'clinician') => {
    if (!userText.trim()) return;
    const activeMode = overrideMode || copilotMode;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      copilotMode: activeMode,
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const botResponse = await generateRAGAssistantResponse(currentUser?.id || '', userText, activeMode);
      setMessages(prev => [...prev, botResponse]);
      if (currentUser?.id) {
        getVaultStats(currentUser.id).then(stats => setVaultChunkCount(stats.totalChunks));
      }
    } catch (err) {
      console.error('RAG assistant generation error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          copilotMode: activeMode,
          text: "I ran into a temporary issue retrieving your health records. Please try asking again in a moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          uncertaintyNote: "Temporary system error."
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleClinicianSignOff = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id !== messageId || !msg.soapNote) return msg;
        const nextReviewed = !msg.soapNote.reviewedByClinician;
        return {
          ...msg,
          soapNote: {
            ...msg.soapNote,
            reviewedByClinician: nextReviewed,
            reviewedAt: nextReviewed
              ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : undefined
          }
        };
      })
    );
  };

  const loadSampleJourney = () => {
    if (copilotMode === 'clinician') {
      void handleUserSubmit(
        "45yo female with fatigue, hemoglobin 10.2 g/dL, and morning knee stiffness — summarize differentials and iron interaction precautions.",
        'clinician'
      );
    } else {
      void handleUserSubmit("What does my hemoglobin level indicate and what foods help absorption?", 'patient');
    }
  };

  const handleResetChat = () => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    if (currentUser?.id) {
      localStorage.removeItem(getStorageKey());
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Header with Accessibility, Vault & Mode Actions */}
      <SectionHero
        title={t.nav.assistant}
        badge={{
          icon: HeartHandshake,
          text: copilotMode === 'clinician' ? 'Clinician Copilot Mode' : 'Accessible Care Companion',
          variant: 'teal'
        }}
        illustration={<HealthOverviewIllustration size="md" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Health Vault Button */}
            <button
              type="button"
              onClick={() => setIsVaultModalOpen(true)}
              className="interactive-button px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-xs"
              title="Inspect and manage your private Health Knowledge Vault"
            >
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Health Vault</span>
              <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-emerald-200 dark:bg-emerald-800 font-bold text-emerald-900 dark:text-emerald-100">
                {vaultChunkCount}
              </span>
            </button>

            <button
              type="button"
              onClick={loadSampleJourney}
              className="interactive-button px-3.5 py-2 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              <span>{copilotMode === 'clinician' ? 'Sample SOAP Case' : 'Sample Question'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetChat}
              className="interactive-button p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
              title="Reset conversation"
              aria-label="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        }
      />

      {/* Patient Mode | Clinician Copilot Mode Switcher */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Assistant reasoning mode"
          className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={copilotMode === 'patient'}
            onClick={() => setCopilotMode('patient')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              copilotMode === 'patient'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserRound className="w-4 h-4" aria-hidden="true" />
            <span>Patient Mode</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={copilotMode === 'clinician'}
            onClick={() => setCopilotMode('clinician')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              copilotMode === 'clinician'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Stethoscope className="w-4 h-4" aria-hidden="true" />
            <span>Clinician Copilot Mode</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          {copilotMode === 'clinician'
            ? 'Generates verifiable SOAP Notes (S/O/A/P), top-3 differentials, uncertainty flags, and drug-interaction checks.'
            : 'Plain-language educational explanations grounded in your private Health Vault & clinical guidelines.'}
        </p>
      </div>

      {/* Mandatory Non-Diagnostic Reminder */}
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs sm:text-sm">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <strong>{copilotMode === 'clinician' ? 'Clinical Decision Support Notice:' : 'Educational Notice:'}</strong>{' '}
          {copilotMode === 'clinician'
            ? 'Clinician Copilot drafts structured SOAP documentation and citation trails for review. All clinical assessments must be independently verified and signed off by a licensed physician.'
            : 'HealYaar explains health concepts to help you have better conversations with doctors. It does not provide medical diagnoses or prescribe medications.'}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div
        role="log"
        aria-live="polite"
        className="space-y-6 min-h-[350px] glass-card-subtle p-4 sm:p-6 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-glass"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-2xl w-full sm:w-auto p-5 sm:p-6 rounded-3xl shadow-sm text-base leading-relaxed ${
                  isUser
                    ? 'bg-teal-700 text-white rounded-br-none shadow-md'
                    : msg.isEmergency
                    ? 'glass-card-subtle bg-red-50/80 dark:bg-red-950/40 border-2 border-red-500 text-red-950 dark:text-red-200 rounded-bl-none'
                    : msg.copilotMode === 'clinician'
                    ? 'bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white rounded-bl-none shadow-md'
                    : 'glass-card-content border border-white/70 dark:border-slate-700/60 text-slate-900 dark:text-white rounded-bl-none shadow-glass'
                }`}
              >
                {/* Clinician Copilot Mode Header Tag */}
                {!isUser && msg.copilotMode === 'clinician' && !msg.isEmergency && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-indigo-100 dark:border-indigo-900/60">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold border border-indigo-200 dark:border-indigo-800">
                      <Stethoscope className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Clinician Copilot Draft</span>
                    </span>
                    {msg.soapNote?.reviewedByClinician && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                        <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Signed Off {msg.soapNote.reviewedAt ? `at ${msg.soapNote.reviewedAt}` : ''}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Emergency Header if applicable */}
                {msg.isEmergency && (
                  <div className="flex items-center gap-2 font-black text-red-600 dark:text-red-400 mb-2">
                    <ShieldAlert className="w-6 h-6 animate-pulse" aria-hidden="true" />
                    <span className="text-lg uppercase">Urgent Emergency Alert</span>
                  </div>
                )}

                {/* Main Message Text rendered via XSS-safe SafeMarkdown */}
                {isUser ? (
                  <div className="whitespace-pre-line font-medium">{msg.text}</div>
                ) : (
                  <SafeMarkdown content={msg.text} className="text-sm sm:text-base font-medium" />
                )}

                {/* Structured Clinician SOAP Note Card */}
                {!isUser && msg.soapNote && (
                  <div className="mt-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-slate-50/90 dark:bg-slate-950/60 p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
                    <div className="flex items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-900/60 pb-2.5">
                      <h4 className="font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 text-sm sm:text-base">
                        <ClipboardCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                        <span>Verifiable SOAP Clinical Note</span>
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Draft • Dual-Layer RAG
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                          S — Subjective
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{msg.soapNote.subjective}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                          O — Objective (Vault & Records)
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                          {msg.soapNote.objective}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                          A — Assessment & Top 3 Differential Considerations
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 mb-2.5">{msg.soapNote.assessment}</p>
                        <div className="space-y-2">
                          {msg.soapNote.differentials.map((diff, dIdx) => (
                            <div
                              key={dIdx}
                              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {dIdx + 1}. {diff.condition}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    diff.likelihood === 'Primary Consideration'
                                      ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                      : diff.likelihood === 'Secondary'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  {diff.likelihood}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{diff.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                          P — Recommended Clinical Plan
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-800 dark:text-slate-200">
                          {msg.soapNote.plan.map((step, pIdx) => (
                            <li key={pIdx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Drug-Interaction Warnings */}
                    {msg.soapNote.drugInteractionWarnings.length > 0 && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
                        <div className="text-xs font-extrabold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                          <span>Drug & Nutrient Interaction Warnings</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-rose-900 dark:text-rose-200">
                          {msg.soapNote.drugInteractionWarnings.map((warn, wIdx) => (
                            <li key={wIdx}>{warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Uncertainty Markers */}
                    {msg.soapNote.uncertaintyMarkers.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1">
                        <div className="text-xs font-extrabold text-amber-900 dark:text-amber-300">
                          Uncertainty & Verification Markers
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-amber-900/90 dark:text-amber-200">
                          {msg.soapNote.uncertaintyMarkers.map((u, uIdx) => (
                            <li key={uIdx}>{u}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Clinician Reviewed & Signed Off Toggle */}
                    <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Human-in-the-loop verification checkpoint
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleClinicianSignOff(msg.id)}
                        aria-pressed={Boolean(msg.soapNote.reviewedByClinician)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                          msg.soapNote.reviewedByClinician
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-white dark:bg-slate-800 border-2 border-indigo-500 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>
                          {msg.soapNote.reviewedByClinician
                            ? `Clinician Reviewed & Signed Off (${msg.soapNote.reviewedAt || 'Verified'})`
                            : 'Mark Clinician Reviewed & Signed Off'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Emergency Action Callout */}
                {msg.emergencyActionText && (
                  <div className="mt-4 p-4 rounded-2xl bg-red-600 text-white font-bold space-y-3">
                    <p>{msg.emergencyActionText}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href="tel:108"
                        className="px-4 py-2 bg-white text-red-700 font-extrabold rounded-xl text-sm shadow hover:bg-red-50"
                      >
                        Call 108 Ambulance
                      </a>
                      <a
                        href="tel:112"
                        className="px-4 py-2 bg-red-900 text-white font-extrabold rounded-xl text-sm hover:bg-black"
                      >
                        Call 112 National
                      </a>
                    </div>
                  </div>
                )}

                {/* Plain Language Glossary if attached */}
                {msg.plainLanguageGlossary && msg.plainLanguageGlossary.length > 0 && (
                  <div className="mt-4 p-4 bg-teal-50/80 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800/70 space-y-2 text-sm">
                    <div className="font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                      <span>Plain-Language Terms:</span>
                    </div>
                    {msg.plainLanguageGlossary.map((item, idx) => (
                      <div key={idx} className="text-slate-800 dark:text-slate-200">
                        <strong className="text-teal-900 dark:text-teal-300">{item.term}:</strong> {item.explanation}
                      </div>
                    ))}
                  </div>
                )}

                {/* Next Steps Guidance Block */}
                {msg.nextSteps && (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                      <span>Sensible Next Steps:</span>
                    </div>
                    <p className="text-sm">{msg.nextSteps.summary}</p>
                    {msg.nextSteps.actionLabel && msg.nextSteps.actionTab && (
                      <button
                        type="button"
                        onClick={() => setTab(msg.nextSteps!.actionTab!)}
                        className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
                      >
                        <Stethoscope className="w-4 h-4" aria-hidden="true" />
                        <span>{msg.nextSteps.actionLabel}</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}

                {/* RAG Context Sources Transparency Badge */}
                {msg.ragSources && msg.ragSources.length > 0 && (
                  <RAGSourcesBadge sources={msg.ragSources} />
                )}

                {/* Legacy Verified Sources Display */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Sources:</span>
                    {msg.sources.map((src, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700"
                      >
                        {src.organization} ({src.year})
                      </span>
                    ))}
                  </div>
                )}

                {/* Uncertainty & Disclaimers */}
                {msg.uncertaintyNote && (
                  <div className="mt-3 text-xs italic text-slate-500 dark:text-slate-400">
                    * {msg.uncertaintyNote}
                  </div>
                )}
              </div>

              {/* Message Footer: Timestamp & Audio Read-Aloud Button */}
              <div className="flex items-center gap-3 px-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{msg.timestamp}</span>
                {!isUser && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isAudioPlaying) {
                        stopSpeaking();
                      } else {
                        speakText(msg.text.replace(/\*\*/g, ''));
                      }
                    }}
                    className="flex items-center gap-1 font-bold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 px-2 py-1 rounded bg-teal-50 dark:bg-teal-950/60 border border-transparent hover:border-teal-200 dark:hover:border-teal-800 transition-colors"
                    aria-label={isAudioPlaying ? t.stopAudio : t.voiceReadAloud}
                  >
                    {isAudioPlaying ? (
                      <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{isAudioPlaying ? t.stopAudio : t.voiceReadAloud}</span>
                  </button>
                )}
              </div>

              {/* Suggested Follow-Up Prompt Pills */}
              {msg.suggestedFollowUps && (
                <div className="flex flex-wrap gap-2 pt-2 max-w-2xl">
                  {msg.suggestedFollowUps.map((prompt, pIdx) => (
                    <button
                      type="button"
                      key={pIdx}
                      onClick={() => void handleUserSubmit(prompt)}
                      className="interactive-button px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-xs transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm italic pl-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" aria-hidden="true" />
            <span>
              {copilotMode === 'clinician'
                ? 'Clinician Copilot is synthesizing Dual-Layer RAG evidence and drafting SOAP Note...'
                : 'HealYaar is retrieving health context and thinking carefully...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer with Voice and Send */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleUserSubmit(inputQuery);
        }}
        className="relative glass-card rounded-3xl border border-white/70 dark:border-slate-700/60 focus-within:border-teal-500 dark:focus-within:border-teal-500 shadow-glass p-2 flex items-center gap-2"
      >
        <label htmlFor="assistant-query-input" className="sr-only">
          Ask a health question
        </label>
        <input
          id="assistant-query-input"
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={
            copilotMode === 'clinician'
              ? 'Enter clinical presentation, lab values, or medication query for SOAP draft...'
              : 'Ask a health question, check lab results or medicines...'
          }
          className="flex-1 min-w-0 px-4 py-3 text-base text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none bg-transparent"
        />

        {/* Microphone Voice Button */}
        <button
          type="button"
          onClick={() => {
            if (isListening) {
              stopVoiceListening();
            } else {
              startVoiceListening((spoken) => {
                setInputQuery(spoken);
              });
            }
          }}
          className={`p-3 rounded-2xl transition-all flex-shrink-0 ${
            isListening
              ? 'bg-red-600 text-white animate-mic-active'
              : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/60'
          }`}
          title={isListening ? t.stopListening : t.tapToSpeak}
          aria-label={isListening ? t.stopListening : t.tapToSpeak}
        >
          {isListening ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputQuery.trim()}
          className={`p-3 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-xs flex-shrink-0 ${
            copilotMode === 'clinician'
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'bg-teal-600 hover:bg-teal-700'
          }`}
          aria-label="Send health question"
        >
          <Send className="w-5 h-5" aria-hidden="true" />
        </button>
      </form>

      {/* Health Knowledge Vault Modal (Portalized) */}
      <RAGVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => {
          setIsVaultModalOpen(false);
          if (currentUser?.id) {
            getVaultStats(currentUser.id).then(stats => setVaultChunkCount(stats.totalChunks));
          }
        }}
        userId={currentUser?.id || ''}
      />
    </div>
  );
};
