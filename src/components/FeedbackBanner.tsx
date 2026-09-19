import React from 'react';
import { FeedbackMessage } from '../types/session';
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

interface FeedbackBannerProps {
  feedback: FeedbackMessage;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ feedback }) => {
  const getBannerStyle = () => {
    switch (feedback.type) {
      case 'GOOD':
        return {
          bg: 'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-xs',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />,
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-50/95 border-amber-200 text-amber-900 shadow-xs',
          icon: <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0" />,
        };
      case 'ERROR':
        return {
          bg: 'bg-rose-50/95 border-rose-200 text-rose-900 shadow-xs animate-bounce',
          icon: <AlertCircle className="h-5 w-5 text-rose-700 shrink-0" />,
        };
      case 'INSTRUCTION':
      default:
        return {
          bg: 'bg-white/95 border-stone-200/90 text-stone-800 shadow-xs',
          icon: <Sparkles className="h-5 w-5 text-stone-500 shrink-0" />,
        };
    }
  };

  const style = getBannerStyle();

  return (
    <div className="w-full max-w-xl mx-auto pointer-events-auto transition-all duration-200">
      <div
        className={`px-5 py-3 rounded-2xl border backdrop-blur-md flex items-center justify-center gap-3 ${style.bg}`}
      >
        {style.icon}
        <div className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-center">
          {feedback.text}
        </div>
      </div>
    </div>
  );
};
