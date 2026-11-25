import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LabTestMetric } from '../types';
import { SectionHero } from '../components/ui/SectionHero';
import { MedicalReportsIllustration } from '../components/ContextualIllustrations';
import { medicalReportService } from '../services/medicalReportService';
import { authService } from '../services/authService';
import { aiClient } from '../services/aiClient';
import { indexMedicalReport, deleteChunksBySource } from '../services/rag/ragVaultService';
import { formatDisplayDate } from '../utils/healthFormatters';
import {
  validateVisionFileBeforeUpload,
  VisionUploadValidationError
} from '../utils/visionUploadHelpers';
import { PortalModal } from '../components/ui/PortalModal';
import { Tooltip } from '../components/ui/Tooltip';
import {
  FileSpreadsheet,
  UploadCloud,
  FileText,
  AlertCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Copy,
  Sparkles,
  ArrowLeft,
  Trash2,
  Eye,
  X,
  Loader2,
  Check,
  FileCheck
} from 'lucide-react';

export interface AnalyzedReportRecord {
  id: string;
  title: string;
  fileName: string;
  fileSizeFormatted?: string;
  fileDataUrl?: string;
  fileTextContent?: string;
  uploadDate: string;
  isDemo: boolean;
  poweredBy?: string;
  summary: string;
  keyFindings: string[];
  metrics?: LabTestMetric[];
  thingsToDiscuss: string[];
  disclaimer: string;
}

interface VisionLabReportData {
  title?: string;
  labName?: string;
  reportDate?: string;
  summary?: string;
  generalAdvice?: string;
  questionsForDoctor?: string[];
  uncertaintyNotes?: string[];
  metrics?: Array<{
    name: string;
    code?: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    status?: string;
    plainExplanation?: string;
    clinicalContext?: string;
  }>;
}

const normalizeMetricStatus = (raw?: string): LabTestMetric['status'] => {
  const lower = (raw || '').toLowerCase();
  if (lower.includes('low') || lower.includes('below')) return 'low';
  if (lower.includes('high') || lower.includes('above') || lower.includes('elevated')) return 'high';
  if (lower.includes('borderline')) return 'borderline';
  return 'normal';
};

export const ReportsView: React.FC = () => {
  const { requestPermission, permissions, speakText, stopSpeaking, isAudioPlaying, showToast, currentUser, isDemoMode } = useApp();

  // Report Page State Machine: 'empty' | 'selected' | 'analyzing' | 'results'
  const [pageState, setPageState] = useState<'empty' | 'selected' | 'analyzing' | 'results'>('empty');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeReport, setActiveReport] = useState<AnalyzedReportRecord | null>(null);

  // Original Report Modal state
  const [isOriginalModalOpen, setIsOriginalModalOpen] = useState<boolean>(false);

  // Copied questions state
  const [copiedQuestions, setCopiedQuestions] = useState<boolean>(false);

  // Active filter for metrics (if metrics present)
  const [metricFilter, setMetricFilter] = useState<'all' | 'flagged'>('all');

  // Drag and drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // First-time document upload consent (unchecked by default until accepted per user)
  const [uploadConsentAccepted, setUploadConsentAccepted] = useState<boolean>(false);
  const [uploadConsentError, setUploadConsentError] = useState<string | null>(null);
  const [uploadSizeError, setUploadSizeError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Persistent Report History (Supabase & Local)
  // -------------------------------------------------------------
  const [reportHistory, setReportHistory] = useState<AnalyzedReportRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (currentUser?.id) {
      try {
        const storedConsent = localStorage.getItem(`healyaar_user_${currentUser.id}_upload_consent_reports`);
        setUploadConsentAccepted(storedConsent === 'true');
      } catch {
        setUploadConsentAccepted(false);
      }
      medicalReportService.getReports(currentUser.id).then((cloud) => {
        if (isMounted) {
          setReportHistory(cloud);
          if (isDemoMode && cloud.length > 0) {
            setActiveReport((prev) => prev || cloud[0]);
            setPageState('results');
          }
        }
      });
    } else {
      setReportHistory([]);
      setActiveReport(null);
      setPageState('empty');
      setUploadConsentAccepted(false);
    }
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, isDemoMode]);

  useEffect(() => {
    const handleReset = () => {
      setReportHistory([]);
      setActiveReport(null);
      setSelectedFile(null);
      setIsOriginalModalOpen(false);
      setPageState('empty');
    };
    window.addEventListener('healyaar_session_reset', handleReset);
    return () => window.removeEventListener('healyaar_session_reset', handleReset);
  }, []);

  // File Selection Handlers
  const acceptSelectedFile = (file: File) => {
    if (isDemoMode) {
      showToast('Demo Mode is read-only. Sign in to upload and analyze your own lab reports.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const check = validateVisionFileBeforeUpload(file);
    if (!check.valid) {
      setUploadSizeError(check.error);
      setSelectedFile(null);
      setPageState('empty');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setUploadSizeError(null);
    setSelectedFile(file);
    setPageState('selected');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    acceptSelectedFile(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      acceptSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveSelection = () => {
    setSelectedFile(null);
    setUploadSizeError(null);
    setPageState('empty');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Analysis Execution via Server-Side Gemini 4 Hydrogen Multimodal Vision (Zero Fabricated Values)
  const handleAnalyze = () => {
    if (!selectedFile) return;

    const sizeCheck = validateVisionFileBeforeUpload(selectedFile);
    if (!sizeCheck.valid) {
      setUploadSizeError(sizeCheck.error);
      return;
    }

    if (!uploadConsentAccepted) {
      setUploadConsentError('Please confirm your consent to analyze this medical report before continuing.');
      return;
    }
    setUploadConsentError(null);
    setUploadSizeError(null);
    if (currentUser?.id) {
      try {
        localStorage.setItem(`healyaar_user_${currentUser.id}_upload_consent_reports`, 'true');
      } catch {
        // ignore
      }
      authService.recordConsent(currentUser.id, 'report_upload', '1.0').catch(() => {});
    }
    setPageState('analyzing');

    const executeProcessing = async () => {
      const fileSizeFormatted = `${(selectedFile.size / 1024).toFixed(1)} KB`;
      let fileDataUrl = '';
      let fileTextContent: string | undefined;

      try {
        if (selectedFile.type.startsWith('text/') || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.csv')) {
          fileTextContent = await selectedFile.text();
        } else {
          fileDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(selectedFile);
          });
        }
      } catch {
        // ignore file preview read error
      }

      const cleanTitle = selectedFile.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();

      const uploadDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const supportsVisionMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'].includes(
        selectedFile.type
      );

      let realRecord: AnalyzedReportRecord | null = null;

      if (supportsVisionMime) {
        try {
          const visionRes = await aiClient.analyzeVision<VisionLabReportData>({
            visionType: 'lab_report',
            file: selectedFile
          });
          const extracted = visionRes.data || {};
          const extractedMetrics: LabTestMetric[] = Array.isArray(extracted.metrics)
            ? extracted.metrics.map((m, idx) => ({
                id: `m-${Date.now()}-${idx}`,
                name: m.name || 'Biomarker',
                code: m.code || '',
                value: String(m.value ?? ''),
                unit: m.unit || '',
                referenceRange: m.referenceRange || 'See lab sheet',
                status: normalizeMetricStatus(m.status),
                plainExplanation: m.plainExplanation || 'Review this value with your doctor.',
                clinicalContext: m.clinicalContext || ''
              }))
            : [];

          const findings: string[] = [];
          if (extracted.labName) findings.push(`Laboratory: ${extracted.labName}`);
          if (extracted.reportDate) findings.push(`Report Date: ${extracted.reportDate}`);
          if (extractedMetrics.length > 0) {
            const flaggedCount = extractedMetrics.filter((m) => m.status !== 'normal').length;
            findings.push(
              `Extracted ${extractedMetrics.length} biomarker(s) (${flaggedCount} outside standard reference range).`
            );
          }
          if (extracted.generalAdvice) findings.push(extracted.generalAdvice);
          if (Array.isArray(extracted.uncertaintyNotes)) {
            extracted.uncertaintyNotes.forEach((n) => {
              if (n && n.trim()) findings.push(n.trim());
            });
          }

          realRecord = {
            id: `rep-${Date.now()}`,
            title: extracted.title && extracted.title.trim() ? extracted.title.trim() : cleanTitle || 'Uploaded Medical Report',
            fileName: selectedFile.name,
            fileSizeFormatted,
            fileDataUrl,
            fileTextContent,
            uploadDate,
            isDemo: false,
            poweredBy: visionRes.poweredBy || 'Gemini 4 Hydrogen',
            summary:
              extracted.summary ||
              `Report "${selectedFile.name}" analyzed cleanly. Review extracted biomarkers below with your physician.`,
            keyFindings: findings.length > 0 ? findings : [`Document file: ${selectedFile.name} (${fileSizeFormatted})`],
            metrics: extractedMetrics.length > 0 ? extractedMetrics : undefined,
            thingsToDiscuss:
              Array.isArray(extracted.questionsForDoctor) && extracted.questionsForDoctor.length > 0
                ? extracted.questionsForDoctor
                : [
                    `Review this report (${selectedFile.name}) with your licensed physician.`,
                    'Confirm whether any flagged values require repeat testing or dietary adjustments.'
                  ],
            disclaimer:
              'AI-extracted educational summary from your uploaded document. Always verify figures against your original laboratory printout and consult a licensed physician.'
          };
        } catch (err) {
          if (err instanceof VisionUploadValidationError) {
            setUploadSizeError(err.message);
            setPageState('selected');
            return;
          }
          console.warn('Live vision lab extraction unavailable, saving original document without fabricated values:', err);
        }
      }

      if (!realRecord) {
        realRecord = {
          id: `rep-${Date.now()}`,
          title: cleanTitle.length > 2 ? cleanTitle : 'Uploaded Medical Report',
          fileName: selectedFile.name,
          fileSizeFormatted,
          fileDataUrl,
          fileTextContent,
          uploadDate,
          isDemo: false,
          summary: `Report "${selectedFile.name}" (${fileSizeFormatted}) was securely saved to your personal Health Vault. Live AI biomarker extraction could not complete for this file right now, so no numerical values were fabricated.`,
          keyFindings: [
            `Document file: ${selectedFile.name}`,
            `Document size: ${fileSizeFormatted}`,
            `Format: ${selectedFile.type || 'Document file'}`,
            'Original file preserved cleanly inside your private account with zero fabricated metrics.'
          ],
          metrics: undefined,
          thingsToDiscuss: [
            `Review this original document (${selectedFile.name}) together during your next doctor consultation.`,
            'Confirm if the test reference ranges match your local laboratory equipment.',
            'Ask if any follow-up tests or lifestyle steps are recommended.'
          ],
          disclaimer:
            'This tool organizes your uploaded report for doctor consultation. It does not provide medical diagnosis or replace physician clinical judgment.'
        };
      }

      const saved = await medicalReportService.saveReport(currentUser?.id || '', realRecord, selectedFile);
      if (currentUser?.id) {
        indexMedicalReport(currentUser.id, {
          id: saved.id,
          title: saved.title,
          date: saved.uploadDate,
          summary: saved.summary,
          keyFindings: saved.keyFindings,
          biomarkers: saved.metrics?.map((m) => ({
            name: m.name,
            value: m.value,
            unit: m.unit,
            status: m.status,
            normalRange: m.referenceRange
          }))
        }).catch((e) => console.warn('RAG report indexing failed:', e));
      }
      setActiveReport(saved);
      setReportHistory((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
      setPageState('results');
      showToast(
        saved.poweredBy
          ? `Report analyzed with ${saved.poweredBy} and indexed into your Health Vault.`
          : 'Original report archived securely in your Health Vault.'
      );
    };

    if (!permissions.reportOcr) {
      requestPermission(
        'report_ocr',
        'Document Analysis Permission',
        `HealYaar sends "${selectedFile.name}" over an authenticated HTTPS connection to extract plain-language lab summaries and saves records strictly to your private account.`,
        executeProcessing
      );
    } else {
      void executeProcessing();
    }
  };

  // -------------------------------------------------------------
  // History Actions
  // -------------------------------------------------------------
  const handleViewHistoricalReport = (report: AnalyzedReportRecord) => {
    setActiveReport(report);
    setPageState('results');
  };

  const handleDeleteHistoricalReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDemoMode) {
      showToast('Demo Mode is read-only. Sign in to manage personal reports.');
      return;
    }
    setReportHistory((prev) => prev.filter((r) => r.id !== id));
    if (activeReport?.id === id) {
      setActiveReport(null);
      setPageState('empty');
    }
    await medicalReportService.deleteReport(currentUser?.id || '', id);
    if (currentUser?.id) {
      deleteChunksBySource(currentUser.id, id).catch(e => console.warn('RAG chunk deletion failed:', e));
    }
    showToast('Report removed from history.');
  };

  const copyQuestionsToClipboard = () => {
    if (!activeReport) return;
    const text = activeReport.thingsToDiscuss.map((q, i) => `${i + 1}. ${q}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedQuestions(true);
    showToast('Questions copied to clipboard!');
    setTimeout(() => setCopiedQuestions(false), 2500);
  };

  const getStatusBadge = (status: LabTestMetric['status']) => {
    switch (status) {
      case 'low':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
            Below Typical Range
          </span>
        );
      case 'high':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
            Above Typical Range
          </span>
        );
      case 'borderline':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-950/70 text-yellow-900 dark:text-yellow-300 text-xs font-bold border border-yellow-300 dark:border-yellow-800">
            Borderline
          </span>
        );
      case 'normal':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Normal Range
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* Section Hero */}
      {pageState !== 'results' && (
        <SectionHero
          title="Medical Reports"
          badge={{
            icon: FileSpreadsheet,
            text: 'Clinical Records',
            variant: 'blue'
          }}
          illustration={<MedicalReportsIllustration size="md" />}
        />
      )}

      {/* =============================================================
          STATE 1 & 2: EMPTY & SELECTED UPLOAD CARD (Clean Minimalist)
      ============================================================= */}
      {pageState !== 'results' && pageState !== 'analyzing' && (
        <section className="interactive-card bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-center">

          {/* State 1: Empty Upload Zone */}
          {pageState === 'empty' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-8 sm:p-12 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center gap-4 ${
                isDragging
                  ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <UploadCloud className="w-12 h-12 text-slate-400 dark:text-slate-500" />

              <div className="space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-base">
                  Upload your medical report
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PDF, PNG, JPG, or text documents • Processed 100% locally on-device
                </p>
              </div>

              {/* Upload Button */}
              <label className="cursor-pointer px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow transition-all active:scale-95 inline-flex items-center gap-2">
                <UploadCloud className="w-4 h-4" aria-hidden="true" />
                <span>Upload Report (PDF, JPG, PNG)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp,.txt,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {uploadSizeError && (
                <div
                  role="alert"
                  className="max-w-lg w-full p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2 text-left"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{uploadSizeError}</span>
                </div>
              )}
            </div>
          )}

          {/* State 2: Report Selected */}
          {pageState === 'selected' && selectedFile && (
            <div className="p-6 sm:p-8 rounded-3xl border-2 border-teal-500/40 bg-teal-50/40 dark:bg-teal-950/30 space-y-6 text-left animate-fade-in max-w-lg mx-auto">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-3 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-xl flex-shrink-0">
                    <FileCheck className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white truncate text-base">
                        {selectedFile.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveSelection}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Remove selected file"
                  aria-label="Remove selected file"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* First-Time Upload Consent Checkbox */}
              <div className="space-y-1.5">
                <label
                  htmlFor="report-upload-consent"
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 cursor-pointer text-xs text-slate-700 dark:text-slate-300"
                >
                  <input
                    id="report-upload-consent"
                    type="checkbox"
                    checked={uploadConsentAccepted}
                    onChange={(e) => {
                      setUploadConsentAccepted(e.target.checked);
                      if (e.target.checked) setUploadConsentError(null);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 flex-shrink-0"
                  />
                  <span>
                    I consent to HealYaar analyzing this medical report for plain-language educational summary and indexing it privately inside my user-scoped Health Vault (not diagnostic).
                  </span>
                </label>
                {uploadConsentError && (
                  <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {uploadConsentError}
                  </p>
                )}
                {uploadSizeError && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{uploadSizeError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  className="flex-1 py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl shadow transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>Analyze Report</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveSelection}
                  className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* =============================================================
          STATE 3: ANALYZING STATE (Centered Clean Loader)
      ============================================================= */}
      {pageState === 'analyzing' && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4 animate-fade-in max-w-lg mx-auto">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Analyzing your report...
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Please wait while we review medical terms and organize findings on your device.
          </p>
        </section>
      )}

      {/* =============================================================
          STATE 4: RESULTS VIEW (Clean Hierarchy, depend on content)
      ============================================================= */}
      {pageState === 'results' && activeReport && (
        <section className="interactive-card bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in">
          {/* Top Bar: Back to History + Audio + Original Report Modal Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setPageState('empty');
                setSelectedFile(null);
              }}
              className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 dark:text-teal-300 hover:text-teal-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Upload &amp; History</span>
            </button>

            <div className="flex items-center gap-2">
              <Tooltip content="Inspect original uploaded document" position="top">
                <button
                  type="button"
                  onClick={() => setIsOriginalModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-teal-600" />
                  <span>View Original Report</span>
                </button>
              </Tooltip>

              <Tooltip content={isAudioPlaying ? 'Stop audio' : 'Listen with voice'} position="top">
                <button
                  type="button"
                  onClick={() => {
                    if (isAudioPlaying) {
                      stopSpeaking();
                    } else {
                      speakText(
                        `Report summary for ${activeReport.title}. ${activeReport.summary}`
                      );
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  {isAudioPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isAudioPlaying ? 'Stop Audio' : 'Read Summary'}</span>
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Report Header Title */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {activeReport.title}
              </h2>
              {activeReport.poweredBy && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  <span>Powered by {activeReport.poweredBy}</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              File: <strong className="text-slate-700 dark:text-slate-300">{activeReport.fileName}</strong> • Uploaded on {formatDisplayDate(activeReport.uploadDate)}
            </p>
          </div>

          {/* 1. Report Summary */}
          <div className="p-5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-1.5">
            <h3 className="font-bold text-teal-900 dark:text-teal-200 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <span>Report Summary</span>
            </h3>
            <p className="text-sm sm:text-base text-teal-950 dark:text-teal-100 font-medium leading-relaxed">
              {activeReport.summary}
            </p>
          </div>

          {/* 2. Key Findings */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Key Findings
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
              {activeReport.keyFindings.map((finding, idx) => (
                <li key={idx}>{finding}</li>
              ))}
            </ul>
          </div>

          {/* 3. Values / Measurements (Only when metrics exist) */}
          {activeReport.metrics && activeReport.metrics.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Values & Measurements
                </h3>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setMetricFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      metricFilter === 'all'
                        ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    All ({activeReport.metrics.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricFilter('flagged')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      metricFilter === 'flagged'
                        ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Flagged ({activeReport.metrics.filter((m) => m.status !== 'normal').length})
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {activeReport.metrics
                  .filter((m) => (metricFilter === 'flagged' ? m.status !== 'normal' : true))
                  .map((m, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 text-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-base">
                            {m.name}
                          </span>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Value: <strong className="text-slate-900 dark:text-white font-black">{m.value} {m.unit}</strong> • Reference: {m.referenceRange}
                          </div>
                        </div>
                        {getStatusBadge(m.status)}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        {m.plainExplanation}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 4. Things to Discuss With Your Doctor */}
          <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-purple-950 dark:text-purple-200 text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                <span>Things to Discuss With Your Doctor</span>
              </h3>
              <button
                type="button"
                onClick={copyQuestionsToClipboard}
                className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-slate-700 text-purple-800 dark:text-purple-200 rounded-lg text-xs font-bold border border-purple-300 dark:border-purple-700 flex items-center gap-1 shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedQuestions ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-300">
              {activeReport.thingsToDiscuss.map((question, idx) => (
                <li key={idx}>{question}</li>
              ))}
            </ol>
          </div>

          {/* 5. Medical Safety Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 text-amber-950 dark:text-amber-200 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Medical Disclaimer:</strong> {activeReport.disclaimer} Always consult a licensed physician before starting, stopping, or altering any medications.
            </div>
          </div>
        </section>
      )}

      {/* =============================================================
          STATE 5: COMPACT REPORT HISTORY (Clean, Non-Cluttered)
      ============================================================= */}
      {pageState !== 'analyzing' && (
        <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <span>Report History</span>
            </h2>
            {reportHistory.length > 0 && (
              <span className="text-xs font-semibold text-slate-500">
                {reportHistory.length} saved
              </span>
            )}
          </div>

          {reportHistory.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic py-2">
              Your previous reports will appear here.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {reportHistory.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => handleViewHistoricalReport(rep)}
                  className="py-3.5 flex items-center justify-between gap-3 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 px-2 rounded-xl transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {rep.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {rep.fileName} • {formatDisplayDate(rep.uploadDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleViewHistoricalReport(rep)}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 transition-colors"
                    >
                      View Results
                    </button>
                    <Tooltip content="Delete report from history" position="top">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistoricalReport(rep.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                        aria-label="Delete report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =============================================================
          ORIGINAL REPORT PREVIEW MODAL (PORTALIZED)
      ============================================================= */}
      <PortalModal
        isOpen={Boolean(isOriginalModalOpen && activeReport)}
        onClose={() => setIsOriginalModalOpen(false)}
        ariaLabelledBy="original-report-modal-title"
      >
        {activeReport && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 id="original-report-modal-title" className="font-black text-lg text-slate-900 dark:text-white">
                  Original Report Document
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeReport.fileName} ({activeReport.fileSizeFormatted || 'Document'}) • {formatDisplayDate(activeReport.uploadDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOriginalModalOpen(false)}
                aria-label="Close original report preview"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Document display: Image / PDF / Raw Text / Structured Lab Report Preview */}
            {activeReport.fileDataUrl ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-950 p-2 text-center">
                {activeReport.fileDataUrl.startsWith('data:image') ? (
                  <img
                    src={activeReport.fileDataUrl}
                    alt={`Original uploaded medical report: ${activeReport.fileName}`}
                    className="max-h-96 mx-auto rounded-xl object-contain shadow-xs"
                  />
                ) : (
                  <iframe
                    src={activeReport.fileDataUrl}
                    title={activeReport.fileName}
                    className="w-full h-96 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                )}
              </div>
            ) : activeReport.fileTextContent ? (
              <pre className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-mono whitespace-pre-wrap max-h-80 overflow-y-auto text-slate-800 dark:text-slate-200">
                {activeReport.fileTextContent}
              </pre>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-5 space-y-4 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {activeReport.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Archived Clinical Record • {formatDisplayDate(activeReport.uploadDate)}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[11px] font-bold">
                    {activeReport.fileName}
                  </span>
                </div>

                {activeReport.metrics && activeReport.metrics.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                          <th className="py-2 pr-3">Biomarker</th>
                          <th className="py-2 pr-3">Observed</th>
                          <th className="py-2 pr-3">Reference Range</th>
                          <th className="py-2">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                        {activeReport.metrics.map((m, idx) => (
                          <tr key={idx} className="text-slate-800 dark:text-slate-200">
                            <td className="py-2 pr-3 font-bold">{m.name}</td>
                            <td className="py-2 pr-3 font-mono font-bold">
                              {m.value} {m.unit}
                            </td>
                            <td className="py-2 pr-3 text-slate-500 dark:text-slate-400">{m.referenceRange}</td>
                            <td className="py-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  m.status === 'normal'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : m.status === 'low'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeReport.summary}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Recorded Highlights
                  </div>
                  <ul className="list-disc pl-5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    {activeReport.keyFindings.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOriginalModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </PortalModal>
    </div>
  );
};
