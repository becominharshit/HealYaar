import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SectionHero } from '../components/ui/SectionHero';
import { PrescriptionsIllustration } from '../components/ContextualIllustrations';
import { Tooltip } from '../components/ui/Tooltip';
import { EmptyStateCard } from '../components/ui/EmptyStateCard';
import { PortalModal } from '../components/ui/PortalModal';
import { SyntheticPrescription, PrescriptionMedicine } from '../types';
import { prescriptionService } from '../services/prescriptionService';
import { authService } from '../services/authService';
import { aiClient } from '../services/aiClient';
import { indexPrescription, deleteChunksBySource } from '../services/rag/ragVaultService';
import { formatDisplayDate } from '../utils/healthFormatters';
import { registerBlobUrl, revokeRegisteredBlobUrl } from '../utils/mediaSessionCleanup';
import {
  validateVisionFileBeforeUpload,
  VisionUploadValidationError
} from '../utils/visionUploadHelpers';
import { VoiceService } from '../services/voiceService';
import {
  Pill,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  Info,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  MapPin,
  Clock,
  RefreshCw,
  X,
  Edit3,
  Camera,
  Eye,
  History,
  Sparkles,
  Volume2,
  ArrowRight
} from 'lucide-react';

interface VisionPrescriptionResponse {
  doctorName?: string;
  doctorQualification?: string;
  clinicName?: string;
  date?: string;
  diagnosisSummary?: string;
  generalAdvice?: string;
  medicines?: Array<{
    name?: string;
    genericName?: string;
    dosage?: string;
    frequency?: string;
    timing?: string;
    durationDays?: number;
    instructions?: string;
    confidence?: 'high' | 'medium' | 'low';
    uncertainField?: string;
  }>;
}

function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const PrescriptionsMedicinesView: React.FC = () => {
  const {
    showToast,
    addReminder,
    reminders,
    setTab,
    currentUser,
    isDemoMode,
    language
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rx' | 'my_medicines'>('rx');

  // Prescription state — always starts clean with ONLY the authenticated user's own data
  const [selectedRx, setSelectedRx] = useState<SyntheticPrescription | null>(null);
  const [editableMedicines, setEditableMedicines] = useState<PrescriptionMedicine[]>([]);
  const [uploadedImageBlobUrl, setUploadedImageBlobUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showOriginalModal, setShowOriginalModal] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [poweredByModel, setPoweredByModel] = useState<string | null>(null);
  const [extractionWarning, setExtractionWarning] = useState<string | null>(null);
  const [prescriptionHistory, setPrescriptionHistory] = useState<SyntheticPrescription[]>([]);
  const [rxUploadConsent, setRxUploadConsent] = useState<boolean>(false);
  const [rxConsentError, setRxConsentError] = useState<string | null>(null);
  const [rxUploadError, setRxUploadError] = useState<string | null>(null);
  const [medicineSearch, setMedicineSearch] = useState<string>('');

  // Inline manual add/edit medicine state
  const [isAddingMedicine, setIsAddingMedicine] = useState<boolean>(false);
  const [newMedName, setNewMedName] = useState<string>('');
  const [newMedGeneric, setNewMedGeneric] = useState<string>('');
  const [newMedDosage, setNewMedDosage] = useState<string>('');
  const [newMedFrequency, setNewMedFrequency] = useState<string>('1-0-1 (Twice Daily)');
  const [newMedTiming, setNewMedTiming] = useState<string>('After meals');
  const [newMedDuration, setNewMedDuration] = useState<string>('5');
  const [newMedInstructions, setNewMedInstructions] = useState<string>('');

  // Reminder creation modal state
  const [showReminderConfirmModal, setShowReminderConfirmModal] = useState<boolean>(false);
  const [reminderTargetMeds, setReminderTargetMeds] = useState<PrescriptionMedicine[]>([]);
  const [reminderTimes, setReminderTimes] = useState<Record<string, string>>({
    morning: '08:00',
    afternoon: '13:00',
    evening: '20:00',
    bedtime: '21:30'
  });
  const [remindersCreatedSuccess, setRemindersCreatedSuccess] = useState<boolean>(false);

  // Restore ONLY this user's saved prescriptions
  useEffect(() => {
    let isMounted = true;
    if (currentUser?.id) {
      try {
        setRxUploadConsent(
          localStorage.getItem(`healyaar_user_${currentUser.id}_upload_consent_rx`) === 'true'
        );
      } catch {
        setRxUploadConsent(false);
      }
      prescriptionService.getPrescriptions(currentUser.id).then((savedList) => {
        if (isMounted && savedList) {
          setPrescriptionHistory(savedList);
          if (savedList.length > 0) {
            const latest = savedList[0];
            setSelectedRx((prev) => prev || latest);
            setEditableMedicines((prev) => (prev.length > 0 ? prev : latest.medicines || []));
          }
        }
      });
    } else {
      setSelectedRx(null);
      setEditableMedicines([]);
      setUploadedImageBlobUrl(null);
      setPrescriptionHistory([]);
      setRxUploadConsent(false);
      setPoweredByModel(null);
      setExtractionWarning(null);
    }
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Complete teardown on session reset / sign-out
  useEffect(() => {
    const handleReset = () => {
      if (uploadedImageBlobUrl) {
        revokeRegisteredBlobUrl(uploadedImageBlobUrl);
      }
      setUploadedImageBlobUrl(null);
      setUploadedFileName(null);
      setSelectedRx(null);
      setEditableMedicines([]);
      setPrescriptionHistory([]);
      setShowOriginalModal(false);
      setShowReminderConfirmModal(false);
      setPoweredByModel(null);
      setExtractionWarning(null);
    };
    window.addEventListener('healyaar_session_reset', handleReset);
    return () => window.removeEventListener('healyaar_session_reset', handleReset);
  }, [uploadedImageBlobUrl]);

  // Sync active prescription for Voice Assistant readouts
  useEffect(() => {
    if (selectedRx && editableMedicines.length > 0) {
      try {
        sessionStorage.setItem(
          'healyaar_active_prescription',
          JSON.stringify({
            doctorName: selectedRx.doctorName,
            medicines: editableMedicines
          })
        );
      } catch {
        // ignore
      }
    } else {
      try {
        sessionStorage.removeItem('healyaar_active_prescription');
      } catch {
        // ignore
      }
    }
  }, [selectedRx, editableMedicines]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (uploadedImageBlobUrl) {
        revokeRegisteredBlobUrl(uploadedImageBlobUrl);
      }
    };
  }, [uploadedImageBlobUrl]);

  // Aggregate strictly user's own prescribed medicines across all saved prescriptions
  const myPrescribedMedicines = useMemo(() => {
    const entries: Array<{
      medicine: PrescriptionMedicine;
      prescriptionId: string;
      doctorName: string;
      clinicName: string;
      date: string;
    }> = [];

    prescriptionHistory.forEach((rx) => {
      (rx.medicines || []).forEach((med) => {
        entries.push({
          medicine: med,
          prescriptionId: rx.id,
          doctorName: rx.doctorName || 'Prescribing Clinician',
          clinicName: rx.clinicName || '',
          date: rx.date || ''
        });
      });
    });

    const q = medicineSearch.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (item) =>
        item.medicine.name.toLowerCase().includes(q) ||
        (item.medicine.genericName || '').toLowerCase().includes(q) ||
        item.doctorName.toLowerCase().includes(q) ||
        (item.medicine.instructions || '').toLowerCase().includes(q)
    );
  }, [prescriptionHistory, medicineSearch]);

  const handleToggleConsent = (checked: boolean) => {
    setRxUploadConsent(checked);
    setRxConsentError(null);
    if (currentUser?.id) {
      try {
        localStorage.setItem(
          `healyaar_user_${currentUser.id}_upload_consent_rx`,
          checked ? 'true' : 'false'
        );
      } catch {
        // ignore
      }
      if (checked) {
        void authService.recordConsent(currentUser.id, '2.0');
      }
    }
  };

  /**
   * Real Prescription Upload & Multimodal Vision Extraction via /api/ai (Gemini 4 Hydrogen)
   */
  const handlePrescriptionFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (isDemoMode) {
      showToast('Demo Mode is read-only. Sign in to upload and save your own prescriptions.');
      return;
    }

    if (!rxUploadConsent) {
      setRxConsentError(
        'Please confirm consent above before uploading your personal prescription slip.'
      );
      return;
    }
    setRxConsentError(null);

    const sizeCheck = validateVisionFileBeforeUpload(file);
    if (!sizeCheck.valid) {
      setRxUploadError(sizeCheck.error);
      setExtractionWarning(null);
      return;
    }
    setRxUploadError(null);
    setExtractionWarning(null);
    setPoweredByModel(null);

    if (uploadedImageBlobUrl) {
      revokeRegisteredBlobUrl(uploadedImageBlobUrl);
    }
    const blobUrl = registerBlobUrl(URL.createObjectURL(file));
    setUploadedImageBlobUrl(blobUrl);
    setUploadedFileName(file.name);
    setIsAnalyzing(true);
    setRemindersCreatedSuccess(false);

    try {
      const response = await aiClient.analyzeVision<VisionPrescriptionResponse>({
        visionType: 'prescription',
        file
      });

      const parsed = response.data || {};
      const extractedMeds: PrescriptionMedicine[] = Array.isArray(parsed.medicines)
        ? parsed.medicines
            .filter((m) => m && typeof m.name === 'string' && m.name.trim().length > 0)
            .map((m, idx) => ({
              id: `med-${Date.now()}-${idx}`,
              name: m.name!.trim(),
              genericName: (m.genericName || '').trim(),
              dosage: (m.dosage || 'As directed').trim(),
              frequency: (m.frequency || 'As directed').trim(),
              timing: (m.timing || 'After meals').trim(),
              durationDays:
                typeof m.durationDays === 'number' && m.durationDays > 0 ? m.durationDays : 5,
              instructions: (m.instructions || 'Verify dose with your pharmacist or doctor.').trim(),
              confidence: m.confidence || 'medium',
              uncertainField: m.uncertainField || undefined
            }))
        : [];

      const newRx: SyntheticPrescription = {
        id: `rx-${Date.now()}`,
        doctorName: parsed.doctorName?.trim() || 'Doctor name not detected (click to verify)',
        doctorQualification: parsed.doctorQualification?.trim() || '',
        clinicName: parsed.clinicName?.trim() || file.name,
        patientName: currentUser?.name || 'You',
        date: parsed.date?.trim() || getLocalTodayIso(),
        diagnosisSummary:
          parsed.diagnosisSummary?.trim() ||
          'Uploaded prescription digitized. Please review every medicine name and dose against the original slip.',
        medicines: extractedMeds,
        generalAdvice:
          parsed.generalAdvice?.trim() ||
          'Always double-check handwriting, strengths, and durations with your prescribing doctor or licensed pharmacist.'
      };

      const savedRx = await prescriptionService.savePrescription(
        currentUser?.id || '',
        newRx,
        file
      );

      setSelectedRx(savedRx);
      setEditableMedicines(savedRx.medicines || []);
      setPoweredByModel(response.poweredBy || 'Gemini 4 Hydrogen');
      setPrescriptionHistory((prev) => [savedRx, ...prev.filter((r) => r.id !== savedRx.id)]);

      if (currentUser?.id) {
        indexPrescription(currentUser.id, {
          id: savedRx.id,
          doctorName: savedRx.doctorName,
          clinicName: savedRx.clinicName,
          date: savedRx.date,
          diagnosis: savedRx.diagnosisSummary,
          medications: savedRx.medicines.map((m) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            timing: m.timing,
            duration: m.durationDays ? `${m.durationDays} days` : 'As directed',
            instructions: m.instructions
          })),
          advice: savedRx.generalAdvice
        }).catch((err) => console.warn('RAG prescription indexing warning:', err));
      }

      if (extractedMeds.length === 0) {
        setExtractionWarning(
          'No clear medicine names could be automatically read from this image. You can inspect the original slip and add medicines manually below.'
        );
      }
      showToast('Prescription analyzed and saved to your private cabinet.');
    } catch (err) {
      if (err instanceof VisionUploadValidationError) {
        setRxUploadError(err.message);
        return;
      }
      const msg =
        err instanceof Error
          ? err.message
          : 'Live AI prescription reader is temporarily unreachable.';
      setExtractionWarning(
        `${msg} Your original slip is ready to view below—no medicines were fabricated. You can enter your prescribed medicines manually to save them and set pill reminders.`
      );

      const manualRx: SyntheticPrescription = {
        id: `rx-${Date.now()}`,
        doctorName: 'Uploaded Prescription Slip',
        doctorQualification: '',
        clinicName: file.name,
        patientName: currentUser?.name || 'You',
        date: getLocalTodayIso(),
        diagnosisSummary:
          'Live AI extraction unavailable. Add medicines manually below to store in your cabinet and enable pill reminders.',
        medicines: [],
        generalAdvice: 'Verify all dosages directly from your physical prescription.'
      };
      setSelectedRx(manualRx);
      setEditableMedicines([]);
      setIsAddingMedicine(true);
      showToast('Live AI unavailable — you can log medicines manually from your slip.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCameraTrigger = () => {
    if (!rxUploadConsent) {
      setRxConsentError('Please confirm consent above before capturing a prescription.');
      return;
    }
    const input = document.getElementById('rx-camera-input') as HTMLInputElement | null;
    input?.click();
  };

  const persistPrescriptionUpdates = async (updatedMeds: PrescriptionMedicine[]) => {
    if (!selectedRx) return;
    if (isDemoMode) {
      showToast('Demo Mode is read-only. Sign in to edit or save prescriptions.');
      return;
    }
    const updatedRx: SyntheticPrescription = {
      ...selectedRx,
      medicines: updatedMeds
    };
    setSelectedRx(updatedRx);
    setEditableMedicines(updatedMeds);

    if (currentUser?.id) {
      const saved = await prescriptionService.savePrescription(currentUser.id, updatedRx);
      setPrescriptionHistory((prev) => [saved, ...prev.filter((r) => r.id !== updatedRx.id && r.id !== saved.id)]);
      indexPrescription(currentUser.id, {
        id: saved.id,
        doctorName: saved.doctorName,
        clinicName: saved.clinicName,
        date: saved.date,
        diagnosis: saved.diagnosisSummary,
        medications: saved.medicines.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          timing: m.timing,
          duration: m.durationDays ? `${m.durationDays} days` : 'As directed',
          instructions: m.instructions
        })),
        advice: saved.generalAdvice
      }).catch(() => {});
    }
  };

  const handleAddManualMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) {
      showToast('Please enter the medicine name.');
      return;
    }

    const createdMed: PrescriptionMedicine = {
      id: `med-${Date.now()}`,
      name: newMedName.trim(),
      genericName: newMedGeneric.trim(),
      dosage: newMedDosage.trim() || 'As directed',
      frequency: newMedFrequency.trim() || 'Once daily',
      timing: newMedTiming.trim() || 'After meals',
      durationDays: Math.max(1, Number.parseInt(newMedDuration, 10) || 5),
      instructions: newMedInstructions.trim() || 'Take as directed by your doctor.',
      confidence: 'high'
    };

    const baseRx: SyntheticPrescription = selectedRx || {
      id: `rx-${Date.now()}`,
      doctorName: 'My Personal Prescription Entry',
      doctorQualification: '',
      clinicName: uploadedFileName || 'Personal Cabinet',
      patientName: currentUser?.name || 'You',
      date: getLocalTodayIso(),
      diagnosisSummary: 'User-entered prescription medicines.',
      medicines: [],
      generalAdvice: 'Confirm doses with your doctor or pharmacist.'
    };

    const updatedRx: SyntheticPrescription = {
      ...baseRx,
      medicines: [...editableMedicines, createdMed]
    };

    setSelectedRx(updatedRx);
    setEditableMedicines(updatedRx.medicines);
    setNewMedName('');
    setNewMedGeneric('');
    setNewMedDosage('');
    setNewMedInstructions('');
    setIsAddingMedicine(false);

    if (currentUser?.id) {
      const saved = await prescriptionService.savePrescription(currentUser.id, updatedRx);
      setSelectedRx(saved);
      setPrescriptionHistory((prev) => [saved, ...prev.filter((r) => r.id !== updatedRx.id && r.id !== saved.id)]);
      indexPrescription(currentUser.id, {
        id: saved.id,
        doctorName: saved.doctorName,
        clinicName: saved.clinicName,
        date: saved.date,
        diagnosis: saved.diagnosisSummary,
        medications: saved.medicines.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          timing: m.timing,
          duration: m.durationDays ? `${m.durationDays} days` : 'As directed',
          instructions: m.instructions
        })),
        advice: saved.generalAdvice
      }).catch(() => {});
    }

    showToast(`Added ${createdMed.name} to your prescription cabinet.`);
  };

  const handleRemoveMedicine = async (medId: string) => {
    const next = editableMedicines.filter((m) => m.id !== medId);
    await persistPrescriptionUpdates(next);
    showToast('Medicine removed from prescription.');
  };

  const handleDeletePrescription = async (rxId: string) => {
    if (!currentUser?.id) return;
    await prescriptionService.deletePrescription(currentUser.id, rxId);
    await deleteChunksBySource(currentUser.id, rxId).catch(() => {});
    const remaining = prescriptionHistory.filter((r) => r.id !== rxId);
    setPrescriptionHistory(remaining);
    if (selectedRx?.id === rxId) {
      const next = remaining[0] || null;
      setSelectedRx(next);
      setEditableMedicines(next?.medicines || []);
    }
    showToast('Prescription deleted from your cabinet and Health Vault.');
  };

  const handleOpenReminderModal = (meds: PrescriptionMedicine[]) => {
    if (meds.length === 0) {
      showToast('Add at least one medicine first to create pill reminders.');
      return;
    }
    setReminderTargetMeds(meds);
    setRemindersCreatedSuccess(false);
    setShowReminderConfirmModal(true);
  };

  const resolveTimesForFrequency = (freq: string, timing: string): string[] => {
    const lower = `${freq} ${timing}`.toLowerCase();
    const times: string[] = [];
    if (lower.includes('1-1-1') || lower.includes('thrice') || lower.includes('tds') || lower.includes('tid')) {
      return [reminderTimes.morning, reminderTimes.afternoon, reminderTimes.evening];
    }
    if (lower.includes('1-0-1') || lower.includes('twice') || lower.includes('bd') || lower.includes('bid')) {
      return [reminderTimes.morning, reminderTimes.evening];
    }
    if (lower.includes('bedtime') || lower.includes('night') || lower.includes('hs') || lower.includes('0-0-1')) {
      return [reminderTimes.bedtime];
    }
    if (lower.includes('afternoon') || lower.includes('0-1-0')) {
      return [reminderTimes.afternoon];
    }
    times.push(reminderTimes.morning);
    return times;
  };

  const handleConfirmCreateReminders = () => {
    let createdCount = 0;
    const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    reminderTargetMeds.forEach((med) => {
      const slots = resolveTimesForFrequency(med.frequency, med.timing);
      slots.forEach((timeSlot) => {
        const title = `${med.name}${med.dosage ? ` (${med.dosage})` : ''}`;
        const alreadyExists = reminders.some(
          (r) => r.title.toLowerCase() === title.toLowerCase() && r.time === timeSlot
        );
        if (!alreadyExists) {
          addReminder({
            title,
            type: 'medicine',
            time: timeSlot,
            repeatDays: allDays,
            instructions: `${med.timing} • ${med.frequency}. ${med.instructions}`,
            active: true
          });
          createdCount += 1;
        }
      });
    });

    setRemindersCreatedSuccess(true);
    if (createdCount > 0) {
      showToast(`Created ${createdCount} medication reminder${createdCount > 1 ? 's' : ''}.`);
    } else {
      showToast('Matching medication reminders already exist in your Reminders schedule.');
    }
  };

  const handleReadAloudRx = () => {
    if (!selectedRx || editableMedicines.length === 0) return;
    const lines = editableMedicines
      .map((m) => `${m.name}, ${m.dosage}, ${m.frequency}, ${m.timing}.`)
      .join(' ');
    VoiceService.speakText(`Prescription summary from ${selectedRx.doctorName}. ${lines}`, language);
  };

  const handleFindRealPharmacies = () => {
    try {
      sessionStorage.setItem('healyaar_doctors_filter', 'pharmacy');
    } catch {
      // ignore
    }
    setTab('doctors');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Header */}
      <SectionHero
        title="Prescriptions & My Medicines"
        badge={{
          icon: Pill,
          text: 'Private Cabinet',
          variant: 'teal'
        }}
        illustration={<PrescriptionsIllustration size="md" />}
        actions={
          <button
            type="button"
            onClick={handleFindRealPharmacies}
            className="interactive-button inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all whitespace-nowrap"
          >
            <MapPin className="w-4 h-4 text-teal-400" aria-hidden="true" />
            <span>Find Nearby Pharmacies</span>
          </button>
        }
      />

      {/* Two Clean Tabs: Upload Prescription | My Prescribed Medicines */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Prescription workspace tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'rx'}
            onClick={() => setActiveTab('rx')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'rx'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            <span>Upload &amp; Read Prescription</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'my_medicines'}
            onClick={() => setActiveTab('my_medicines')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'my_medicines'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Pill className="w-4 h-4" aria-hidden="true" />
            <span>My Prescribed Medicines ({myPrescribedMedicines.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setTab('reminders')}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-colors flex items-center gap-1.5"
        >
          <BellRing className="w-3.5 h-3.5" aria-hidden="true" />
          <span>View Pill Reminders</span>
        </button>
      </div>

      {/* TAB 1: UPLOAD & READ PRESCRIPTION */}
      {activeTab === 'rx' && (
        <div className="space-y-6">
          {/* Upload Card */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  Digitize Your Doctor&apos;s Prescription
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload a photo or PDF of your real prescription slip to extract medicine names, dosages, timings, and create pill reminders.
                </p>
              </div>
              {poweredByModel && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold self-start sm:self-auto">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Powered by {poweredByModel}</span>
                </span>
              )}
            </div>

            {/* Required Consent Checkbox */}
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                rxConsentError
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              }`}
            >
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rxUploadConsent}
                  onChange={(e) => handleToggleConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 flex-shrink-0"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  I consent to securely process this prescription through HealYaar&apos;s authenticated AI reader and store it inside my private Row-Level-Secured account. I understand I must verify all extracted doses against my original prescription.
                </span>
              </label>
              {rxConsentError && (
                <p role="alert" className="mt-2 text-rose-700 dark:text-rose-300 font-bold">
                  {rxConsentError}
                </p>
              )}
            </div>

            {/* Upload & Camera Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <label
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-colors cursor-pointer ${
                  isAnalyzing
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-600 cursor-wait'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Reading Prescription...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    <span>Upload Prescription (JPG / PNG / PDF)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  disabled={isAnalyzing}
                  onChange={handlePrescriptionFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                disabled={isAnalyzing}
                onClick={handleCameraTrigger}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm transition-colors disabled:opacity-60"
              >
                <Camera className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                <span>Take Photo</span>
              </button>
              <input
                id="rx-camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                disabled={isAnalyzing}
                onChange={handlePrescriptionFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => setIsAddingMedicine((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-colors"
              >
                <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                <span>Add Medicine Manually</span>
              </button>

              {uploadedImageBlobUrl && (
                <button
                  type="button"
                  onClick={() => setShowOriginalModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold text-xs sm:text-sm"
                >
                  <Eye className="w-4 h-4" aria-hidden="true" />
                  <span>View Uploaded Slip</span>
                </button>
              )}
            </div>

            {rxUploadError && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-semibold flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{rxUploadError}</span>
              </div>
            )}

            {extractionWarning && (
              <div
                role="status"
                className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{extractionWarning}</span>
              </div>
            )}

            {/* Manual Add Medicine Form */}
            {isAddingMedicine && (
              <form
                onSubmit={handleAddManualMedicine}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-teal-600" aria-hidden="true" />
                    <span>Add Medicine Entry</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingMedicine(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    aria-label="Close manual entry form"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      placeholder="e.g. Metformin 500mg"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Generic / Salt Name
                    </label>
                    <input
                      type="text"
                      value={newMedGeneric}
                      onChange={(e) => setNewMedGeneric(e.target.value)}
                      placeholder="e.g. Metformin Hydrochloride"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      placeholder="e.g. 1 Tablet (500 mg)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Frequency
                    </label>
                    <select
                      value={newMedFrequency}
                      onChange={(e) => setNewMedFrequency(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="1-0-0 (Once Daily - Morning)">1-0-0 (Once Daily - Morning)</option>
                      <option value="1-0-1 (Twice Daily)">1-0-1 (Twice Daily)</option>
                      <option value="1-1-1 (Thrice Daily)">1-1-1 (Thrice Daily)</option>
                      <option value="0-0-1 (At Bedtime)">0-0-1 (At Bedtime)</option>
                      <option value="SOS (As Needed)">SOS (As Needed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Meal Timing
                    </label>
                    <select
                      value={newMedTiming}
                      onChange={(e) => setNewMedTiming(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="After meals">After meals</option>
                      <option value="Before meals">Before meals</option>
                      <option value="With food">With food</option>
                      <option value="At bedtime">At bedtime</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={newMedDuration}
                      onChange={(e) => setNewMedDuration(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Special Instructions
                  </label>
                  <input
                    type="text"
                    value={newMedInstructions}
                    onChange={(e) => setNewMedInstructions(e.target.value)}
                    placeholder="e.g. Take with a full glass of water"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingMedicine(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
                  >
                    Save Medicine
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Active Prescription Details OR Empty State */}
          {!selectedRx ? (
            <EmptyStateCard
              icon={<FileText className="w-6 h-6" aria-hidden="true" />}
              title="No prescriptions uploaded yet"
              description="Upload a photo or PDF of your doctor's prescription above—or add your prescribed medicines manually—to digitize schedules and create one-click pill reminders."
              actionText="Add Medicine Manually"
              onAction={() => setIsAddingMedicine(true)}
            />
          ) : (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold">
                      Saved Prescription
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDisplayDate(selectedRx.date)}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {selectedRx.doctorName}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {[selectedRx.doctorQualification, selectedRx.clinicName].filter(Boolean).join(' • ')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {editableMedicines.length > 0 && (
                    <>
                      <Tooltip content="Read medicines aloud" position="top">
                        <button
                          type="button"
                          onClick={handleReadAloudRx}
                          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                          <span>Read Aloud</span>
                        </button>
                      </Tooltip>
                      <button
                        type="button"
                        onClick={() => handleOpenReminderModal(editableMedicines)}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <BellRing className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Create Pill Reminders</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeletePrescription(selectedRx.id)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    aria-label="Delete prescription"
                    title="Delete prescription"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {selectedRx.diagnosisSummary && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Summary: </strong>
                  {selectedRx.diagnosisSummary}
                </div>
              )}

              {/* Medicines List */}
              {editableMedicines.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No medicines listed on this prescription yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddingMedicine(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editableMedicines.map((med) => (
                    <div
                      key={med.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {med.name}
                            </h4>
                            {med.genericName && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {med.genericName}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(med.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                            aria-label={`Remove ${med.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                            {med.dosage}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
                            {med.frequency}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {med.timing}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {med.durationDays} days
                          </span>
                        </div>

                        {med.instructions && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {med.instructions}
                          </p>
                        )}

                        {med.uncertainField && (
                          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                            <span>Verify with pharmacist: {med.uncertainField}</span>
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenReminderModal([med])}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-xs font-bold transition-colors"
                        >
                          <BellRing className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Create Pill Reminder</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedRx.generalAdvice && (
                <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/60 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{selectedRx.generalAdvice}</span>
                </div>
              )}
            </section>
          )}

          {/* Prescription History Selector */}
          {prescriptionHistory.length > 1 && (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" aria-hidden="true" />
                <span>Your Saved Prescriptions ({prescriptionHistory.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {prescriptionHistory.map((rx) => {
                  const isActive = selectedRx?.id === rx.id;
                  return (
                    <button
                      key={rx.id}
                      type="button"
                      onClick={() => {
                        setSelectedRx(rx);
                        setEditableMedicines(rx.medicines || []);
                      }}
                      className={`text-left p-3.5 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {rx.doctorName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatDisplayDate(rx.date)} • {rx.medicines?.length || 0} medicines
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* TAB 2: MY PRESCRIBED MEDICINES (Strictly from user's own uploaded prescriptions) */}
      {activeTab === 'my_medicines' && (
        <section className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  My Prescribed Medicines
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every medicine listed here comes strictly from your own uploaded or manually saved prescriptions.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFindRealPharmacies}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold self-start sm:self-auto"
              >
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Locate Real Pharmacies on Map</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                placeholder="Search your prescribed medicines by name, generic salt, or doctor..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {myPrescribedMedicines.length === 0 ? (
            <EmptyStateCard
              icon={<Pill className="w-6 h-6" aria-hidden="true" />}
              title={
                medicineSearch.trim()
                  ? 'No matching medicines in your prescriptions'
                  : 'No prescribed medicines recorded yet'
              }
              description={
                medicineSearch.trim()
                  ? 'Try clearing your search query to see all medicines from your saved prescriptions.'
                  : 'Upload your doctor’s prescription or add a medicine manually to build your personal, verified medicine cabinet.'
              }
              actionText={medicineSearch.trim() ? 'Clear Search' : 'Upload a Prescription'}
              onAction={() => {
                if (medicineSearch.trim()) {
                  setMedicineSearch('');
                } else {
                  setActiveTab('rx');
                }
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPrescribedMedicines.map((entry) => (
                <div
                  key={`${entry.prescriptionId}-${entry.medicine.id}`}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {entry.medicine.name}
                        </h3>
                        {entry.medicine.genericName && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {entry.medicine.genericName}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDisplayDate(entry.date)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {entry.medicine.dosage}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
                        {entry.medicine.frequency}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {entry.medicine.timing}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Prescribed by <strong className="text-slate-800 dark:text-slate-200">{entry.doctorName}</strong>
                      {entry.clinicName ? ` • ${entry.clinicName}` : ''}
                    </p>
                    {entry.medicine.instructions && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {entry.medicine.instructions}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{entry.medicine.durationDays} days course</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenReminderModal([entry.medicine])}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <BellRing className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Create Pill Reminder</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Safety Disclaimer */}
      <footer className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          HealYaar organizes your personal prescriptions and medication schedules for convenience. It does not dispense medicines or replace verification by a licensed doctor or pharmacist.
        </p>
      </footer>

      {/* Modal: Original Uploaded Prescription Viewer */}
      <PortalModal
        isOpen={showOriginalModal && Boolean(uploadedImageBlobUrl)}
        onClose={() => setShowOriginalModal(false)}
        ariaLabel="Uploaded prescription slip"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Original Uploaded Slip {uploadedFileName ? `(${uploadedFileName})` : ''}
            </h3>
            <button
              type="button"
              onClick={() => setShowOriginalModal(false)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-auto rounded-2xl bg-slate-100 dark:bg-slate-950 p-2 flex items-center justify-center">
            {uploadedImageBlobUrl && (
              <img
                src={uploadedImageBlobUrl}
                alt="Uploaded prescription document"
                className="max-h-[68vh] w-auto rounded-xl object-contain"
              />
            )}
          </div>
        </div>
      </PortalModal>

      {/* Modal: Create Medication Reminders */}
      <PortalModal
        isOpen={showReminderConfirmModal}
        onClose={() => setShowReminderConfirmModal(false)}
        ariaLabelledBy="rx-reminder-modal-title"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                id="rx-reminder-modal-title"
                className="text-lg font-extrabold text-slate-900 dark:text-white"
              >
                Create Pill Reminders
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize daily reminder times for {reminderTargetMeds.length} medicine
                {reminderTargetMeds.length > 1 ? 's' : ''}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowReminderConfirmModal(false)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              aria-label="Close reminder dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(['morning', 'afternoon', 'evening', 'bedtime'] as const).map((slot) => (
              <div key={slot}>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  {slot}
                </label>
                <input
                  type="time"
                  value={reminderTimes[slot]}
                  onChange={(e) =>
                    setReminderTimes((prev) => ({ ...prev, [slot]: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>
            ))}
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700">
            {reminderTargetMeds.map((med) => (
              <div key={med.id} className="text-xs flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {med.name}
                </span>
                <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {resolveTimesForFrequency(med.frequency, med.timing).join(', ')}
                </span>
              </div>
            ))}
          </div>

          {remindersCreatedSuccess ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Saved to your Reminders schedule!</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowReminderConfirmModal(false);
                  setTab('reminders');
                }}
                className="underline"
              >
                Open Reminders
              </button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReminderConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateReminders}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
              >
                Save Reminders
              </button>
            </div>
          )}
        </div>
      </PortalModal>
    </div>
  );
};
