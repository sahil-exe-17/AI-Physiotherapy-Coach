import { ExerciseDefinition } from '../types/exercise';
import { IExerciseAnalyzer } from './exerciseTypes';
import { SquatAnalyzer, DEFAULT_SQUAT_DEFINITION } from './squatAnalyzer';
import { ArmCurlAnalyzer, DEFAULT_ARM_CURL_DEFINITION } from './armCurlAnalyzer';
import { GenericRehabAnalyzer } from './genericRehabAnalyzer';

export const REHAB_DEFINITIONS: Record<string, ExerciseDefinition> = {
  squat: DEFAULT_SQUAT_DEFINITION,
  arm_curl: DEFAULT_ARM_CURL_DEFINITION,
  shoulder_raise: {
    id: 'shoulder_raise',
    name: 'Shoulder Raises',
    description: 'Controlled arm elevation targeting deltoids and scapular stabilization.',
    targetReps: 10,
    requiredLandmarks: [11, 12, 13, 14],
    relevantAngles: ['Shoulder Angle', 'Elbow Angle'],
    thresholds: {
      standingKneeAngleMin: 140,
      squatDepthKneeAngleMax: 90,
      shallowSquatAngleMax: 70,
      maxTorsoLeanAngle: 25,
      kneeValgusThreshold: 0.7,
      minConfidenceScore: 0.35,
    },
  },
  knee_extension: {
    id: 'knee_extension',
    name: 'Knee Extensions',
    description: 'Open-chain seated knee extension activating the quadriceps mechanism.',
    targetReps: 10,
    requiredLandmarks: [23, 24, 25, 26, 27, 28],
    relevantAngles: ['Knee Angle'],
    thresholds: {
      standingKneeAngleMin: 140,
      squatDepthKneeAngleMax: 160,
      shallowSquatAngleMax: 140,
      maxTorsoLeanAngle: 25,
      kneeValgusThreshold: 0.7,
      minConfidenceScore: 0.35,
    },
  },
  straight_leg_raise: {
    id: 'straight_leg_raise',
    name: 'Straight Leg Raises',
    description: 'Low-impact hip flexion preserving knee joint integrity.',
    targetReps: 10,
    requiredLandmarks: [23, 24, 25, 26],
    relevantAngles: ['Hip Angle', 'Knee Angle'],
    thresholds: {
      standingKneeAngleMin: 160,
      squatDepthKneeAngleMax: 130,
      shallowSquatAngleMax: 145,
      maxTorsoLeanAngle: 25,
      kneeValgusThreshold: 0.7,
      minConfidenceScore: 0.35,
    },
  },
  bicycle_exercise: {
    id: 'bicycle_exercise',
    name: 'Bicycle Leg Cycles',
    description: 'Reciprocal leg pedaling enhancing hip mobility and core control.',
    targetReps: 12,
    requiredLandmarks: [23, 24, 25, 26, 27, 28],
    relevantAngles: ['Hip Angle', 'Knee Angle'],
    thresholds: {
      standingKneeAngleMin: 140,
      squatDepthKneeAngleMax: 110,
      shallowSquatAngleMax: 130,
      maxTorsoLeanAngle: 30,
      kneeValgusThreshold: 0.7,
      minConfidenceScore: 0.35,
    },
  },
};

export class ExerciseRegistry {
  private static definitions: Map<string, ExerciseDefinition> = new Map();

  static {
    Object.values(REHAB_DEFINITIONS).forEach((def) => {
      ExerciseRegistry.definitions.set(def.id, def);
    });
  }

  public static getDefinition(id: string): ExerciseDefinition {
    const def = ExerciseRegistry.definitions.get(id);
    if (!def) {
      return DEFAULT_SQUAT_DEFINITION;
    }
    return def;
  }

  public static createAnalyzer(id: string): IExerciseAnalyzer {
    switch (id) {
      case 'arm_curl':
        return new ArmCurlAnalyzer(ExerciseRegistry.getDefinition('arm_curl'));
      case 'squat':
        return new SquatAnalyzer(ExerciseRegistry.getDefinition('squat'));
      case 'shoulder_raise':
      case 'knee_extension':
      case 'straight_leg_raise':
      case 'bicycle_exercise':
      default:
        return new GenericRehabAnalyzer(ExerciseRegistry.getDefinition(id));
    }
  }

  public static getAllDefinitions(): ExerciseDefinition[] {
    return Array.from(ExerciseRegistry.definitions.values());
  }
}
