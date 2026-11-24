import React from 'react';
import { useVoiceAssistant, VOICE_LONG_PRESS_MS } from '../context/VoiceAssistantContext';
import { useApp } from '../context/AppContext';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  AlertCircle,
  Clock,
  Compass,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export const VoiceAssistantBanner: React.FC = () => {
  const {
    assistantState,
    isAssistantActive,
    holdProgress,
    liveTranscript,
    lastSpokenResponse,
    assistantError,
    pendingActionName,
    deactivateAssistant,
    retryListening
  } = useVoiceAssistant();

  const { highContrast } = useApp();

  // 1. Long-press in progress: ACTIVATING or DEACTIVATING (0s to 0.8s countdown)
  if (assistantState === 'ACTIVATING' || assistantState === 'DEACTIVATING') {
    const isActivating = assistantState === 'ACTIVATING';
    const totalSecStr = (VOICE_LONG_PRESS_MS / 1000).toFixed(1);
    const secondsRemaining = Math.max(0.1, Number(((100 - holdProgress) * (VOICE_LONG_PRESS_MS / 100000)).toFixed(1)));

    return (
      <div
        role="status"
        aria-live="assertive"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-fade-in"
      >
        <div
          className={`p-5 rounded-3xl shadow-2xl border-2 flex flex-col gap-3 backdrop-blur-md ${
            isActivating
              ? 'bg-slate-900/95 border-teal-500 text-white'
              : 'bg-rose-950/95 border-rose-500 text-white'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                  isActivating ? 'bg-teal-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                <Clock className="w-5 h-5 animate-pulse" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base">
                  {isActivating
                    ? 'Holding Spacebar to Activate...'
                    : 'Holding Spacebar to Turn Off...'}
                </h4>
                <p className="text-xs text-slate-300">
                  Keep holding for {secondsRemaining}s ({totalSecStr}s total)
                </p>
              </div>
            </div>
            <span className="text-sm font-black font-mono text-teal-300">
              {holdProgress}%
            </span>
          </div>

          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                isActivating ? 'bg-teal-400' : 'bg-rose-400'
              }`}
              style={{ width: `${holdProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Voice Assistant States (LISTENING, PROCESSING, EXECUTING, RESPONDING, AWAITING_CONFIRMATION, ERROR)
  if (isAssistantActive) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl animate-fade-in"
      >
        <div
          className={`p-4 sm:p-5 rounded-3xl shadow-2xl border-2 flex flex-col gap-3 backdrop-blur-md transition-all ${
            highContrast
              ? 'bg-black border-yellow-400 text-yellow-300'
              : assistantState === 'ERROR'
              ? 'bg-amber-950/95 border-amber-500 text-white'
              : assistantState === 'AWAITING_CONFIRMATION'
              ? 'bg-purple-950/95 border-purple-400 text-white'
              : 'bg-slate-900/95 border-teal-500 text-white'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {assistantState === 'LISTENING' && (
                <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-teal-600 animate-mic-active flex-shrink-0 shadow-lg">
                  <Mic className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
              )}
              {assistantState === 'PROCESSING' && (
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-600 animate-spin flex-shrink-0">
                  <Loader2 className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
              )}
              {assistantState === 'EXECUTING' && (
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-blue-600 animate-bounce flex-shrink-0">
                  <Compass className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
              )}
              {assistantState === 'RESPONDING' && (
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-600 animate-pulse flex-shrink-0">
                  <Volume2 className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
              )}
              {assistantState === 'AWAITING_CONFIRMATION' && (
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-purple-600 animate-pulse flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
              )}
              {assistantState === 'ERROR' && (
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-amber-600 flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-400" aria-hidden="true" />
                    {assistantState === 'LISTENING' && 'Listening for commands...'}
                    {assistantState === 'PROCESSING' && 'Understanding...'}
                    {assistantState === 'EXECUTING' && 'Performing action...'}
                    {assistantState === 'RESPONDING' && 'Voice Assistant Response'}
                    {assistantState === 'AWAITING_CONFIRMATION' && 'Confirmation Required'}
                    {assistantState === 'ERROR' && 'Voice Service Notice'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm truncate text-slate-200 mt-0.5 font-medium">
                  {assistantState === 'LISTENING' && (
                    liveTranscript ? (
                      <span className="text-teal-300">Hearing: "{liveTranscript}"</span>
                    ) : (
                      'Try: "Go to home", "Open reports", "Period tracker", "Find a doctor"'
                    )
                  )}
                  {assistantState === 'PROCESSING' && `Parsing: "${liveTranscript}"`}
                  {assistantState === 'RESPONDING' && `"${lastSpokenResponse}"`}
                  {assistantState === 'AWAITING_CONFIRMATION' && (
                    <span className="text-purple-200 font-bold">
                      {pendingActionName}: Say "Yes confirm" or "Cancel"
                    </span>
                  )}
                  {assistantState === 'ERROR' && (assistantError || 'Voice recognition unavailable.')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {assistantState === 'ERROR' ? (
                <button
                  type="button"
                  onClick={retryListening}
                  className="px-3.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-xs shadow transition-all active:scale-95"
                >
                  Try Again
                </button>
              ) : null}

              <button
                type="button"
                onClick={deactivateAssistant}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
                title={`Hold Spacebar ${(VOICE_LONG_PRESS_MS / 1000).toFixed(1)}s or click to turn off`}
                aria-label="Turn off voice assistant"
              >
                <MicOff className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Turn Off</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Hands-free active • Commands are confirmed verbally</span>
            <span className="font-mono text-teal-300">Hold Spacebar {(VOICE_LONG_PRESS_MS / 1000).toFixed(1)}s to turn off</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. When OFF: Docked cleanly inside the top header bar (Navbar.tsx) — render nothing floating here
  return null;
};
