import React, { useState } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { IntakeAssessment } from './components/intake/IntakeAssessment';
import { ExerciseSession } from './pages/ExerciseSession';
import { RecommendedExercisePlan } from './types/intake';

type AppView = 'landing' | 'intake' | 'exercise';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [patientName, setPatientName] = useState<string>('Alex Johnson');
  const [patientEmail, setPatientEmail] = useState<string>('alex.johnson@example.com');

  const [currentPlan, setCurrentPlan] = useState<RecommendedExercisePlan | null>(null);
  const [initialExerciseId, setInitialExerciseId] = useState<string>('squat');

  const handleOpenAuth = (mode: 'signup' | 'login' = 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (name: string, email: string) => {
    setPatientName(name);
    setPatientEmail(email);
    setIsAuthOpen(false);
    setCurrentView('intake');
  };

  const handleCompletePlan = (plan: RecommendedExercisePlan, startingExerciseId: string) => {
    setCurrentPlan(plan);
    setInitialExerciseId(startingExerciseId);
    setCurrentView('exercise');
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans selection:bg-stone-200 selection:text-stone-900">
      {/* 1. Landing Page View */}
      {currentView === 'landing' && (
        <div className="animate-fade-in">
          <LandingPage
            onStartIntake={() => setCurrentView('intake')}
            onOpenAuth={handleOpenAuth}
            onDirectStartWorkout={(exerciseId) => {
              setInitialExerciseId(exerciseId);
              setCurrentView('exercise');
            }}
            userName={patientName}
          />
        </div>
      )}

      {/* 2. Intake Assessment View (After Sign Up / Get Started) */}
      {currentView === 'intake' && (
        <div className="animate-fade-in">
          <IntakeAssessment
            initialUserName={patientName}
            onCompletePlan={handleCompletePlan}
            onBackToHome={() => setCurrentView('landing')}
            onSkip={() => setCurrentView('exercise')}
          />
        </div>
      )}

      {/* 3. Live AI Exercise Session View */}
      {currentView === 'exercise' && (
        <div className="animate-fade-in">
          <ExerciseSession
            plan={currentPlan}
            initialExerciseId={initialExerciseId}
            onOpenAssessment={() => setCurrentView('intake')}
          />
        </div>
      )}

      {/* Auth / Sign Up Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default App;
