import * as XLSX from 'xlsx';
import { RepRecord, PostureIssue, IntensityLevel } from '../types/exercise';
import { SessionMetrics } from '../types/session';
import { CalculatedAngles } from '../cv/angleCalculator';

export interface DatasetRepRow {
  Timestamp: string;
  Epoch_ms: number;
  Session_ID: string;
  Exercise: string;
  Exercise_ID: string;
  Intensity: string;
  Rep_Number: number;
  Form_Result: 'CORRECT' | 'INCORRECT';
  Is_Valid_Rep: boolean;
  Peak_Flexion_Angle: number;
  Torso_Lean_Angle: number;
  Duration_Sec: number;
  Issues_Count: number;
  Detected_Issues: string;
  Issue_Categories: string;
}

export interface DatasetSessionRow {
  Timestamp: string;
  Session_ID: string;
  Exercise: string;
  Intensity: string;
  Target_Reps: number;
  Total_Attempts: number;
  Completed_Reps: number;
  Correct_Reps: number;
  Incorrect_Reps: number;
  Incomplete_Reps: number;
  Accuracy_Pct: number;
  Movement_Quality_Score: number;
  Duration_Sec: number;
  Most_Frequent_Issue: string;
}

export interface DatasetTelemetryRow {
  Timestamp: string;
  Epoch_ms: number;
  Session_ID: string;
  Exercise: string;
  Movement_State: string;
  Knee_Angle_Deg: number;
  Hip_Angle_Deg: number;
  Torso_Angle_Deg: number;
  Left_Elbow_Deg: number;
  Right_Elbow_Deg: number;
  Pose_Confidence: number;
}

const STORAGE_KEY_REPS = 'kinetiq_dataset_reps_v1';
const STORAGE_KEY_SESSIONS = 'kinetiq_dataset_sessions_v1';
const MAX_TELEMETRY_ROWS = 3000;

export class DatasetService {
  private static instance: DatasetService;
  private currentSessionId: string = DatasetService.generateId();
  private telemetryBuffer: DatasetTelemetryRow[] = [];
  private lastTelemetrySampleMs: number = 0;

  private constructor() {
    this.setupGlobalHooks();
  }

  public static getInstance(): DatasetService {
    if (!DatasetService.instance) {
      DatasetService.instance = new DatasetService();
    }
    return DatasetService.instance;
  }

  private static generateId(): string {
    return 'ses_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  public startNewSession(): string {
    this.currentSessionId = DatasetService.generateId();
    return this.currentSessionId;
  }

  public getCurrentSessionId(): string {
    return this.currentSessionId;
  }

  /**
   * Silently records a completed repetition into the dataset
   */
  public recordRep(
    exerciseId: string,
    exerciseName: string,
    intensity: IntensityLevel,
    repRecord: RepRecord
  ): void {
    try {
      const now = new Date(repRecord.timestamp);
      const row: DatasetRepRow = {
        Timestamp: now.toISOString().replace('T', ' ').slice(0, 19),
        Epoch_ms: repRecord.timestamp,
        Session_ID: this.currentSessionId,
        Exercise: exerciseName,
        Exercise_ID: exerciseId,
        Intensity: intensity,
        Rep_Number: repRecord.repNumber,
        Form_Result: repRecord.isCorrect ? 'CORRECT' : 'INCORRECT',
        Is_Valid_Rep: repRecord.isCorrect,
        Peak_Flexion_Angle: Math.round(repRecord.maxKneeDepthAngle * 10) / 10,
        Torso_Lean_Angle: Math.round(repRecord.minTorsoAngle * 10) / 10,
        Duration_Sec: Math.round((repRecord.durationMs / 1000) * 10) / 10,
        Issues_Count: repRecord.issues?.length || 0,
        Detected_Issues: (repRecord.issues || []).map((i: PostureIssue) => i.message).join('; ') || 'None',
        Issue_Categories: (repRecord.issues || []).map((i: PostureIssue) => i.category).join('; ') || 'NONE',
      };

      const existing = this.getStoredReps();
      existing.push(row);
      localStorage.setItem(STORAGE_KEY_REPS, JSON.stringify(existing));
      this.autoSaveToFile();
    } catch (err) {
      console.warn('[DatasetService] Failed to record rep silently:', err);
    }
  }

  /**
   * Silently records a completed session summary into the dataset
   */
  public recordSession(summary: SessionMetrics, intensity: IntensityLevel): void {
    try {
      const now = new Date();
      const row: DatasetSessionRow = {
        Timestamp: now.toISOString().replace('T', ' ').slice(0, 19),
        Session_ID: this.currentSessionId,
        Exercise: summary.exerciseName,
        Intensity: intensity,
        Target_Reps: summary.targetReps,
        Total_Attempts: summary.totalAttempts,
        Completed_Reps: summary.completedReps,
        Correct_Reps: summary.correctReps,
        Incorrect_Reps: summary.incorrectReps,
        Incomplete_Reps: summary.incompleteReps,
        Accuracy_Pct: summary.accuracy,
        Movement_Quality_Score: summary.movementQualityScore,
        Duration_Sec: summary.durationSeconds,
        Most_Frequent_Issue: summary.mostFrequentIssue || 'None',
      };

      const existing = this.getStoredSessions();
      existing.push(row);
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(existing));
      this.autoSaveToFile();
    } catch (err) {
      console.warn('[DatasetService] Failed to record session silently:', err);
    }
  }

  /**
   * Periodically sample kinematic telemetry during movement (throttled to ~250ms)
   */
  public sampleTelemetry(
    exerciseId: string,
    movementState: string,
    angles: CalculatedAngles | null,
    confidence: number
  ): void {
    const now = Date.now();
    if (now - this.lastTelemetrySampleMs < 250) return;
    this.lastTelemetrySampleMs = now;

    if (!angles) return;

    try {
      const row: DatasetTelemetryRow = {
        Timestamp: new Date(now).toISOString().replace('T', ' ').slice(0, 19),
        Epoch_ms: now,
        Session_ID: this.currentSessionId,
        Exercise: exerciseId,
        Movement_State: movementState,
        Knee_Angle_Deg: Math.round(angles.kneeAngle.angleDegrees * 10) / 10,
        Hip_Angle_Deg: Math.round(angles.hipAngle.angleDegrees * 10) / 10,
        Torso_Angle_Deg: Math.round(angles.torsoAngle.angleDegrees * 10) / 10,
        Left_Elbow_Deg: Math.round(angles.leftElbowAngle * 10) / 10,
        Right_Elbow_Deg: Math.round(angles.rightElbowAngle * 10) / 10,
        Pose_Confidence: Math.round(confidence * 100) / 100,
      };

      this.telemetryBuffer.push(row);
      if (this.telemetryBuffer.length > MAX_TELEMETRY_ROWS) {
        this.telemetryBuffer.shift();
      }
    } catch (err) {
      // silent
    }
  }

  public getStoredReps(): DatasetRepRow[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REPS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getStoredSessions(): DatasetSessionRow[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getTelemetryCount(): number {
    return this.telemetryBuffer.length;
  }

  public clearDataset(): void {
    localStorage.removeItem(STORAGE_KEY_REPS);
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
    this.telemetryBuffer = [];
  }

  /**
   * Exports the accumulated data to a multi-sheet Excel (.xlsx) file
   */
  public exportToExcel(): void {
    const reps = this.getStoredReps();
    const sessions = this.getStoredSessions();
    const telemetry = this.telemetryBuffer;

    if (reps.length === 0 && sessions.length === 0 && telemetry.length === 0) {
      alert('Dataset is currently empty. Complete at least one exercise rep to record data.');
      return;
    }

    const workbook = XLSX.utils.book_new();

    // 1. Reps Sheet
    const wsReps = reps.length > 0
      ? XLSX.utils.json_to_sheet(reps)
      : XLSX.utils.aoa_to_sheet([['No reps recorded yet']]);
    XLSX.utils.book_append_sheet(workbook, wsReps, 'Repetitions');

    // 2. Sessions Sheet
    const wsSessions = sessions.length > 0
      ? XLSX.utils.json_to_sheet(sessions)
      : XLSX.utils.aoa_to_sheet([['No sessions recorded yet']]);
    XLSX.utils.book_append_sheet(workbook, wsSessions, 'Sessions');

    // 3. Kinematic Telemetry Sheet
    const wsTelemetry = telemetry.length > 0
      ? XLSX.utils.json_to_sheet(telemetry)
      : XLSX.utils.aoa_to_sheet([['No telemetry sampled yet']]);
    XLSX.utils.book_append_sheet(workbook, wsTelemetry, 'Kinematics_Telemetry');

    // Generate filename with timestamp
    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
    const filename = `KinetiQ_Dataset_${dateStr}_${timeStr}.xlsx`;

    XLSX.writeFile(workbook, filename);
    this.autoSaveToFile(filename);
  }

  /**
   * Silently writes the current Excel workbook directly into the project's datasets/ folder on disk
   */
  public async autoSaveToFile(customFilename?: string): Promise<void> {
    try {
      const reps = this.getStoredReps();
      const sessions = this.getStoredSessions();
      const telemetry = this.telemetryBuffer;

      const workbook = XLSX.utils.book_new();
      const wsReps = reps.length > 0
        ? XLSX.utils.json_to_sheet(reps)
        : XLSX.utils.aoa_to_sheet([['No reps recorded yet']]);
      XLSX.utils.book_append_sheet(workbook, wsReps, 'Repetitions');

      const wsSessions = sessions.length > 0
        ? XLSX.utils.json_to_sheet(sessions)
        : XLSX.utils.aoa_to_sheet([['No sessions recorded yet']]);
      XLSX.utils.book_append_sheet(workbook, wsSessions, 'Sessions');

      const wsTelemetry = telemetry.length > 0
        ? XLSX.utils.json_to_sheet(telemetry)
        : XLSX.utils.aoa_to_sheet([['No telemetry sampled yet']]);
      XLSX.utils.book_append_sheet(workbook, wsTelemetry, 'Kinematics_Telemetry');

      const base64Data = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

      await fetch('/api/save-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: customFilename || 'KinetiQ_Dataset_Latest.xlsx',
          base64Data,
        }),
      });
    } catch {
      // silent background save
    }
  }

  /**
   * Exports reps as CSV
   */
  public exportRepsToCsv(): void {
    const reps = this.getStoredReps();
    if (reps.length === 0) {
      alert('No repetitions recorded yet.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(reps);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KinetiQ_Reps_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Hidden developer hooks and keyboard shortcut listener
   */
  private setupGlobalHooks(): void {
    if (typeof window === 'undefined') return;

    // Attach developer console functions
    (window as any).__kinetiqDataset = {
      exportExcel: () => this.exportToExcel(),
      exportCsv: () => this.exportRepsToCsv(),
      getReps: () => this.getStoredReps(),
      getSessions: () => this.getStoredSessions(),
      clear: () => this.clearDataset(),
    };
    (window as any).__exportDataset = () => this.exportToExcel();

    // Hidden Keyboard Shortcut: Ctrl + Shift + E or Ctrl + Shift + D
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e' || e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        this.exportToExcel();
      }
    });
  }
}
