import { ExerciseDefinition } from '../types/exercise';
import { IExerciseAnalyzer } from './exerciseTypes';
import { SquatAnalyzer, DEFAULT_SQUAT_DEFINITION } from './squatAnalyzer';
import { ArmCurlAnalyzer, DEFAULT_ARM_CURL_DEFINITION } from './armCurlAnalyzer';

export class ExerciseRegistry {
  private static definitions: Map<string, ExerciseDefinition> = new Map();

  static {
    // Register default exercises
    ExerciseRegistry.definitions.set(DEFAULT_SQUAT_DEFINITION.id, DEFAULT_SQUAT_DEFINITION);
    ExerciseRegistry.definitions.set(DEFAULT_ARM_CURL_DEFINITION.id, DEFAULT_ARM_CURL_DEFINITION);
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
      default:
        return new SquatAnalyzer(ExerciseRegistry.getDefinition('squat'));
    }
  }

  public static getAllDefinitions(): ExerciseDefinition[] {
    return Array.from(ExerciseRegistry.definitions.values());
  }
}
