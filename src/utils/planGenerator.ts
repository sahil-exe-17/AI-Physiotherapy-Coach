import { FullIntakePayload, RecommendedExercisePlan, PlannedExerciseItem } from '../types/intake';
import { IntensityLevel } from '../types/exercise';

export function generatePersonalizedPlan(payload: FullIntakePayload): RecommendedExercisePlan {
  const { common, dynamic, safety } = payload;

  // 1. Check Safety Red Flags (Clinician Hold)
  const isSeverePain = safety.suddenSeverePain === 'Yes';
  const hasNeurologicalFlags = safety.newNumbnessWeaknessOrBalanceLoss === 'Yes';
  const isMedicallyRestricted = safety.toldNotToExercise === 'Yes';
  const surgeryWithoutClearance =
    common.hasSurgery === 'Yes' && dynamic.surgery?.hasClearance === 'No';

  if (isSeverePain || hasNeurologicalFlags || isMedicallyRestricted || surgeryWithoutClearance) {
    let holdReason = 'Medical caution advised.';
    if (isSeverePain) {
      holdReason =
        'You reported sudden or severe acute pain. High-stress exercise should be paused until an in-person clinical assessment.';
    } else if (hasNeurologicalFlags) {
      holdReason =
        'You reported new numbness, weakness, or loss of balance. These symptoms require evaluation by a physician or neurologist.';
    } else if (isMedicallyRestricted) {
      holdReason =
        'Your healthcare provider has advised against exercising the affected area. Please follow clinician restrictions.';
    } else if (surgeryWithoutClearance) {
      holdReason =
        'Recent surgery requires written clearance from your surgeon or physiotherapist before initiating digital exercise therapy.';
    }

    return {
      id: `hold_${Date.now()}`,
      userName: common.userName?.trim(),
      title: 'Clinical Assessment Required',
      rationale:
        'Safety is our top priority. Based on your reported symptoms, autonomous exercise should be temporarily suspended.',
      intensity: 'LOW',
      estimatedMinutes: 0,
      exercises: [],
      precautions: [
        'Do not force movement through acute or sharp pain.',
        'Consult an orthopedic doctor or licensed physiotherapist.',
        'Seek urgent care if numbness or radiating pain increases.',
      ],
      isClinicianHold: true,
      clinicianHoldReason: holdReason,
    };
  }

  // 2. Determine Intensity Level
  let planIntensity: IntensityLevel = 'MEDIUM';
  if (
    common.painLevel >= 6 ||
    common.mobilityLevel === 'Significantly restricted' ||
    common.approvedIntensity === 'Low' ||
    (common.mobilitySupport && common.mobilitySupport !== 'None')
  ) {
    planIntensity = 'LOW';
  } else if (common.painLevel <= 3 && common.mobilityLevel === 'Normal' && common.approvedIntensity === 'High') {
    planIntensity = 'HIGH';
  } else {
    planIntensity = 'MEDIUM';
  }

  // 3. Determine Reps and Sets based on daily time & pain
  let sets = 2;
  let defaultReps = 10;
  let estimatedMins = 15;

  if (common.dailyTime === '5–10') {
    sets = 1;
    defaultReps = 8;
    estimatedMins = 8;
  } else if (common.dailyTime === '10–20') {
    sets = 2;
    defaultReps = 10;
    estimatedMins = 15;
  } else if (common.dailyTime === '20–30') {
    sets = 3;
    defaultReps = 12;
    estimatedMins = 25;
  }

  if (planIntensity === 'LOW') {
    defaultReps = Math.max(6, defaultReps - 2);
  }

  // 4. Exercise Selection Engine
  const exercises: PlannedExerciseItem[] = [];
  const precautions: string[] = [];

  const target = common.targetBodyPart;

  if (target === 'Knee') {
    exercises.push({
      id: 'knee_extension',
      name: 'Seated Knee Extensions',
      targetArea: 'Quadriceps & Patellar Tendon',
      targetReps: defaultReps,
      sets,
      intensity: planIntensity,
      restSeconds: 45,
      reason: 'Strengthens the vastus medialis and quadriceps without joint compression.',
      precaution: 'Avoid locking the knee forcefully at top of extension.',
      enabled: true,
    });

    exercises.push({
      id: 'straight_leg_raise',
      name: 'Straight Leg Raises',
      targetArea: 'Hip Flexors & Anterior Knee Stability',
      targetReps: defaultReps,
      sets,
      intensity: planIntensity,
      restSeconds: 45,
      reason: 'Engages knee stabilizers with zero tibiofemoral joint shear.',
      precaution: 'Keep back flat against the mat or chair.',
      enabled: true,
    });

    if (common.painLevel <= 4 && common.mobilityLevel !== 'Significantly restricted') {
      exercises.push({
        id: 'squat',
        name: 'Supported Bodyweight Squat',
        targetArea: 'Knee & Glute Complex',
        targetReps: Math.max(6, defaultReps - 2),
        sets,
        intensity: planIntensity,
        restSeconds: 60,
        reason: 'Restores functional closed-chain knee flexion and sit-to-stand strength.',
        precaution: 'Maintain knees tracking in line with toes. Stop at 90° depth.',
        enabled: true,
      });
    }

    precautions.push('Keep knee joints aligned with second toe during flexion.');
    precautions.push('Stop immediately if experiencing sharp patellofemoral pain.');
  } else if (target === 'Shoulder') {
    exercises.push({
      id: 'shoulder_raise',
      name: 'Controlled Shoulder Raises',
      targetArea: 'Anterior & Lateral Deltoids',
      targetReps: defaultReps,
      sets,
      intensity: planIntensity,
      restSeconds: 45,
      reason: 'Reactivates glenohumeral elevation and scapular rhythm.',
      precaution: 'Do not shrug shoulders toward ears; stop at parallel shoulder height.',
      enabled: true,
    });

    exercises.push({
      id: 'arm_curl',
      name: 'Standing Arm Flexion',
      targetArea: 'Biceps Brachii & Forearm Flexors',
      targetReps: defaultReps,
      sets,
      intensity: planIntensity,
      restSeconds: 45,
      reason: 'Reinforces anterior arm chain stability without overhead impingement risk.',
      precaution: 'Keep elbows tucked closely to your sides.',
      enabled: true,
    });

    precautions.push('Avoid rapid overhead thrusts.');
    precautions.push('Keep movements in the scapular plane (30° forward of coronal plane).');
  } else if (target === 'Hip' || target === 'Legs') {
    exercises.push({
      id: 'straight_leg_raise',
      name: 'Straight Leg Raises',
      targetArea: 'Hip Flexors & Pelvic Alignment',
      targetReps: defaultReps,
      sets,
      intensity: planIntensity,
      restSeconds: 45,
      reason: 'Improves hip flexion strength while keeping the pelvis stable.',
      enabled: true,
    });

    exercises.push({
      id: 'bicycle_exercise',
      name: 'Bicycle Leg Cycles',
      targetArea: 'Hip Mobility & Lower Core',
      targetReps: defaultReps + 4,
      sets,
      intensity: planIntensity,
      restSeconds: 60,
      reason: 'Promotes synovial fluid circulation across hip and knee joints.',
      precaution: 'Maintain rhythmic, smooth pedaling motion without arching lower back.',
      enabled: true,
    });

    exercises.push({
      id: 'squat',
      name: 'Controlled Bodyweight Squat',
      targetArea: 'Gluteus Maximus & Hamstrings',
      targetReps: defaultReps,
      sets,
      intensity: planIntensity,
      restSeconds: 60,
      reason: 'Builds compound lower extremity power and functional gait support.',
      enabled: true,
    });

    precautions.push('Maintain even weight distribution across both feet.');
  } else if (target === 'Arms') {
    exercises.push({
      id: 'arm_curl',
      name: 'Biomechanical Bicep Curl',
      targetArea: 'Elbow Flexors & Upper Arm',
      targetReps: defaultReps,
      sets,
      intensity: planIntensity,
      restSeconds: 45,
      reason: 'Restores elbow range of motion and functional lifting endurance.',
      enabled: true,
    });

    exercises.push({
      id: 'shoulder_raise',
      name: 'Shoulder Level Raises',
      targetArea: 'Deltoid Stability & Arm Posture',
      targetReps: defaultReps,
      sets,
      intensity: planIntensity,
      restSeconds: 45,
      reason: 'Prevents upper arm muscular imbalances.',
      enabled: true,
    });

    precautions.push('Maintain controlled tempo (2 seconds concentric, 2 seconds eccentric).');
  } else if (target === 'Back') {
    exercises.push({
      id: 'straight_leg_raise',
      name: 'Supported Leg Raise & Core Brace',
      targetArea: 'Deep Lumbar Stabilizers',
      targetReps: defaultReps,
      sets,
      intensity: planIntensity,
      restSeconds: 45,
      reason: 'Stabilizes the lumbar spine with minimal axial spinal loading.',
      precaution: 'Ensure lower back remains pressed comfortably against support.',
      enabled: true,
    });

    exercises.push({
      id: 'bicycle_exercise',
      name: 'Gentle Supine Bicycle Cycles',
      targetArea: 'Core & Pelvic Rhythm',
      targetReps: defaultReps,
      sets,
      intensity: planIntensity,
      restSeconds: 60,
      reason: 'Decompresses lumbar joints through gentle alternating limb movement.',
      enabled: true,
    });

    precautions.push('Avoid extreme twisting or loaded flexion.');
    precautions.push('Keep core lightly engaged throughout all reps.');
  } else {
    // Multiple body parts or Mobility/Flexibility
    exercises.push({
      id: 'squat',
      name: 'Functional Squat',
      targetArea: 'Full Lower Body & Core',
      targetReps: defaultReps,
      sets,
      intensity: planIntensity,
      restSeconds: 60,
      reason: 'Foundational multi-joint movement targeting legs, hips, and postural core.',
      enabled: true,
    });

    exercises.push({
      id: 'shoulder_raise',
      name: 'Shoulder Raises',
      targetArea: 'Upper Body Elevation',
      targetReps: defaultReps,
      sets,
      intensity: planIntensity,
      restSeconds: 45,
      reason: 'Upper quadrant mobility and scapular rhythm.',
      enabled: true,
    });

    exercises.push({
      id: 'bicycle_exercise',
      name: 'Bicycle Leg Cycles',
      targetArea: 'Full Body Mobility & Core',
      targetReps: defaultReps + 4,
      sets,
      intensity: planIntensity,
      restSeconds: 60,
      reason: 'Improves active range of motion across multiple limb chains.',
      enabled: true,
    });

    precautions.push('Take your time between exercise transitions.');
  }

  // Precaution checks based on support & medication
  if (common.mobilitySupport && common.mobilitySupport !== 'None') {
    precautions.push(
      `Keep your ${common.mobilitySupport.toLowerCase()} or sturdy support within arm's reach during standing exercises.`
    );
  }
  if (common.takingMedication === 'Yes') {
    precautions.push(
      'Move with extra care: pause if you feel dizziness or delayed stability response from medications.'
    );
  }
  if (common.consultedDoctor === 'No' && common.painLevel >= 6) {
    precautions.push(
      'We recommend scheduling a formal consultation with an orthopedic physician or licensed physiotherapist.'
    );
  }

  // Final summary rationale
  const namePrefix = common.userName?.trim() ? `${common.userName.trim()}'s ` : '';
  const title = `${namePrefix}${common.targetBodyPart} ${common.mainGoal} Plan`;
  const biometricInfo = common.heightCm && common.weightKg ? `, ${common.heightCm}cm / ${common.weightKg}kg` : '';
  const genderInfo = common.gender && common.gender !== 'Prefer not to say' ? `${common.gender}, ` : '';
  const rationale = `Customized for ${common.userName?.trim() || 'you'} (${genderInfo}${common.age} y/o${biometricInfo}) targeting ${common.targetBodyPart} with current pain level ${common.painLevel}/10 and ${common.mobilityLevel.toLowerCase()} mobility. Calibrated for ${common.trackingDevice || 'camera'} tracking. Prescribing ${exercises.length} exercises at ${planIntensity} intensity.`;

  return {
    id: `plan_${Date.now()}`,
    userName: common.userName?.trim(),
    title,
    rationale,
    intensity: planIntensity,
    estimatedMinutes: estimatedMins,
    exercises,
    precautions,
    isClinicianHold: false,
  };
}
