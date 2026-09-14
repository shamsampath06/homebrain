import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { ShieldAlert, AlertTriangle, MapPin, Send, CheckCircle2, X, PhoneCall } from 'lucide-react';

export const EmergencyModeModal: React.FC = () => {
  const { emergencyContacts, triggerEmergencyAlert, setActiveSubScreen } = useHomeBrain();
  const [step, setStep] = useState<'explain' | 'confirm' | 'sending' | 'sent'>('explain');
  const [userLocation, setUserLocation] = useState<string>('Home Residence - 742 Evergreen Terrace (San Francisco, CA)');
  const [isLocating, setIsLocating] = useState(false);

  const handleFetchLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserLocation(`Live GPS: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° W (Accuracy: ~10m)`);
          setIsLocating(false);
          setStep('confirm');
        },
        err => {
          // Fallback location on permission deny/unsupported
          setUserLocation('Home Residence - Master Bedroom WiFi Network');
          setIsLocating(false);
          setStep('confirm');
        }
      );
    } else {
      setIsLocating(false);
      setStep('confirm');
    }
  };

  const handleExecuteSOS = async () => {
    setStep('sending');
    await new Promise(r => setTimeout(r, 1500));
    await triggerEmergencyAlert(userLocation);
    setStep('sent');
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border-2 border-rose-500/50">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-rose-950">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-lg">
          <ShieldAlert className="w-6 h-6 animate-pulse" /> Emergency Mode SOS
        </div>
        <button
          onClick={() => setActiveSubScreen('none')}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {step === 'explain' && (
        <div className="space-y-4 mt-4">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
            <p className="font-bold text-sm mb-1">🚨 Safety Confirmation Step</p>
            Emergency SOS sends your current GPS location and emergency notification to your designated family contacts and physician.
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Designated Emergency Contacts:</h4>
            <div className="space-y-2">
              {emergencyContacts.map(c => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                    <p className="text-slate-500">{c.relation} • {c.phone}</p>
                  </div>
                  {c.isPrimary && (
                    <span className="text-[10px] font-extrabold text-rose-600 uppercase px-2 py-0.5 bg-rose-100 dark:bg-rose-950 rounded-full">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveSubScreen('none')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:underline"
            >
              Cancel
            </button>
            <button
              onClick={handleFetchLocation}
              disabled={isLocating}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30"
            >
              <MapPin className="w-4 h-4" /> {isLocating ? 'Acquiring GPS...' : 'Proceed to Send SOS'}
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4 mt-4 text-center py-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Confirm Emergency SOS Dispatch?</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Location payload ready: <span className="font-semibold text-slate-800 dark:text-slate-200">{userLocation}</span>
          </p>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setActiveSubScreen('none')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel / Safe Exit
            </button>
            <button
              onClick={handleExecuteSOS}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-xl shadow-rose-600/40"
            >
              CONFIRM EMERGENCY ALERT 🚨
            </button>
          </div>
        </div>
      )}

      {step === 'sending' && (
        <div className="text-center py-12 space-y-4">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-rose-600">Broadcasting Emergency Alert & Location...</p>
        </div>
      )}

      {step === 'sent' && (
        <div className="text-center py-8 space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Emergency Alert Dispatched Successfully!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Emergency alert broadcast to {emergencyContacts.length} family contacts.
          </p>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-200 font-semibold">
            Location sent: {userLocation}
          </div>
          <button
            onClick={() => setActiveSubScreen('none')}
            className="mt-4 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            Close Emergency Panel
          </button>
        </div>
      )}
    </div>
  );
};
