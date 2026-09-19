import * as XLSX from 'xlsx';
import { RepRecord, PostureIssue, IntensityLevel } from '../types/exercise';
import { SessionMetrics } from '../types/session';
import { CalculatedAngles } from '../cv/angleCalculator';

export interface DatasetRepRow {
  Rep_ID: string;
  Session_ID: string;
  Timestamp: string;
  Epoch_ms: number;
  Exercise_Name: string;
  Exercise_Type: string;
  Intensity_Mode: string;
  Rep_Number: number;
  Form_Result: 'PASS' | 'FAIL';
  Is_Valid: number; // 1 = Valid/Correct, 0 = Rejected/Fault
  Target_Threshold_Deg: number;
  Peak_Flexion_Deg: number;
  Starting_Angle_Deg: number;
  Ending_Angle_Deg: number;
  Range_Of_Motion_Deg: number;
  Threshold_Margin_Deg: number; // Positive = passed threshold; Negative = shallow/failed
  Left_Knee_Min_Deg: number;
  Right_Knee_Min_Deg: number;
  Knee_Asymmetry_Deg: number;
  Left_Hip_Min_Deg: number;
  Right_Hip_Min_Deg: number;
  Max_Torso_Lean_Deg: number;
  Left_Elbow_Min_Deg: number;
  Right_Elbow_Min_Deg: number;
  Elbow_Asymmetry_Deg: number;
  Total_Duration_Sec: number;
  Eccentric_Phase_Sec: number;
  Concentric_Phase_Sec: number;
  Isometric_Hold_Sec: number;
  Avg_Angular_Velocity_DegSec: number;
  Fault_Shallow_Depth: number; // 1 = Fault present, 0 = None
  Fault_Torso_Lean: number;
  Fault_Asymmetry: number;
  Issues_Count: number;
  Detected_Issues_List: string;
  Quality_Score_Pct: number;
}

export interface DatasetSessionRow {
  Session_ID: string;
  Date_Time: string;
  Exercise_Name: string;
  Exercise_Type: string;
  Intensity_Mode: string;
  Target_Reps: number;
  Total_Attempts: number;
  Completed_Reps: number;
  Correct_Reps: number;
  Incorrect_Reps: number;
  Incomplete_Reps: number;
  Accuracy_Pct: number;
  Movement_Quality_Score: number;
  Total_Duration_Sec: number;
  Avg_Rep_Duration_Sec: number;
  Avg_Peak_Depth_Deg: number;
  Avg_Torso_Lean_Deg: number;
  Avg_Asymmetry_Deg: number;
  Most_Frequent_Issue: string;
}

export interface DatasetTelemetryRow {
  Frame_Index: number;
  Timestamp: string;
  Time_Rel_Sec: number;
  Session_ID: string;
  Exercise: string;
  Movement_State: string;
  Progress_Pct: number;
  Left_Knee_Deg: number;
  Right_Knee_Deg: number;
  Mean_Knee_Deg: number;
  Left_Hip_Deg: number;
  Right_Hip_Deg: number;
  Torso_Lean_Deg: number;
  Left_Elbow_Deg: number;
  Right_Elbow_Deg: number;
  Pose_Confidence: number;
}

export interface DataDictionaryEntry {
  Sheet_Name: string;
  Variable_Name: string;
  Data_Type: string;
  Unit: string;
  Anatomical_Definition: string;
  Clinical_Interpretation: string;
}

const STORAGE_KEY_REPS = 'kinetiq_dataset_reps_v2';
const STORAGE_KEY_SESSIONS = 'kinetiq_dataset_sessions_v2';
const MAX_TELEMETRY_ROWS = 5000;

export class DatasetService {
  private static instance: DatasetService;
  private currentSessionId: string = DatasetService.generateId();
  private sessionStartEpoch: number = Date.now();
  private telemetryBuffer: DatasetTelemetryRow[] = [];
  private lastTelemetrySampleMs: number = 0;
  private frameCounter: number = 0;

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
    this.sessionStartEpoch = Date.now();
    this.frameCounter = 0;
    return this.currentSessionId;
  }

  public getCurrentSessionId(): string {
    return this.currentSessionId;
  }

  /**
   * Silently records a completed repetition into the reusable dataset
   */
  public recordRep(
    exerciseId: string,
    exerciseName: string,
    intensity: IntensityLevel,
    repRecord: RepRecord
  ): void {
    try {
      const now = new Date(repRecord.timestamp);
      const totalSec = Math.max(0.1, Math.round((repRecord.durationMs / 1000) * 10) / 10);
      const rom = repRecord.rangeOfMotion || Math.abs((repRecord.startingAngle || 160) - repRecord.maxKneeDepthAngle);
      const velocity = Math.round((rom / totalSec) * 10) / 10;
      
      const issues = repRecord.issues || [];
      const hasShallow = !repRecord.isCorrect && issues.some(i => i.category === 'INSUFFICIENT_DEPTH');
      const hasLean = issues.some(i => i.category === 'TORSO_LEAN');
      const asymmetry = repRecord.asymmetryDegrees || 0;
      const hasAsymmetry = asymmetry > 15;

      const target = repRecord.targetThresholdAngle || (exerciseId === 'squat' ? 105 : 75);
      const peak = repRecord.peakFlexionAngle || repRecord.maxKneeDepthAngle;
      const margin = target - peak;

      // Calculate a comprehensive 0-100 quality score
      const qualityScore = repRecord.isCorrect
        ? Math.min(100, Math.max(70, Math.round(100 - (hasLean ? 15 : 0) - (asymmetry > 10 ? 10 : 0))))
        : Math.min(65, Math.max(20, Math.round(50 + (margin > -15 ? 10 : 0) - (hasLean ? 20 : 0))));

      const row: DatasetRepRow = {
        Rep_ID: `rep_${exerciseId}_${repRecord.repNumber}_${repRecord.timestamp}`,
        Session_ID: this.currentSessionId,
        Timestamp: now.toISOString().replace('T', ' ').slice(0, 19),
        Epoch_ms: repRecord.timestamp,
        Exercise_Name: exerciseName,
        Exercise_Type: exerciseId,
        Intensity_Mode: intensity,
        Rep_Number: repRecord.repNumber,
        Form_Result: repRecord.isCorrect ? 'PASS' : 'FAIL',
        Is_Valid: repRecord.isCorrect ? 1 : 0,
        Target_Threshold_Deg: target,
        Peak_Flexion_Deg: peak,
        Starting_Angle_Deg: repRecord.startingAngle || 160,
        Ending_Angle_Deg: repRecord.endingAngle || (exerciseId === 'squat' ? 160 : 140),
        Range_Of_Motion_Deg: Math.round(rom * 10) / 10,
        Threshold_Margin_Deg: Math.round(margin * 10) / 10,
        Left_Knee_Min_Deg: repRecord.leftKneeAngle || peak,
        Right_Knee_Min_Deg: repRecord.rightKneeAngle || peak,
        Knee_Asymmetry_Deg: Math.round(asymmetry * 10) / 10,
        Left_Hip_Min_Deg: repRecord.leftHipAngle || 90,
        Right_Hip_Min_Deg: repRecord.rightHipAngle || 90,
        Max_Torso_Lean_Deg: Math.round(repRecord.minTorsoAngle * 10) / 10,
        Left_Elbow_Min_Deg: repRecord.leftElbowAngle || peak,
        Right_Elbow_Min_Deg: repRecord.rightElbowAngle || peak,
        Elbow_Asymmetry_Deg: Math.round(asymmetry * 10) / 10,
        Total_Duration_Sec: totalSec,
        Eccentric_Phase_Sec: Math.round(((repRecord.eccentricDurationMs || (repRecord.durationMs * 0.5)) / 1000) * 10) / 10,
        Concentric_Phase_Sec: Math.round(((repRecord.concentricDurationMs || (repRecord.durationMs * 0.5)) / 1000) * 10) / 10,
        Isometric_Hold_Sec: Math.round(((repRecord.isometricDurationMs || 0) / 1000) * 10) / 10,
        Avg_Angular_Velocity_DegSec: velocity,
        Fault_Shallow_Depth: hasShallow ? 1 : 0,
        Fault_Torso_Lean: hasLean ? 1 : 0,
        Fault_Asymmetry: hasAsymmetry ? 1 : 0,
        Issues_Count: issues.length,
        Detected_Issues_List: issues.map((i: PostureIssue) => i.message).join('; ') || 'None',
        Quality_Score_Pct: qualityScore,
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
      const reps = summary.repHistory || [];
      
      const avgDuration = reps.length > 0
        ? Math.round((reps.reduce((acc, r) => acc + (r.durationMs / 1000), 0) / reps.length) * 10) / 10
        : 0;
      const avgDepth = reps.length > 0
        ? Math.round((reps.reduce((acc, r) => acc + r.maxKneeDepthAngle, 0) / reps.length) * 10) / 10
        : 0;
      const avgLean = reps.length > 0
        ? Math.round((reps.reduce((acc, r) => acc + r.minTorsoAngle, 0) / reps.length) * 10) / 10
        : 0;
      const avgAsym = reps.length > 0
        ? Math.round((reps.reduce((acc, r) => acc + (r.asymmetryDegrees || 0), 0) / reps.length) * 10) / 10
        : 0;

      const row: DatasetSessionRow = {
        Session_ID: this.currentSessionId,
        Date_Time: now.toISOString().replace('T', ' ').slice(0, 19),
        Exercise_Name: summary.exerciseName,
        Exercise_Type: summary.exerciseId,
        Intensity_Mode: intensity,
        Target_Reps: summary.targetReps,
        Total_Attempts: summary.totalAttempts,
        Completed_Reps: summary.completedReps,
        Correct_Reps: summary.correctReps,
        Incorrect_Reps: summary.incorrectReps,
        Incomplete_Reps: summary.incompleteReps,
        Accuracy_Pct: summary.accuracy,
        Movement_Quality_Score: summary.movementQualityScore,
        Total_Duration_Sec: summary.durationSeconds,
        Avg_Rep_Duration_Sec: avgDuration,
        Avg_Peak_Depth_Deg: avgDepth,
        Avg_Torso_Lean_Deg: avgLean,
        Avg_Asymmetry_Deg: avgAsym,
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
   * Periodically sample kinematic telemetry during movement (~200ms throttle)
   */
  public sampleTelemetry(
    exerciseId: string,
    movementState: string,
    angles: CalculatedAngles | null,
    confidence: number
  ): void {
    const now = Date.now();
    if (now - this.lastTelemetrySampleMs < 200) return;
    this.lastTelemetrySampleMs = now;
    this.frameCounter++;

    if (!angles) return;

    try {
      const meanKnee = Math.round(((angles.leftKneeAngle + angles.rightKneeAngle) / 2) * 10) / 10;
      const meanHip = Math.round(((angles.leftHipAngle + angles.rightHipAngle) / 2) * 10) / 10;
      const elapsedSec = Math.round(((now - this.sessionStartEpoch) / 1000) * 100) / 100;

      const row: DatasetTelemetryRow = {
        Frame_Index: this.frameCounter,
        Timestamp: new Date(now).toISOString().replace('T', ' ').slice(0, 23),
        Time_Rel_Sec: elapsedSec,
        Session_ID: this.currentSessionId,
        Exercise: exerciseId,
        Movement_State: movementState,
        Progress_Pct: Math.round(angles.kneeAngle.angleDegrees),
        Left_Knee_Deg: Math.round(angles.leftKneeAngle * 10) / 10,
        Right_Knee_Deg: Math.round(angles.rightKneeAngle * 10) / 10,
        Mean_Knee_Deg: meanKnee,
        Left_Hip_Deg: Math.round(angles.leftHipAngle * 10) / 10,
        Right_Hip_Deg: Math.round(angles.rightHipAngle * 10) / 10,
        Torso_Lean_Deg: Math.round(angles.torsoLean * 10) / 10,
        Left_Elbow_Deg: Math.round(angles.leftElbowAngle * 10) / 10,
        Right_Elbow_Deg: Math.round(angles.rightElbowAngle * 10) / 10,
        Pose_Confidence: Math.round(confidence * 100) / 100,
      };

      this.telemetryBuffer.push(row);
      if (this.telemetryBuffer.length > MAX_TELEMETRY_ROWS) {
        this.telemetryBuffer.shift();
      }
    } catch {
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
    this.autoSaveToFile();
  }

  /**
   * Generates the Data Dictionary / Codebook sheet for maximum reusability
   */
  public getDataDictionary(): DataDictionaryEntry[] {
    return [
      {
        Sheet_Name: 'Repetitions',
        Variable_Name: 'Rep_ID',
        Data_Type: 'String (UUID)',
        Unit: 'Identifier',
        Anatomical_Definition: 'Unique repetition identifier format: rep_{exercise}_{repNum}_{timestamp}',
        Clinical_Interpretation: 'Primary key for relational linking to telemetry frames.',
      },
      {
        Sheet_Name: 'Repetitions',
        Variable_Name: 'Form_Result',
        Data_Type: 'Categorical',
        Unit: 'PASS / FAIL',
        Anatomical_Definition: 'Clinical pass/fail label based on depth criteria and spine posture safety.',
        Clinical_Interpretation: 'PASS indicates full biomechanical range of motion without posture violation.',
      },
      {
        Sheet_Name: 'Repetitions',
        Variable_Name: 'Is_Valid',
        Data_Type: 'Integer Binary',
        Unit: '1 or 0',
        Anatomical_Definition: 'Binary target label for Machine Learning classification models (1 = Valid, 0 = Fault).',
        Clinical_Interpretation: 'Direct target variable for training ML form classifiers.',
      },
      {
        Sheet_Name: 'Repetitions',
        Variable_Name: 'Target_Threshold_Deg',
        Data_Type: 'Float',
        Unit: 'Degrees (°)',
        Anatomical_Definition: 'Prescribed joint angle threshold required for exercise completion.',
        Clinical_Interpretation: 'Gentle: 125°, Standard: 105°, Deep athletic: 90° for squats.',
      },
      {
        Sheet_Name: 'Repetitions',
        Variable_Name: 'Peak_Flexion_Deg',
        Data_Type: 'Float',
        Unit: 'Degrees (°)',
        Anatomical_Definition: 'Minimum interior joint angle achieved at lowest descent or maximum contraction.',
        Clinical_Interpretation: 'Lower angle indicates greater joint flexion and depth.',
      },
      {
        Sheet_Name: 'Repetitions',
        Variable_Name: 'Range_Of_Motion_Deg',
        Data_Type: 'Float',
        Unit: 'Degrees (°)',
        Anatomical_Definition: 'Angular displacement from initial standing position to peak bottom flexion.',
        Clinical_Interpretation: 'Indicates total mechanical work and mobility across the joint.',
      },
      {
        Sheet_Name: 'Repetitions',
        Variable_Name: 'Threshold_Margin_Deg',
        Data_Type: 'Float',
        Unit: 'Degrees (°)',
        Anatomical_Definition: 'Target_Threshold_Deg minus Peak_Flexion_Deg.',
        Clinical_Interpretation: 'Positive values indicate depth exceeded target. Negative values indicate shallow reps.',
      },
      {
        Sheet_Name: 'Repetitions',
        Variable_Name: 'Knee_Asymmetry_Deg',
        Data_Type: 'Float',
        Unit: 'Degrees (°)',
        Anatomical_Definition: '|Left_Knee_Min_Deg - Right_Knee_Min_Deg|.',
        Clinical_Interpretation: '> 15° indicates significant bilateral weight-shift or unilateral muscle weakness.',
      },
      {
        Sheet_Name: 'Repetitions',
        Variable_Name: 'Max_Torso_Lean_Deg',
        Data_Type: 'Float',
        Unit: 'Degrees (°)',
        Anatomical_Definition: 'Angle between vector (Hip Midpoint to Shoulder Midpoint) and vertical axis (0° = upright).',
        Clinical_Interpretation: '> 35° indicates excessive forward spinal shear and insufficient core engagement.',
      },
      {
        Sheet_Name: 'Repetitions',
        Variable_Name: 'Eccentric_Phase_Sec',
        Data_Type: 'Float',
        Unit: 'Seconds (s)',
        Anatomical_Definition: 'Duration from descent initiation to lowest peak flexion point.',
        Clinical_Interpretation: 'Controlled lowering (tempo 2.0-3.0s) reduces patellar strain.',
      },
      {
        Sheet_Name: 'Repetitions',
        Variable_Name: 'Concentric_Phase_Sec',
        Data_Type: 'Float',
        Unit: 'Seconds (s)',
        Anatomical_Definition: 'Duration from lowest peak flexion point back to full standing lockout.',
        Clinical_Interpretation: 'Measures concentric rate of force development.',
      },
      {
        Sheet_Name: 'Repetitions',
        Variable_Name: 'Avg_Angular_Velocity_DegSec',
        Data_Type: 'Float',
        Unit: '°/s',
        Anatomical_Definition: 'Range of Motion divided by Total Repetition Duration.',
        Clinical_Interpretation: 'Biomechanical speed of joint rotation during repetition.',
      },
      {
        Sheet_Name: 'Kinematics_Telemetry',
        Variable_Name: 'Mean_Knee_Deg',
        Data_Type: 'Float',
        Unit: 'Degrees (°)',
        Anatomical_Definition: 'Bilateral mean of left and right knee interior angles formed by Hip-Knee-Ankle.',
        Clinical_Interpretation: 'Continuous time-series variable for trajectory modeling and phase segmentation.',
      },
      {
        Sheet_Name: 'Kinematics_Telemetry',
        Variable_Name: 'Torso_Lean_Deg',
        Data_Type: 'Float',
        Unit: 'Degrees (°)',
        Anatomical_Definition: 'Continuous sagittal inclination of the spine relative to vertical gravity vector.',
        Clinical_Interpretation: 'Dynamic lumbar-pelvic rhythm marker during exercise cycles.',
      },
    ];
  }

  /**
   * Generates a fully populated 4-sheet research workbook
   */
  public generateWorkbook(): XLSX.WorkBook {
    const reps = this.getStoredReps();
    const sessions = this.getStoredSessions();
    const telemetry = this.telemetryBuffer;
    const dictionary = this.getDataDictionary();

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Repetitions
    const wsReps = reps.length > 0
      ? XLSX.utils.json_to_sheet(reps)
      : XLSX.utils.aoa_to_sheet([['No reps recorded yet']]);
    XLSX.utils.book_append_sheet(workbook, wsReps, 'Repetitions');

    // Sheet 2: Sessions
    const wsSessions = sessions.length > 0
      ? XLSX.utils.json_to_sheet(sessions)
      : XLSX.utils.aoa_to_sheet([['No sessions recorded yet']]);
    XLSX.utils.book_append_sheet(workbook, wsSessions, 'Sessions');

    // Sheet 3: Kinematics Telemetry
    const wsTelemetry = telemetry.length > 0
      ? XLSX.utils.json_to_sheet(telemetry)
      : XLSX.utils.aoa_to_sheet([['No telemetry sampled yet']]);
    XLSX.utils.book_append_sheet(workbook, wsTelemetry, 'Kinematics_Telemetry');

    // Sheet 4: Data Dictionary (Codebook)
    const wsDict = XLSX.utils.json_to_sheet(dictionary);
    XLSX.utils.book_append_sheet(workbook, wsDict, 'Data_Dictionary');

    return workbook;
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

    const workbook = this.generateWorkbook();

    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
    const filename = `KinetiQ_Dataset_${dateStr}_${timeStr}.xlsx`;

    XLSX.writeFile(workbook, filename);
    this.autoSaveToFile(filename);
  }

  /**
   * Silently writes the current Excel workbook directly into datasets/ folder on disk
   */
  public async autoSaveToFile(customFilename?: string): Promise<void> {
    try {
      const workbook = this.generateWorkbook();
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
   * Exports reps as clean CSV
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
    a.download = `KinetiQ_Repetitions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Hidden developer hooks and keyboard shortcut listener
   */
  private setupGlobalHooks(): void {
    if (typeof window === 'undefined') return;

    (window as any).__kinetiqDataset = {
      exportExcel: () => this.exportToExcel(),
      exportCsv: () => this.exportRepsToCsv(),
      getReps: () => this.getStoredReps(),
      getSessions: () => this.getStoredSessions(),
      getTelemetry: () => this.telemetryBuffer,
      getDictionary: () => this.getDataDictionary(),
      clear: () => this.clearDataset(),
    };
    (window as any).__exportDataset = () => this.exportToExcel();

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e' || e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        this.exportToExcel();
      }
    });
  }
}
