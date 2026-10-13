import React, { useState } from 'react';
import {
  CommonAssessmentData,
  DynamicAssessmentData,
  SafetyAssessmentData,
  FullIntakePayload,
  RecommendedExercisePlan,
  PlannedExerciseItem,
  MainGoal,
  TargetBodyPart,
  YesNo,
  YesNoUnsure,
  Gender,
  MobilitySupport,
  TrackingDevice,
  MobilityLevel,
  ApprovedIntensity,
  DailyExerciseTime,
} from '../../types/intake';
import { generatePersonalizedPlan } from '../../utils/planGenerator';
import { ExerciseRegistry } from '../../exercises/exerciseRegistry';
import { IntensityLevel } from '../../types/exercise';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Play,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Target,
  Flame,
  Check,
  HeartPulse,
  Info,
  User,
  Scale,
  Smartphone,
  Laptop,
  Stethoscope,
  Pill,
  Camera,
} from 'lucide-react';

interface IntakeAssessmentProps {
  onCompletePlan: (plan: RecommendedExercisePlan, startingExerciseId: string) => void;
  onSkip?: () => void;
  onBackToHome?: () => void;
  initialUserName?: string;
}

export const IntakeAssessment: React.FC<IntakeAssessmentProps> = ({
  onCompletePlan,
  onSkip,
  onBackToHome,
  initialUserName,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // 1. Common Answers State
  const [common, setCommon] = useState<CommonAssessmentData>({
    userName: initialUserName?.trim() || 'Alex Johnson',
    gender: 'Male',
    age: 32,
    heightCm: 175,
    weightKg: 70,
    mainGoal: 'Injury recovery',
    targetBodyPart: 'Knee',
    hasInjury: 'No',
    hasSurgery: 'No',
    painLevel: 3,
    consultedDoctor: 'Yes',
    takingMedication: 'No',
    mobilitySupport: 'None',
    trackingDevice: 'Laptop webcam',
    hasRestrictions: 'No',
    mobilityLevel: 'Normal',
    approvedIntensity: 'Medium',
    dailyTime: '10–20',
  });

  // 2. Dynamic Answers State
  const [dynamic, setDynamic] = useState<DynamicAssessmentData>({
    injury: {
      injuryName: 'Meniscus / Patellar strain',
      injuryTimeline: 'Within the last month',
      discomfortMovements: 'Deep knee bending and stairs',
      assessedByProfessional: 'Yes',
      movementsToAvoid: 'Deep squats beyond 90 degrees',
    },
    surgery: {
      surgeryType: 'Arthroscopic repair',
      operatedBodyPart: 'Knee',
      surgeryTimeline: '3–6 months ago',
      hasClearance: 'Yes',
      movementRestrictions: 'Low impact only',
    },
    shoulder: {
      side: 'Right',
      difficultyOverhead: 'Yes',
      painOnRotation: 'No',
      canRaiseWithoutAssistance: 'Yes',
    },
    knee: {
      side: 'Right',
      difficultyBendingStraightening: 'Yes',
      canWalkComfortably: 'Yes',
      painOnStairsOrStanding: 'Yes',
    },
    back: {
      location: 'Lower back',
      painOnBendingForward: 'Yes',
      painOnTwisting: 'No',
      painSpreadsToLimbs: 'No',
    },
    hipLeg: {
      side: 'Right',
      difficultyWalkingStanding: 'No',
      canLiftLegComfortably: 'Yes',
      difficultyMaintainingBalance: 'No',
    },
    arms: {
      side: 'Right',
      difficultyLiftingExtending: 'No',
      discomfortBendingElbow: 'Yes',
      canLiftLightObjects: 'Yes',
    },
    multiple: {
      selectedParts: ['Knee', 'Hip'],
      mainPriority: 'Knee',
      sameOrDifferentCondition: 'Same injury',
    },
    mobility: {
      movementToImprove: 'Squat depth and knee flexion',
      difficultActivities: 'Getting up from low chairs',
      limitationCause: 'General mobility concern',
    },
  });

  // 3. Safety Red Flags State
  const [safety, setSafety] = useState<SafetyAssessmentData>({
    suddenSeverePain: 'No',
    newNumbnessWeaknessOrBalanceLoss: 'No',
    toldNotToExercise: 'No',
  });

  // 4. Generated Editable Plan State
  const [plan, setPlan] = useState<RecommendedExercisePlan | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('squat');

  // Trigger generator when navigating to Step 4
  const handleProceedToPlan = () => {
    const fullPayload: FullIntakePayload = { common, dynamic, safety };
    const generated = generatePersonalizedPlan(fullPayload);
    setPlan(generated);
    if (generated.exercises.length > 0) {
      setSelectedExerciseId(generated.exercises[0].id);
    }
    setCurrentStep(4);
  };

  // Plan editing helper functions
  const updateExerciseReps = (exerciseId: string, delta: number) => {
    if (!plan) return;
    setPlan({
      ...plan,
      exercises: plan.exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, targetReps: Math.max(4, Math.min(30, ex.targetReps + delta)) }
          : ex
      ),
    });
  };

  const updateExerciseSets = (exerciseId: string, delta: number) => {
    if (!plan) return;
    setPlan({
      ...plan,
      exercises: plan.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: Math.max(1, Math.min(6, ex.sets + delta)) } : ex
      ),
    });
  };

  const updateExerciseIntensity = (exerciseId: string, intensity: IntensityLevel) => {
    if (!plan) return;
    setPlan({
      ...plan,
      exercises: plan.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, intensity } : ex
      ),
    });
  };

  const toggleExerciseEnabled = (exerciseId: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      exercises: plan.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, enabled: !ex.enabled } : ex
      ),
    });
  };

  const addLibraryExercise = (definitionId: string) => {
    if (!plan) return;
    const def = ExerciseRegistry.getDefinition(definitionId);
    if (plan.exercises.some((e) => e.id === def.id)) return;

    const newItem: PlannedExerciseItem = {
      id: def.id,
      name: def.name,
      targetArea: 'Rehabilitation Area',
      targetReps: def.targetReps || 10,
      sets: 2,
      intensity: plan.intensity,
      restSeconds: 45,
      reason: 'Clinician recommended auxiliary rehabilitation exercise.',
      enabled: true,
    };

    setPlan({
      ...plan,
      exercises: [...plan.exercises, newItem],
    });
  };

  const getPainColor = (val: number) => {
    if (val <= 2) return 'text-emerald-600 bg-emerald-50 border-emerald-300';
    if (val <= 5) return 'text-amber-700 bg-amber-50 border-amber-300';
    if (val <= 7) return 'text-orange-700 bg-orange-50 border-orange-300';
    return 'text-rose-700 bg-rose-50 border-rose-300';
  };

  const getPainDescriptor = (val: number) => {
    if (val === 0) return 'No Pain (0)';
    if (val <= 3) return `Mild (${val}/10)`;
    if (val <= 6) return `Moderate (${val}/10)`;
    if (val <= 8) return `Severe (${val}/10)`;
    return `Extreme (${val}/10)`;
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-800 flex flex-col font-sans selection:bg-stone-200">
      {/* Top Header */}
      <header className="w-full bg-white/85 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Return to Landing Page"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
            <HeartPulse className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-stone-900 tracking-tight font-heading">
              KinetiQ Clinical Assessment
            </h1>
            <p className="text-xs text-stone-500 font-medium">AI-Prescribed Physiotherapy Plan</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs text-stone-500 hover:text-stone-800 font-medium px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-all cursor-pointer"
            >
              Quick Prototype Skip →
            </button>
          )}
        </div>
      </header>

      {/* Modern High-End Stepper Progress Bar */}
      <div className="max-w-4xl w-full mx-auto px-4 pt-6 pb-2 animate-fade-in">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-stone-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
          {/* Header of Progress Bar: Step counter and percent badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider font-heading">
                Step {currentStep} of 4:
              </span>
              <span className="text-xs font-semibold text-stone-600">
                {currentStep === 1 && 'General Profile & Target Joint'}
                {currentStep === 2 && 'Dynamic Condition Deep-Dive'}
                {currentStep === 3 && 'Clinical Safety & Red Flags'}
                {currentStep === 4 && 'AI Prescribed Exercise Plan'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                {Math.round(((currentStep - 1) / 3) * 100)}% Complete
              </span>
            </div>
          </div>

          {/* Smooth Animated Multi-Layer Gradient Fill Bar */}
          <div className="relative w-full h-2.5 bg-stone-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-600 rounded-full transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${Math.max(10, ((currentStep - 1) / 3) * 100)}%` }}
            />
          </div>

          {/* Step Pill Indicators */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[
              { num: 1, label: 'Profile', icon: User, desc: 'Common Goals' },
              { num: 2, label: 'Deep Dive', icon: Target, desc: 'Condition' },
              { num: 3, label: 'Safety', icon: ShieldAlert, desc: 'Red Flags' },
              { num: 4, label: 'Plan', icon: Sparkles, desc: 'Prescription' },
            ].map((st) => {
              const Icon = st.icon;
              const isPast = currentStep > st.num;
              const isCurrent = currentStep === st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  disabled={st.num > currentStep}
                  onClick={() => setCurrentStep(st.num)}
                  className={`text-left p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 cursor-pointer active:scale-98 ${
                    isCurrent
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : isPast
                      ? 'bg-emerald-50/70 border-emerald-200 text-stone-800 hover:bg-emerald-100/60'
                      : 'bg-stone-50/50 border-stone-200/60 text-stone-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    {isPast ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <div className="text-[11px] font-bold truncate leading-tight">{st.label}</div>
                    <div className={`text-[10px] truncate ${isCurrent ? 'text-stone-300' : 'text-stone-400'}`}>
                      {st.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Multi-Step Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-16 flex flex-col justify-center">
        {/* ================= STEP 1: COMMON QUESTIONS ================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6 animate-fade-in">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wide border border-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Step 1 of 4 • Common Intake</span>
              </div>
              <h2 className="text-2xl font-bold text-stone-900 font-heading">
                Tell us about your physical profile
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                These core medical baseline questions ensure personalized and safe exercise calibration.
              </p>
            </div>

            <div className="space-y-6 pt-2 divide-y divide-stone-100">
              {/* 1. Full Name */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/60 p-4 rounded-2xl border border-stone-200/80">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                    <div className="h-6 w-6 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <span>1. What is your full name?</span>
                  </div>
                  <p className="text-xs text-stone-500">Personalizes your rehabilitation prescription & feedback</p>
                </div>
                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="e.g., Alex Johnson"
                    value={common.userName}
                    onChange={(e) => setCommon({ ...common, userName: e.target.value })}
                    className="w-full font-medium text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white shadow-2xs"
                  />
                </div>
              </div>

              {/* 2. Gender */}
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-stone-800">2. What is your gender?</label>
                    <p className="text-xs text-stone-500">Used for anatomical anthropometrics</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Male', 'Female', 'Other', 'Prefer not to say'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setCommon({ ...common, gender: g })}
                      className={`py-2.5 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                        common.gender === g
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-stone-50/80 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 & 4. Height & Weight (Biometrics) */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 3. Height */}
                <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-1.5">
                  <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                    <span>3. What is your height?</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={100}
                      max={250}
                      value={common.heightCm}
                      onChange={(e) =>
                        setCommon({ ...common, heightCm: parseInt(e.target.value) || 170 })
                      }
                      className="w-full font-mono font-bold text-sm px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                    <span className="text-xs text-stone-500 font-bold">cm</span>
                  </div>
                </div>

                {/* 4. Weight */}
                <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-1.5">
                  <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-stone-500" />
                    <span>4. What is your weight?</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={30}
                      max={250}
                      value={common.weightKg}
                      onChange={(e) =>
                        setCommon({ ...common, weightKg: parseInt(e.target.value) || 70 })
                      }
                      className="w-full font-mono font-bold text-sm px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                    <span className="text-xs text-stone-500 font-bold">kg</span>
                  </div>
                </div>

                {/* Age */}
                <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-1.5">
                  <label className="text-xs font-semibold text-stone-800">Age</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={12}
                      max={100}
                      value={common.age}
                      onChange={(e) => setCommon({ ...common, age: parseInt(e.target.value) || 25 })}
                      className="w-full font-mono font-bold text-sm px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                    <span className="text-xs text-stone-500 font-bold">years</span>
                  </div>
                </div>
              </div>

              {/* 5. Doctor/Physio Consultation */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-stone-200 bg-stone-50/40">
                <div className="space-y-0.5">
                  <label className="text-xs sm:text-sm font-semibold text-stone-900 flex items-center gap-1.5">
                    <Stethoscope className="h-4 w-4 text-emerald-600" />
                    <span>5. Have you consulted a doctor or physiotherapist for your current concern?</span>
                  </label>
                  <p className="text-xs text-stone-500">Helps calibrate clinical exercise baseline</p>
                </div>
                <div className="flex gap-2 w-full sm:w-48">
                  {(['Yes', 'No'] as YesNo[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCommon({ ...common, consultedDoctor: val })}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        common.consultedDoctor === val
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Medication affecting movement */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-stone-200 bg-stone-50/40">
                <div className="space-y-0.5">
                  <label className="text-xs sm:text-sm font-semibold text-stone-900 flex items-center gap-1.5">
                    <Pill className="h-4 w-4 text-amber-600" />
                    <span>6. Are you currently taking any medication that affects your movement or exercise ability?</span>
                  </label>
                  <p className="text-xs text-stone-500">e.g., muscle relaxants, pain modulators, blood pressure medications</p>
                </div>
                <div className="flex gap-2 w-full sm:w-60">
                  {(['Yes', 'No', 'Unsure'] as YesNoUnsure[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCommon({ ...common, takingMedication: val })}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        common.takingMedication === val
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Mobility Support */}
              <div className="pt-4 space-y-2">
                <div>
                  <label className="text-sm font-semibold text-stone-800">
                    7. Do you use any mobility support?
                  </label>
                  <p className="text-xs text-stone-500">Ensures we provide safe sitting/standing alternatives</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['None', 'Walking stick', 'Walker', 'Crutches', 'Other'] as MobilitySupport[]).map((sup) => (
                    <button
                      key={sup}
                      type="button"
                      onClick={() => setCommon({ ...common, mobilitySupport: sup })}
                      className={`py-2.5 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                        common.mobilitySupport === sup
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {sup}
                    </button>
                  ))}
                </div>
              </div>

              {/* 8. Exercise Tracking Device */}
              <div className="pt-4 space-y-2">
                <div>
                  <label className="text-sm font-semibold text-stone-800">
                    8. Which device will you use for exercise tracking?
                  </label>
                  <p className="text-xs text-stone-500">Optimizes camera viewport and computer vision framing</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'Laptop webcam', label: 'Laptop webcam', icon: Laptop, desc: 'Built-in camera' },
                    { id: 'Mobile phone', label: 'Mobile phone', icon: Smartphone, desc: 'Portrait / Landscape' },
                    { id: 'External webcam', label: 'External webcam', icon: Camera, desc: 'USB wide angle' },
                  ].map((dev) => {
                    const DevIcon = dev.icon;
                    const isSelected = common.trackingDevice === dev.id;
                    return (
                      <button
                        key={dev.id}
                        type="button"
                        onClick={() => setCommon({ ...common, trackingDevice: dev.id as TrackingDevice })}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-white text-stone-700 border border-stone-200'
                          }`}
                        >
                          <DevIcon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{dev.label}</div>
                          <div className={`text-[10px] ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                            {dev.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 9. Main Goal */}
              <div className="pt-4 space-y-2.5">
                <label className="text-sm font-semibold text-stone-800">9. What is your main goal?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      'Pain relief',
                      'Injury recovery',
                      'Post-surgery rehabilitation',
                      'Mobility',
                      'Flexibility',
                    ] as MainGoal[]
                  ).map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setCommon({ ...common, mainGoal: goal })}
                      className={`p-3 rounded-2xl text-xs font-medium border text-left transition-all cursor-pointer flex items-center justify-between ${
                        common.mainGoal === goal
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-stone-50/60 hover:bg-stone-100/80 text-stone-700 border-stone-200'
                      }`}
                    >
                      <span>{goal}</span>
                      {common.mainGoal === goal && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 10. Target Body Part */}
              <div className="pt-4 space-y-2.5">
                <label className="text-sm font-semibold text-stone-800">
                  10. Which body part do you want to target?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(
                    [
                      'Shoulder',
                      'Knee',
                      'Hip',
                      'Back',
                      'Legs',
                      'Arms',
                      'Multiple body parts',
                    ] as TargetBodyPart[]
                  ).map((part) => (
                    <button
                      key={part}
                      type="button"
                      onClick={() => setCommon({ ...common, targetBodyPart: part })}
                      className={`p-3 rounded-2xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                        common.targetBodyPart === part
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-stone-50/60 hover:bg-stone-100/80 text-stone-700 border-stone-200'
                      }`}
                    >
                      {part}
                    </button>
                  ))}
                </div>
              </div>

              {/* 11 & 12. Injury and Surgery */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/40 space-y-2">
                  <label className="text-xs font-semibold text-stone-800">
                    11. Do you currently have an injury or condition?
                  </label>
                  <div className="flex gap-2">
                    {(['Yes', 'No'] as YesNo[]).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCommon({ ...common, hasInjury: val })}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          common.hasInjury === val
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/40 space-y-2">
                  <label className="text-xs font-semibold text-stone-800">
                    12. Have you undergone surgery related to this?
                  </label>
                  <div className="flex gap-2">
                    {(['Yes', 'No'] as YesNo[]).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCommon({ ...common, hasSurgery: val })}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          common.hasSurgery === val
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 13. Pain Level Slider */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-stone-800">
                    13. What is your current pain level? (0–10)
                  </label>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${getPainColor(
                      common.painLevel
                    )}`}
                  >
                    {getPainDescriptor(common.painLevel)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={common.painLevel}
                  onChange={(e) => setCommon({ ...common, painLevel: parseInt(e.target.value) })}
                  className="w-full accent-stone-900 cursor-pointer h-2 bg-stone-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>0 (None)</span>
                  <span>3 (Mild)</span>
                  <span>5 (Moderate)</span>
                  <span>8 (Severe)</span>
                  <span>10 (Worst)</span>
                </div>
              </div>

              {/* 14, 15, 16, 17. Mobility & Daily Time */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 14. Movement Restrictions */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-800">
                    14. Doctor/Physio movement restrictions?
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Yes', 'No', 'Unsure'] as YesNoUnsure[]).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCommon({ ...common, hasRestrictions: val })}
                        className={`py-2 text-xs rounded-xl border font-medium cursor-pointer transition-all ${
                          common.hasRestrictions === val
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 15. Mobility Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-800">15. Mobility level?</label>
                  <select
                    value={common.mobilityLevel}
                    onChange={(e) =>
                      setCommon({ ...common, mobilityLevel: e.target.value as MobilityLevel })
                    }
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none cursor-pointer"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Mildly restricted">Mildly restricted</option>
                    <option value="Significantly restricted">Significantly restricted</option>
                    <option value="Unsure">Unsure</option>
                  </select>
                </div>

                {/* 16. Intensity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-800">
                    16. Approved exercise intensity?
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Low', 'Medium', 'High', 'Not sure'] as ApprovedIntensity[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setCommon({ ...common, approvedIntensity: lvl })}
                        className={`py-2 text-xs rounded-xl border font-medium cursor-pointer transition-all ${
                          common.approvedIntensity === lvl
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 17. Daily Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-800">
                    17. Daily exercise time available?
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['5–10', '10–20', '20–30'] as DailyExerciseTime[]).map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setCommon({ ...common, dailyTime: time })}
                        className={`py-2 text-xs rounded-xl border font-medium cursor-pointer transition-all ${
                          common.dailyTime === time
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {time} min
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-3 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-98"
              >
                <span>Continue to Dynamic Assessment</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: DYNAMIC QUESTIONS ================= */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6 animate-fade-in">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold uppercase tracking-wide border border-sky-200">
                <Target className="h-3.5 w-3.5" />
                <span>Step 2 of 4 • Tailored Dynamic Questions</span>
              </div>
              <h2 className="text-2xl font-bold text-stone-900 font-heading">
                Specific Condition Deep-Dive
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                These questions are customized dynamically based on your goal ({common.mainGoal}) and target body part ({common.targetBodyPart}).
              </p>
            </div>

            <div className="space-y-6 divide-y divide-stone-100">
              {/* DYNAMIC SECTION A: Injury Details (if common.hasInjury === 'Yes') */}
              {common.hasInjury === 'Yes' && (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>A. Injury & Medical Condition Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">Name / type of injury:</label>
                      <input
                        type="text"
                        value={dynamic.injury?.injuryName || ''}
                        onChange={(e) =>
                          setDynamic({
                            ...dynamic,
                            injury: { ...dynamic.injury!, injuryName: e.target.value },
                          })
                        }
                        placeholder="e.g., Patellar tendonitis, Meniscus tear"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">When did it occur?</label>
                      <select
                        value={dynamic.injury?.injuryTimeline || 'Within the last month'}
                        onChange={(e) =>
                          setDynamic({
                            ...dynamic,
                            injury: {
                              ...dynamic.injury!,
                              injuryTimeline: e.target.value as any,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none bg-stone-50"
                      >
                        <option value="Recently">Recently</option>
                        <option value="Within the last month">Within the last month</option>
                        <option value="More than a month ago">More than a month ago</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Which movements cause discomfort?
                      </label>
                      <input
                        type="text"
                        value={dynamic.injury?.discomfortMovements || ''}
                        onChange={(e) =>
                          setDynamic({
                            ...dynamic,
                            injury: { ...dynamic.injury!, discomfortMovements: e.target.value },
                          })
                        }
                        placeholder="e.g., Stairs, deep bending"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Assessed by healthcare professional?
                      </label>
                      <div className="flex gap-2 pt-1">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                injury: { ...dynamic.injury!, assessedByProfessional: val },
                              })
                            }
                            className={`flex-1 py-1.5 rounded-lg border font-medium ${
                              dynamic.injury?.assessedByProfessional === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC SECTION B: Surgery Details (if common.hasSurgery === 'Yes' or Goal is Post-surgery) */}
              {(common.hasSurgery === 'Yes' || common.mainGoal === 'Post-surgery rehabilitation') && (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>B. Post-Surgery Rehabilitation Specifics</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">Type of surgery:</label>
                      <input
                        type="text"
                        value={dynamic.surgery?.surgeryType || ''}
                        onChange={(e) =>
                          setDynamic({
                            ...dynamic,
                            surgery: { ...dynamic.surgery!, surgeryType: e.target.value },
                          })
                        }
                        placeholder="e.g., Arthroscopy, ACL reconstruction"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">When was surgery performed?</label>
                      <select
                        value={dynamic.surgery?.surgeryTimeline || '3–6 months ago'}
                        onChange={(e) =>
                          setDynamic({
                            ...dynamic,
                            surgery: {
                              ...dynamic.surgery!,
                              surgeryTimeline: e.target.value as any,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none bg-stone-50"
                      >
                        <option value="Recently (< 1 month)">Recently (&lt; 1 month)</option>
                        <option value="1–3 months ago">1–3 months ago</option>
                        <option value="3–6 months ago">3–6 months ago</option>
                        <option value="> 6 months ago">&gt; 6 months ago</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Clearance from doctor/physio to exercise?
                      </label>
                      <div className="flex gap-2 pt-1">
                        {(['Yes', 'No', 'Unsure'] as YesNoUnsure[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                surgery: { ...dynamic.surgery!, hasClearance: val },
                              })
                            }
                            className={`flex-1 py-1.5 rounded-lg border font-medium ${
                              dynamic.surgery?.hasClearance === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC SECTION C: Shoulder (if common.targetBodyPart === 'Shoulder') */}
              {common.targetBodyPart === 'Shoulder' && (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>C. Shoulder Kinematic Assessment</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">Which side is affected?</label>
                      <div className="flex gap-2">
                        {(['Left', 'Right', 'Both'] as const).map((side) => (
                          <button
                            key={side}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                shoulder: { ...dynamic.shoulder!, side },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.shoulder?.side === side
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {side}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Difficulty raising arm overhead?
                      </label>
                      <div className="flex gap-2">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                shoulder: { ...dynamic.shoulder!, difficultyOverhead: val },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.shoulder?.difficultyOverhead === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">Pain while rotating arm?</label>
                      <div className="flex gap-2">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                shoulder: { ...dynamic.shoulder!, painOnRotation: val },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.shoulder?.painOnRotation === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Can you raise arm without assistance?
                      </label>
                      <div className="flex gap-2">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                shoulder: { ...dynamic.shoulder!, canRaiseWithoutAssistance: val },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.shoulder?.canRaiseWithoutAssistance === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC SECTION D: Knee (if common.targetBodyPart === 'Knee') */}
              {common.targetBodyPart === 'Knee' && (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>D. Knee Joint Functional Assessment</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">Which knee is affected?</label>
                      <div className="flex gap-2">
                        {(['Left', 'Right', 'Both'] as const).map((side) => (
                          <button
                            key={side}
                            type="button"
                            onClick={() =>
                              setDynamic({ ...dynamic, knee: { ...dynamic.knee!, side } })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.knee?.side === side
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {side}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Difficulty bending or straightening knee?
                      </label>
                      <div className="flex gap-2">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                knee: { ...dynamic.knee!, difficultyBendingStraightening: val },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.knee?.difficultyBendingStraightening === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">Can you walk comfortably?</label>
                      <div className="flex gap-2">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                knee: { ...dynamic.knee!, canWalkComfortably: val },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.knee?.canWalkComfortably === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Pain while climbing stairs or standing up?
                      </label>
                      <div className="flex gap-2">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                knee: { ...dynamic.knee!, painOnStairsOrStanding: val },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.knee?.painOnStairsOrStanding === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC SECTION E: Back (if common.targetBodyPart === 'Back') */}
              {common.targetBodyPart === 'Back' && (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>E. Spine & Back Postural Assessment</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">Where is the discomfort?</label>
                      <select
                        value={dynamic.back?.location || 'Lower back'}
                        onChange={(e) =>
                          setDynamic({
                            ...dynamic,
                            back: { ...dynamic.back!, location: e.target.value as any },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50"
                      >
                        <option value="Upper back">Upper back</option>
                        <option value="Lower back">Lower back</option>
                        <option value="Entire back">Entire back</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Does bending forward cause discomfort?
                      </label>
                      <div className="flex gap-2">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                back: { ...dynamic.back!, painOnBendingForward: val },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.back?.painOnBendingForward === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Does twisting your body cause discomfort?
                      </label>
                      <div className="flex gap-2">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                back: { ...dynamic.back!, painOnTwisting: val },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.back?.painOnTwisting === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Does the pain spread to arms or legs?
                      </label>
                      <div className="flex gap-2">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                back: { ...dynamic.back!, painSpreadsToLimbs: val },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.back?.painSpreadsToLimbs === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC SECTION F: Hip or Legs */}
              {(common.targetBodyPart === 'Hip' || common.targetBodyPart === 'Legs') && (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>F. Hip & Lower Extremity Assessment</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">Which side is affected?</label>
                      <div className="flex gap-2">
                        {(['Left', 'Right', 'Both'] as const).map((side) => (
                          <button
                            key={side}
                            type="button"
                            onClick={() =>
                              setDynamic({ ...dynamic, hipLeg: { ...dynamic.hipLeg!, side } })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.hipLeg?.side === side
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {side}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Difficulty walking or standing?
                      </label>
                      <div className="flex gap-2">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                hipLeg: { ...dynamic.hipLeg!, difficultyWalkingStanding: val },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.hipLeg?.difficultyWalkingStanding === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">Can you lift leg comfortably?</label>
                      <div className="flex gap-2">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                hipLeg: { ...dynamic.hipLeg!, canLiftLegComfortably: val },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.hipLeg?.canLiftLegComfortably === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Difficulty maintaining balance?
                      </label>
                      <div className="flex gap-2">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                hipLeg: { ...dynamic.hipLeg!, difficultyMaintainingBalance: val },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.hipLeg?.difficultyMaintainingBalance === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC SECTION G: Arms */}
              {common.targetBodyPart === 'Arms' && (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>G. Upper Limb Functional Assessment</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">Which arm is affected?</label>
                      <div className="flex gap-2">
                        {(['Left', 'Right', 'Both'] as const).map((side) => (
                          <button
                            key={side}
                            type="button"
                            onClick={() =>
                              setDynamic({ ...dynamic, arms: { ...dynamic.arms!, side } })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.arms?.side === side
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {side}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Discomfort when bending elbow?
                      </label>
                      <div className="flex gap-2">
                        {(['Yes', 'No'] as YesNo[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setDynamic({
                                ...dynamic,
                                arms: { ...dynamic.arms!, discomfortBendingElbow: val },
                              })
                            }
                            className={`flex-1 py-2 rounded-lg border font-medium ${
                              dynamic.arms?.discomfortBendingElbow === val
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC SECTION H: Multiple Body Parts */}
              {common.targetBodyPart === 'Multiple body parts' && (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>H. Multiple Body Parts Assessment</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Which body part is your main priority?
                      </label>
                      <select
                        value={dynamic.multiple?.mainPriority || 'Knee'}
                        onChange={(e) =>
                          setDynamic({
                            ...dynamic,
                            multiple: { ...dynamic.multiple!, mainPriority: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50"
                      >
                        <option value="Knee">Knee</option>
                        <option value="Shoulder">Shoulder</option>
                        <option value="Hip">Hip</option>
                        <option value="Back">Back</option>
                        <option value="Arms">Arms</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Related to same injury or different conditions?
                      </label>
                      <select
                        value={dynamic.multiple?.sameOrDifferentCondition || 'Same injury'}
                        onChange={(e) =>
                          setDynamic({
                            ...dynamic,
                            multiple: {
                              ...dynamic.multiple!,
                              sameOrDifferentCondition: e.target.value as any,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50"
                      >
                        <option value="Same injury">Same injury</option>
                        <option value="Different conditions">Different conditions</option>
                        <option value="Unsure">Unsure</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC SECTION I: Mobility or Flexibility Goal */}
              {(common.mainGoal === 'Mobility' || common.mainGoal === 'Flexibility') && (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>I. Mobility & Flexibility Focus</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">
                        Which movement do you want to improve?
                      </label>
                      <input
                        type="text"
                        value={dynamic.mobility?.movementToImprove || ''}
                        onChange={(e) =>
                          setDynamic({
                            ...dynamic,
                            mobility: { ...dynamic.mobility!, movementToImprove: e.target.value },
                          })
                        }
                        placeholder="e.g., Deep squat, overhead reach"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700">Limitation cause?</label>
                      <select
                        value={dynamic.mobility?.limitationCause || 'General mobility concern'}
                        onChange={(e) =>
                          setDynamic({
                            ...dynamic,
                            mobility: {
                              ...dynamic.mobility!,
                              limitationCause: e.target.value as any,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50"
                      >
                        <option value="General mobility concern">General mobility concern</option>
                        <option value="Caused by injury">Caused by injury</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 Actions */}
            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-2.5 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="py-3 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-98"
              >
                <span>Proceed to Safety Check</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SAFETY CHECK ================= */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6 animate-fade-in">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-semibold uppercase tracking-wide border border-rose-200">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                <span>Step 3 of 4 • Clinical Safety Screen</span>
              </div>
              <h2 className="text-2xl font-bold text-stone-900 font-heading">
                Safety Overrides & Red Flags
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Before generating an exercise plan, our AI system checks for symptoms requiring mandatory clinician review.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Red Flag 1 */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-stone-900">
                    1. Are you experiencing sudden or severe acute pain?
                  </h4>
                  <p className="text-xs text-stone-500">Sudden sharp pain may indicate tissue tear</p>
                </div>
                <div className="flex gap-2">
                  {(['Yes', 'No'] as YesNo[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSafety({ ...safety, suddenSeverePain: val })}
                      className={`px-5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        safety.suddenSeverePain === val
                          ? val === 'Yes'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Red Flag 2 */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-stone-900">
                    2. New numbness, unusual weakness, or balance loss?
                  </h4>
                  <p className="text-xs text-stone-500">Neurological compression screening</p>
                </div>
                <div className="flex gap-2">
                  {(['Yes', 'No'] as YesNo[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSafety({ ...safety, newNumbnessWeaknessOrBalanceLoss: val })}
                      className={`px-5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        safety.newNumbnessWeaknessOrBalanceLoss === val
                          ? val === 'Yes'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Red Flag 3 */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-stone-900">
                    3. Have you been told not to exercise or move the area?
                  </h4>
                  <p className="text-xs text-stone-500">Clinician contraindication check</p>
                </div>
                <div className="flex gap-2">
                  {(['Yes', 'No'] as YesNo[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSafety({ ...safety, toldNotToExercise: val })}
                      className={`px-5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        safety.toldNotToExercise === val
                          ? val === 'Yes'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning note if any red flag is active */}
              {(safety.suddenSeverePain === 'Yes' ||
                safety.newNumbnessWeaknessOrBalanceLoss === 'Yes' ||
                safety.toldNotToExercise === 'Yes') && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Medical Assessment Required</p>
                    <p className="text-rose-700 leading-relaxed">
                      You indicated symptoms that require medical clearance. The AI coach will place autonomous exercise on hold and provide safe clinician guidance.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3 Actions */}
            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-2.5 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToPlan}
                className="py-3 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-98"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>Generate Recommended Plan</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: AI RECOMMENDED PLAN (EDITABLE) ================= */}
        {currentStep === 4 && plan && (
          <div className="space-y-6 animate-fade-in">
            {/* Clinician Hold Warning if Red Flags Tripped */}
            {plan.isClinicianHold ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm space-y-5 text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <h3 className="text-2xl font-bold text-stone-900 font-heading">
                    Exercise Temporarily Paused
                  </h3>
                  <p className="text-xs sm:text-sm text-rose-700 font-medium">
                    {plan.clinicianHoldReason}
                  </p>
                  <p className="text-xs text-stone-500">
                    We recommend consulting a licensed physiotherapist or orthopedic physician before performing tracking workouts.
                  </p>
                </div>

                <div className="max-w-md mx-auto bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left text-xs space-y-2">
                  <p className="font-semibold text-stone-800">Clinical Recommendations:</p>
                  <ul className="list-disc pl-4 space-y-1 text-stone-600">
                    {plan.precautions.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="py-2.5 px-5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    Review Answers
                  </button>
                  <button
                    onClick={() => {
                      // Override if user asserts they have doctor approval
                      setSafety({
                        suddenSeverePain: 'No',
                        newNumbnessWeaknessOrBalanceLoss: 'No',
                        toldNotToExercise: 'No',
                      });
                      handleProceedToPlan();
                    }}
                    className="py-2.5 px-5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-all cursor-pointer"
                  >
                    I Have Physician Clearance →
                  </button>
                </div>
              </div>
            ) : (
              /* Approved Personalized Plan Card */
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
                {/* Plan Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wide border border-emerald-200">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        <span>AI Prescribed • Fully Editable</span>
                      </div>
                      {plan.userName && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold uppercase tracking-wide border border-stone-200">
                          <User className="h-3.5 w-3.5 text-stone-500" />
                          <span>Patient: {plan.userName}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900 font-heading">{plan.title}</h3>
                    <p className="text-xs text-stone-500 max-w-xl leading-relaxed">
                      {plan.rationale}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-xs font-mono font-semibold text-stone-700 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-stone-500" />
                      <span>~{plan.estimatedMinutes} mins</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-800 flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{plan.intensity} PACE</span>
                    </div>
                  </div>
                </div>

                {/* Editable Exercises Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                      Prescribed Exercises ({plan.exercises.filter((e) => e.enabled).length} Active)
                    </h4>
                    <span className="text-xs text-stone-400 font-medium">Click +/- to edit reps/sets</span>
                  </div>

                  <div className="space-y-3">
                    {plan.exercises.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedExerciseId(item.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          selectedExerciseId === item.id
                            ? 'border-stone-900 ring-2 ring-stone-900/10 bg-stone-50/60'
                            : 'border-stone-200/80 bg-white hover:border-stone-300'
                        } ${!item.enabled ? 'opacity-50' : ''}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.enabled}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleExerciseEnabled(item.id);
                                }}
                                className="w-4 h-4 rounded text-stone-900 accent-stone-900 cursor-pointer"
                              />
                              <h5 className="font-bold text-stone-900 text-sm font-heading">
                                {item.name}
                              </h5>
                              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                                {item.targetArea}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 pl-6 leading-relaxed">
                              {item.reason}
                            </p>
                          </div>

                          {/* Editable Controls */}
                          <div
                            className="flex items-center gap-3 pl-6 sm:pl-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Reps */}
                            <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-2 py-1 rounded-xl shadow-2xs">
                              <button
                                onClick={() => updateExerciseReps(item.id, -1)}
                                className="w-5 h-5 rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200 flex items-center justify-center text-xs font-bold"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold font-mono text-stone-900 w-12 text-center">
                                {item.targetReps} reps
                              </span>
                              <button
                                onClick={() => updateExerciseReps(item.id, 1)}
                                className="w-5 h-5 rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200 flex items-center justify-center text-xs font-bold"
                              >
                                +
                              </button>
                            </div>

                            {/* Sets */}
                            <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-2 py-1 rounded-xl shadow-2xs">
                              <button
                                onClick={() => updateExerciseSets(item.id, -1)}
                                className="w-5 h-5 rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200 flex items-center justify-center text-xs font-bold"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold font-mono text-stone-900 w-12 text-center">
                                {item.sets} sets
                              </span>
                              <button
                                onClick={() => updateExerciseSets(item.id, 1)}
                                className="w-5 h-5 rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200 flex items-center justify-center text-xs font-bold"
                              >
                                +
                              </button>
                            </div>

                            {/* Intensity Selector */}
                            <select
                              value={item.intensity}
                              onChange={(e) =>
                                updateExerciseIntensity(item.id, e.target.value as IntensityLevel)
                              }
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none cursor-pointer"
                            >
                              <option value="LOW">Low</option>
                              <option value="MEDIUM">Med</option>
                              <option value="HIGH">High</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Auxiliary Exercise Quick Add */}
                <div className="pt-2">
                  <div className="text-xs font-semibold text-stone-600 mb-2">
                    + Add other prototype exercises to this session:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'squat', name: 'Squats' },
                      { id: 'knee_extension', name: 'Knee Extensions' },
                      { id: 'straight_leg_raise', name: 'Straight Leg Raises' },
                      { id: 'bicycle_exercise', name: 'Bicycle Leg Cycles' },
                      { id: 'shoulder_raise', name: 'Shoulder Raises' },
                      { id: 'arm_curl', name: 'Bicep Curls' },
                    ]
                      .filter((ex) => !plan.exercises.some((e) => e.id === ex.id))
                      .map((ex) => (
                        <button
                          key={ex.id}
                          onClick={() => addLibraryExercise(ex.id)}
                          className="px-3 py-1.5 rounded-xl border border-dashed border-stone-300 text-xs font-medium text-stone-600 hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          <span>{ex.name}</span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Precautions Footer */}
                {plan.precautions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-[11px]">
                      <Info className="h-3.5 w-3.5 text-amber-600" />
                      <span>Clinical Safety Precautions:</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-amber-800">
                      {plan.precautions.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Final Launch Actions */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="py-2.5 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Intake Answers</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCompletePlan(plan, selectedExerciseId)}
                    className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
                  >
                    <Play className="h-4 w-4 fill-current text-emerald-400" />
                    <span>Start Rehabilitation Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
