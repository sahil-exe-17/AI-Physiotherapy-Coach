import { IntensityLevel } from './exercise';

export type MainGoal =
  | 'Pain relief'
  | 'Injury recovery'
  | 'Post-surgery rehabilitation'
  | 'Mobility'
  | 'Flexibility';

export type TargetBodyPart =
  | 'Shoulder'
  | 'Knee'
  | 'Hip'
  | 'Back'
  | 'Legs'
  | 'Arms'
  | 'Multiple body parts';

export type YesNo = 'Yes' | 'No';
export type YesNoUnsure = 'Yes' | 'No' | 'Unsure';

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';
export type MobilitySupport = 'None' | 'Walking stick' | 'Walker' | 'Crutches' | 'Other';
export type TrackingDevice = 'Mobile phone' | 'Laptop webcam' | 'External webcam';

export type MobilityLevel =
  | 'Normal'
  | 'Mildly restricted'
  | 'Significantly restricted'
  | 'Unsure';

export type ApprovedIntensity = 'Low' | 'Medium' | 'High' | 'Not sure';

export type DailyExerciseTime = '5–10' | '10–20' | '20–30';

// 1. Common Answers
export interface CommonAssessmentData {
  userName: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  mainGoal: MainGoal;
  targetBodyPart: TargetBodyPart;
  hasInjury: YesNo;
  hasSurgery: YesNo;
  painLevel: number; // 0 to 10
  consultedDoctor: YesNo;
  takingMedication: YesNoUnsure;
  mobilitySupport: MobilitySupport;
  trackingDevice: TrackingDevice;
  hasRestrictions: YesNoUnsure;
  mobilityLevel: MobilityLevel;
  approvedIntensity: ApprovedIntensity;
  dailyTime: DailyExerciseTime;
}

// 2. Dynamic Answers
export interface DynamicInjuryData {
  injuryName: string;
  injuryTimeline: 'Recently' | 'Within the last month' | 'More than a month ago';
  discomfortMovements: string;
  assessedByProfessional: YesNo;
  movementsToAvoid: string;
}

export interface DynamicSurgeryData {
  surgeryType: string;
  operatedBodyPart: string;
  surgeryTimeline: 'Recently (< 1 month)' | '1–3 months ago' | '3–6 months ago' | '> 6 months ago';
  hasClearance: YesNoUnsure;
  movementRestrictions: string;
}

export interface DynamicShoulderData {
  side: 'Left' | 'Right' | 'Both';
  difficultyOverhead: YesNo;
  painOnRotation: YesNo;
  canRaiseWithoutAssistance: YesNo;
}

export interface DynamicKneeData {
  side: 'Left' | 'Right' | 'Both';
  difficultyBendingStraightening: YesNo;
  canWalkComfortably: YesNo;
  painOnStairsOrStanding: YesNo;
}

export interface DynamicBackData {
  location: 'Upper back' | 'Lower back' | 'Entire back';
  painOnBendingForward: YesNo;
  painOnTwisting: YesNo;
  painSpreadsToLimbs: YesNo;
}

export interface DynamicHipLegData {
  side: 'Left' | 'Right' | 'Both';
  difficultyWalkingStanding: YesNo;
  canLiftLegComfortably: YesNo;
  difficultyMaintainingBalance: YesNo;
}

export interface DynamicArmData {
  side: 'Left' | 'Right' | 'Both';
  difficultyLiftingExtending: YesNo;
  discomfortBendingElbow: YesNo;
  canLiftLightObjects: YesNo;
}

export interface DynamicMultipleData {
  selectedParts: string[];
  mainPriority: string;
  sameOrDifferentCondition: 'Same injury' | 'Different conditions' | 'Unsure';
}

export interface DynamicMobilityData {
  movementToImprove: string;
  difficultActivities: string;
  limitationCause: 'Caused by injury' | 'General mobility concern' | 'Both';
}

export interface DynamicAssessmentData {
  injury?: DynamicInjuryData;
  surgery?: DynamicSurgeryData;
  shoulder?: DynamicShoulderData;
  knee?: DynamicKneeData;
  back?: DynamicBackData;
  hipLeg?: DynamicHipLegData;
  arms?: DynamicArmData;
  multiple?: DynamicMultipleData;
  mobility?: DynamicMobilityData;
}

// 3. Safety Red Flags
export interface SafetyAssessmentData {
  suddenSeverePain: YesNo;
  newNumbnessWeaknessOrBalanceLoss: YesNo;
  toldNotToExercise: YesNo;
}

// 4. Full Assessment Payload
export interface FullIntakePayload {
  common: CommonAssessmentData;
  dynamic: DynamicAssessmentData;
  safety: SafetyAssessmentData;
}

// 5. Recommended & Editable Exercise Plan
export interface PlannedExerciseItem {
  id: string;
  name: string;
  targetArea: string;
  targetReps: number;
  sets: number;
  intensity: IntensityLevel;
  restSeconds: number;
  reason: string;
  precaution?: string;
  enabled: boolean;
}

export interface RecommendedExercisePlan {
  id: string;
  userName?: string;
  title: string;
  rationale: string;
  intensity: IntensityLevel;
  estimatedMinutes: number;
  exercises: PlannedExerciseItem[];
  precautions: string[];
  isClinicianHold: boolean;
  clinicianHoldReason?: string;
}
