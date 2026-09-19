import React from 'react';
import { Camera, ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';

interface PermissionModalProps {
  permissionState: 'prompt' | 'granted' | 'denied' | 'error';
  errorMessage: string;
  onAllowCamera: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  permissionState,
  errorMessage,
  onAllowCamera,
}) => {
  if (permissionState === 'granted') return null;

  const isDenied = permissionState === 'denied';
  const isError = permissionState === 'error';

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 text-center space-y-5 border border-stone-200/90 shadow-xl">
        {/* Icon */}
        <div className="mx-auto h-14 w-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700">
          {isDenied ? (
            <ShieldAlert className="h-7 w-7 text-rose-600" />
          ) : isError ? (
            <AlertCircle className="h-7 w-7 text-amber-600" />
          ) : (
            <Camera className="h-7 w-7 text-stone-800" />
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-stone-900 font-heading">
            {isDenied
              ? 'Camera Access Blocked'
              : isError
              ? 'Camera Connection Error'
              : 'Enable Camera Guidance'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            {isDenied || isError
              ? errorMessage || 'Unable to connect to camera device.'
              : 'Camera access is required for real-time joint tracking and posture feedback.'}
          </p>
        </div>

        {/* Browser Permission Reset Guide if Blocked */}
        {isDenied && (
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-left text-xs text-stone-600 space-y-1.5">
            <p className="font-semibold text-stone-800">To enable camera access:</p>
            <ol className="list-decimal pl-4 space-y-1 text-stone-500">
              <li>Click the lock/camera icon in your address bar.</li>
              <li>Set <span className="text-stone-800 font-medium">Camera access</span> to "Allow".</li>
              <li>Click "Retry Access" below.</li>
            </ol>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onAllowCamera}
          className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm bg-stone-900 hover:bg-stone-800 text-white shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{isDenied ? 'Retry Access' : 'Allow Camera'}</span>
        </button>

        <p className="text-[11px] text-stone-400 font-mono">
          🔒 Purely on-device processing. No video streams are saved or uploaded.
        </p>
      </div>
    </div>
  );
};
