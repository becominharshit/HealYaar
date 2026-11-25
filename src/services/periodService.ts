import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PeriodCycleEntry } from '../types';

export const periodService = {
  /**
   * Fetches user's saved period cycles from Supabase
   */
  async getCycles(userId: string): Promise<PeriodCycleEntry[]> {
    if (!userId) {
      return [];
    }

    if (!isSupabaseConfigured()) {
      return this.getLocalCycles(userId);
    }

    try {
      const { data, error } = await supabase
        .from('period_cycles')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) {
        console.warn('Error fetching period cycles from Supabase:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        startDate: row.start_date,
        endDate: row.end_date || undefined,
        cycleLengthDays: row.cycle_length_days,
        periodDurationDays: row.period_duration_days,
        symptoms: row.symptoms || [],
        flowIntensity: row.flow_intensity || undefined,
        notes: row.notes || undefined
      }));
    } catch (err) {
      console.warn('periodService.getCycles exception:', err);
      return this.getLocalCycles(userId);
    }
  },

  /**
   * Saves a new period cycle entry
   */
  async saveCycle(userId: string, entry: Omit<PeriodCycleEntry, 'id'>): Promise<PeriodCycleEntry | null> {
    const localEntry: PeriodCycleEntry = {
      id: 'log-' + Date.now(),
      ...entry
    };

    if (!isSupabaseConfigured() || !userId) {
      if (userId) this.saveLocalCycle(userId, localEntry);
      return localEntry;
    }

    try {
      const { data, error } = await supabase
        .from('period_cycles')
        .insert({
          user_id: userId,
          start_date: entry.startDate,
          end_date: entry.endDate || null,
          cycle_length_days: entry.cycleLengthDays,
          period_duration_days: entry.periodDurationDays,
          symptoms: entry.symptoms || [],
          flow_intensity: entry.flowIntensity || null,
          notes: entry.notes || null
        })
        .select()
        .single();

      if (error) {
        console.warn('Error saving period cycle to Supabase:', error);
        if (userId) this.saveLocalCycle(userId, localEntry);
        return localEntry;
      }

      return {
        id: data.id,
        startDate: data.start_date,
        endDate: data.end_date || undefined,
        cycleLengthDays: data.cycle_length_days,
        periodDurationDays: data.period_duration_days,
        symptoms: data.symptoms || [],
        flowIntensity: data.flow_intensity || undefined,
        notes: data.notes || undefined
      };
    } catch (err) {
      console.warn('periodService.saveCycle exception:', err);
      if (userId) this.saveLocalCycle(userId, localEntry);
      return localEntry;
    }
  },

  /**
   * Updates an existing period cycle entry
   */
  async updateCycle(userId: string, entry: PeriodCycleEntry): Promise<PeriodCycleEntry> {
    if (!userId) return entry;
    this.saveLocalCycle(userId, entry);

    if (!isSupabaseConfigured()) {
      return entry;
    }

    try {
      const { data, error } = await supabase
        .from('period_cycles')
        .update({
          start_date: entry.startDate,
          end_date: entry.endDate || null,
          cycle_length_days: entry.cycleLengthDays,
          period_duration_days: entry.periodDurationDays,
          symptoms: entry.symptoms || [],
          flow_intensity: entry.flowIntensity || null,
          notes: entry.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !data) {
        return entry;
      }

      return {
        id: data.id,
        startDate: data.start_date,
        endDate: data.end_date || undefined,
        cycleLengthDays: data.cycle_length_days,
        periodDurationDays: data.period_duration_days,
        symptoms: data.symptoms || [],
        flowIntensity: data.flow_intensity || undefined,
        notes: data.notes || undefined
      };
    } catch (err) {
      console.warn('periodService.updateCycle exception:', err);
      return entry;
    }
  },

  /**
   * Deletes a single period cycle entry by ID
   */
  async deleteCycle(userId: string, cycleId: string): Promise<boolean> {
    if (!userId || !cycleId) return false;
    try {
      const existing = this.getLocalCycles(userId);
      const updated = existing.filter((e) => e.id !== cycleId);
      localStorage.setItem(`healyaar_user_${userId}_period_logs`, JSON.stringify(updated));
    } catch {}

    if (!isSupabaseConfigured()) return true;

    try {
      const { error } = await supabase
        .from('period_cycles')
        .delete()
        .eq('id', cycleId)
        .eq('user_id', userId);

      if (error) {
        console.warn('Error deleting single period cycle from Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('periodService.deleteCycle exception:', err);
      return false;
    }
  },

  /**
   * Deletes all period cycle logs for a user
   */
  async deleteCycles(userId: string): Promise<boolean> {
    if (!userId) return false;
    try {
      localStorage.removeItem(`healyaar_user_${userId}_period_logs`);
    } catch {}

    if (!isSupabaseConfigured()) return true;

    try {
      const { error } = await supabase
        .from('period_cycles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.warn('Error deleting period cycles from Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('periodService.deleteCycles exception:', err);
      return false;
    }
  },

  getLocalCycles(userId: string): PeriodCycleEntry[] {
    if (!userId) return [];
    try {
      const saved = localStorage.getItem(`healyaar_user_${userId}_period_logs`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  saveLocalCycle(userId: string, entry: PeriodCycleEntry): void {
    if (!userId) return;
    try {
      const existing = this.getLocalCycles(userId);
      const updated = [entry, ...existing.filter((e) => e.id !== entry.id)];
      localStorage.setItem(`healyaar_user_${userId}_period_logs`, JSON.stringify(updated));
    } catch {}
  }
};

// ============================================================================
// Consolidated Cycle Phase Calculation & Preferences Utilities
// (Merged from former cycleService.ts into single canonical periodService.ts)
// ============================================================================

export interface CyclePreferences {
  typicalCycleLength: number; // e.g. 28
  periodDuration: number; // e.g. 5
  lastPeriodStart: string; // YYYY-MM-DD
}

export type CyclePhaseType = 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal';

export interface CyclePhaseInfo {
  type: CyclePhaseType;
  title: string;
  badge: string;
  dayRangeStr: string;
  startDay: number;
  endDay: number;
  description: string;
  selfCareTip: string;
  hormoneSummary: string;
  energyLevel: string;
}

export interface CycleCalculationResult {
  currentCycleDay: number;
  totalCycleLength: number;
  periodDuration: number;
  lastPeriodStartDate: Date;
  nextPeriodStartDate: Date;
  nextPeriodEndDate: Date;
  nextPeriodWindowStr: string;
  daysUntilNextPeriod: number;
  ovulationStartDate: Date;
  ovulationEndDate: Date;
  ovulationWindowStr: string;
  daysUntilOvulation: number;
  isCurrentlyOnPeriod: boolean;
  currentPhase: CyclePhaseInfo;
  allPhases: CyclePhaseInfo[];
  cycleProgressPercent: number;
}

const CYCLE_PREFS_STORAGE_KEY = 'healyaar_cycle_preferences';

export const DEFAULT_CYCLE_PREFERENCES: CyclePreferences = {
  typicalCycleLength: 28,
  periodDuration: 5,
  lastPeriodStart: '2026-10-02'
};

export const MOTIVATIONAL_QUOTES = [
  "Your body has its own rhythm. You don't have to rush the beat.",
  "Main character energy, every phase.",
  "Hormones doing their thing. You? Still doing yours.",
  "Rest is productive. Especially when your body asks for it.",
  "Different phase, same powerhouse.",
  "Syncing with your cycle is the ultimate life hack.",
  "Soft days, strong days, high-focus days — all valid, all you.",
  "Listen to your body today. It's the smartest compass you own.",
  "Cramps don't define you. Cozy tea, deep breaths, and gentle pacing win.",
  "Honor your slowdown. It's where your next surge of energy is born."
];

export function getStoredCyclePreferences(userId?: string): CyclePreferences {
  const key = userId ? `healyaar_user_${userId}_cycle_preferences` : CYCLE_PREFS_STORAGE_KEY;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        typicalCycleLength: Number(parsed.typicalCycleLength) || 28,
        periodDuration: Number(parsed.periodDuration) || 5,
        lastPeriodStart: parsed.lastPeriodStart || '2026-10-02'
      };
    }
  } catch {
    // fallback
  }

  try {
    const logsKey = userId ? `healyaar_user_${userId}_period_logs` : 'healyaar_period_logs';
    const logsRaw = localStorage.getItem(logsKey);
    if (logsRaw) {
      const logs = JSON.parse(logsRaw);
      if (Array.isArray(logs) && logs.length > 0 && logs[0].startDate) {
        return {
          typicalCycleLength: Number(logs[0].cycleLengthDays) || 28,
          periodDuration: Number(logs[0].periodDurationDays) || 5,
          lastPeriodStart: logs[0].startDate
        };
      }
    }
  } catch {
    // fallback
  }

  return { ...DEFAULT_CYCLE_PREFERENCES };
}

export function saveCyclePreferences(prefs: Partial<CyclePreferences>, userId?: string): CyclePreferences {
  const current = getStoredCyclePreferences(userId);
  const updated: CyclePreferences = {
    typicalCycleLength: Math.max(21, Math.min(45, prefs.typicalCycleLength ?? current.typicalCycleLength)),
    periodDuration: Math.max(2, Math.min(10, prefs.periodDuration ?? current.periodDuration)),
    lastPeriodStart: prefs.lastPeriodStart || current.lastPeriodStart
  };

  const key = userId ? `healyaar_user_${userId}_cycle_preferences` : CYCLE_PREFS_STORAGE_KEY;
  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // ignore
  }

  return updated;
}

/**
 * Calculates current cycle day, 4 phases, next period window, and ovulation window.
 */
export function calculateCycleDetails(
  lastPeriodStartStr?: string,
  cycleLength: number = 28,
  duration: number = 5
): CycleCalculationResult {
  const prefs = getStoredCyclePreferences();
  const startStr = lastPeriodStartStr || prefs.lastPeriodStart || '2026-10-02';
  const cycleDays = Math.max(21, Math.min(45, cycleLength || prefs.typicalCycleLength || 28));
  const periodDays = Math.max(2, Math.min(10, duration || prefs.periodDuration || 5));

  const [y, m, d] = startStr.split('-').map(Number);
  const startDate = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - startDate.getTime();
  const rawDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let currentCycleDay = (rawDays >= 0 ? rawDays % cycleDays : 0) + 1;
  if (currentCycleDay > cycleDays) currentCycleDay = cycleDays;

  const completedCycles = Math.max(0, Math.floor(rawDays / cycleDays));
  const nextPeriodStart = new Date(startDate);
  nextPeriodStart.setDate(startDate.getDate() + (completedCycles + 1) * cycleDays);

  const nextPeriodEnd = new Date(nextPeriodStart);
  nextPeriodEnd.setDate(nextPeriodStart.getDate() + (periodDays - 1));

  const daysUntilNextPeriod = Math.max(
    0,
    Math.ceil((nextPeriodStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  const estimatedOvulationDay = Math.max(periodDays + 2, cycleDays - 14);
  const ovulationStart = new Date(startDate);
  ovulationStart.setDate(startDate.getDate() + completedCycles * cycleDays + (estimatedOvulationDay - 2));

  const ovulationEnd = new Date(ovulationStart);
  ovulationEnd.setDate(ovulationStart.getDate() + 3);

  const daysUntilOvulation = Math.ceil((ovulationStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const isCurrentlyOnPeriod = currentCycleDay <= periodDays;

  const menstrualEnd = periodDays;
  const follicularStart = menstrualEnd + 1;
  const follicularEnd = Math.max(follicularStart, estimatedOvulationDay - 3);
  const ovulationWindowStartDay = follicularEnd + 1;
  const ovulationWindowEndDay = Math.min(cycleDays - 2, estimatedOvulationDay + 2);
  const lutealStartDay = ovulationWindowEndDay + 1;
  const lutealEndDay = cycleDays;

  const allPhases: CyclePhaseInfo[] = [
    {
      type: 'Menstrual',
      title: 'Menstrual Phase',
      badge: '🌸 Inner Winter',
      dayRangeStr: `Days 1–${menstrualEnd}`,
      startDay: 1,
      endDay: menstrualEnd,
      description: 'Your uterine lining is shedding. Estrogen and progesterone are at baseline resting levels.',
      selfCareTip: 'Prioritize deep rest, cozy herbal teas (chamomile or ginger), hot water bottles, and gentle walks.',
      hormoneSummary: 'Low estrogen & progesterone',
      energyLevel: 'Reflective & Resting'
    },
    {
      type: 'Follicular',
      title: 'Follicular Phase',
      badge: '🌱 Inner Spring',
      dayRangeStr: `Days ${follicularStart}–${follicularEnd}`,
      startDay: follicularStart,
      endDay: follicularEnd,
      description: 'Follicle-stimulating hormone prompts ovaries to nurture an egg while estrogen steadily climbs.',
      selfCareTip: 'Energy and optimism climb! Excellent time for creative projects, social outings, and trying new workouts.',
      hormoneSummary: 'Estrogen rising, FSH active',
      energyLevel: 'Rising & Creative'
    },
    {
      type: 'Ovulation',
      title: 'Ovulation Window',
      badge: '☀️ Inner Summer',
      dayRangeStr: `Days ${ovulationWindowStartDay}–${ovulationWindowEndDay}`,
      startDay: ovulationWindowStartDay,
      endDay: ovulationWindowEndDay,
      description: 'A surge in luteinizing hormone triggers the release of an egg. Peak fertility window.',
      selfCareTip: 'Confidence, communication, and libido peak. Stay hydrated and track any mild mid-cycle twinges (mittelschmerz).',
      hormoneSummary: 'LH & Estrogen peak',
      energyLevel: 'Peak Stamina & Magnetic'
    },
    {
      type: 'Luteal',
      title: 'Luteal Phase',
      badge: '🍂 Inner Autumn',
      dayRangeStr: `Days ${lutealStartDay}–${lutealEndDay}`,
      startDay: lutealStartDay,
      endDay: lutealEndDay,
      description: 'Progesterone climbs to nurture the uterine lining, then drops if fertilization did not happen.',
      selfCareTip: 'Cravings and sensitivity can appear. Reach for magnesium-rich snacks (dark chocolate, almonds), yoga, and gentle boundaries.',
      hormoneSummary: 'Progesterone dominant, then drops',
      energyLevel: 'Winding Down & Nesting'
    }
  ];

  let currentPhase = allPhases[3];
  if (currentCycleDay <= menstrualEnd) {
    currentPhase = allPhases[0];
  } else if (currentCycleDay <= follicularEnd) {
    currentPhase = allPhases[1];
  } else if (currentCycleDay <= ovulationWindowEndDay) {
    currentPhase = allPhases[2];
  } else {
    currentPhase = allPhases[3];
  }

  const formatDateWindow = (start: Date, end: Date) => {
    const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startLabel} – ${endLabel}`;
  };

  const nextPeriodWindowStr = formatDateWindow(nextPeriodStart, nextPeriodEnd);
  const ovulationWindowStr = formatDateWindow(ovulationStart, ovulationEnd);
  const cycleProgressPercent = Math.min(100, Math.round((currentCycleDay / cycleDays) * 100));

  return {
    currentCycleDay,
    totalCycleLength: cycleDays,
    periodDuration: periodDays,
    lastPeriodStartDate: startDate,
    nextPeriodStartDate: nextPeriodStart,
    nextPeriodEndDate: nextPeriodEnd,
    nextPeriodWindowStr,
    daysUntilNextPeriod,
    ovulationStartDate: ovulationStart,
    ovulationEndDate: ovulationEnd,
    ovulationWindowStr,
    daysUntilOvulation,
    isCurrentlyOnPeriod,
    currentPhase,
    allPhases,
    cycleProgressPercent
  };
}

/**
 * Returns natural language responses for Voice Assistant cycle queries.
 */
export function getCycleVoiceResponse(type: 'NEXT_PERIOD' | 'PHASE' | 'OVULATION'): string {
  const details = calculateCycleDetails();

  if (type === 'NEXT_PERIOD') {
    if (details.isCurrentlyOnPeriod) {
      return `You are currently on Day ${details.currentCycleDay} of your period. Your next cycle is estimated to start around ${details.nextPeriodStartDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}, which is in approximately ${details.daysUntilNextPeriod} days. Remember, this is a statistical estimate.`;
    }
    return `Your next period is predicted between ${details.nextPeriodWindowStr}, in approximately ${details.daysUntilNextPeriod} days. Predictions are estimates for self-care and can naturally shift.`;
  }

  if (type === 'PHASE') {
    return `You are on Day ${details.currentCycleDay} of your ${details.totalCycleLength}-day cycle, in the ${details.currentPhase.title}. ${details.currentPhase.description} Tip: ${details.currentPhase.selfCareTip}`;
  }

  if (type === 'OVULATION') {
    return `Your estimated ovulation window is ${details.ovulationWindowStr}. Please note this is an estimate and not intended for contraception.`;
  }

  return 'Cycle calculations are available in the Period Tracker tab.';
}
