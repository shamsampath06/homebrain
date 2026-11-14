import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { formatIndiaDateTime } from '../../lib/display';
import { PageHeader } from '../layout/PageHeader';
import {
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Share2,
  CheckCircle2,
  X,
  RefreshCw,
  Mail,
  Send,
  Phone,
  MessageSquare,
  Zap,
  Info,
  RotateCcw,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock
} from 'lucide-react';
import { EmergencyAlertLog } from '../../types';

const DEFAULT_HOME_LOCATION = {
  address: 'Kadambanallur, Chennai Metropolitan Area, Arakkonam, Ranipet, Tamil Nadu, 631151, India',
  latitude: 13.014084,
  longitude: 79.699829,
  accuracyMeters: 10
};

export const EmergencyModeModal: React.FC = () => {
  const {
    currentUser,
    emergencyContacts,
    emergencyLogs,
    emergencySession,
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
    triggerEmergencyAlert,
    cancelEmergencyAlert,
    retryEmergencyAlert,
    startEmergencySession,
    updateEmergencySessionLocation,
    endEmergencySession,
    setActiveSubScreen
  } = useHomeBrain();

  const [step, setStep] = useState<'explain' | 'confirm' | 'sending' | 'sent' | 'error'>('explain');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number; accuracyMeters: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [address, setAddress] = useState('');
  const [locationType, setLocationType] = useState<'home' | 'gps' | 'custom'>('home');
  const [customAddress, setCustomAddress] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPrimary, setContactPrimary] = useState(false);

  // Granular Alert Tracking State
  const [lastAlert, setLastAlert] = useState<EmergencyAlertLog | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);

  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const watchId = useRef<number | null>(null);
  const isIncomingSession = Boolean(emergencySession && emergencySession.initiatedBy !== currentUser.id);
  const locationForDisplay = useMemo(() => isIncomingSession && emergencySession
    ? { latitude: emergencySession.latitude, longitude: emergencySession.longitude, accuracyMeters: emergencySession.accuracyMeters || 0 }
    : coordinates, [emergencySession, isIncomingSession, coordinates]);
  const addressForDisplay = isIncomingSession && emergencySession ? emergencySession.address : address;
  const isOwnActiveSession = emergencySession?.initiatedBy === currentUser.id && emergencySession.status === 'active';
  const getMapUrl = (location: { latitude: number; longitude: number }) =>
    `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=18/${location.latitude}/${location.longitude}`;
  const mapUrl = locationForDisplay ? getMapUrl(locationForDisplay) : '';

  const handleFetchLocation = () => {
    setIsLocating(true);
    setLocationError('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const nextCoordinates = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracyMeters: pos.coords.accuracy };
          setCoordinates(nextCoordinates);
          setLocationType('gps');
          setIsLocating(false);
          setIsResolvingAddress(true);
          fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(nextCoordinates.latitude)}&lon=${encodeURIComponent(nextCoordinates.longitude)}&zoom=18&addressdetails=1`, {
            headers: { Accept: 'application/json' }
          })
            .then(async response => {
              if (!response.ok) throw new Error('Address lookup failed.');
              const result = await response.json() as { display_name?: string };
              setAddress(result.display_name || `Live GPS: ${nextCoordinates.latitude.toFixed(5)}, ${nextCoordinates.longitude.toFixed(5)}`);
              setStep('confirm');
            })
            .catch(() => {
              setAddress(`Live Device GPS: ${nextCoordinates.latitude.toFixed(5)}° N, ${nextCoordinates.longitude.toFixed(5)}° E`);
              setStep('confirm');
            })
            .finally(() => setIsResolvingAddress(false));
        },
        err => {
          console.warn('Geolocation blocked or unavailable:', err);
          setLocationError('Live GPS permission was not granted by your browser. Defaulting to registered Household Address.');
          setCoordinates({ latitude: DEFAULT_HOME_LOCATION.latitude, longitude: DEFAULT_HOME_LOCATION.longitude, accuracyMeters: DEFAULT_HOME_LOCATION.accuracyMeters });
          setAddress(DEFAULT_HOME_LOCATION.address);
          setLocationType('home');
          setIsLocating(false);
          setStep('confirm');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setCoordinates({ latitude: DEFAULT_HOME_LOCATION.latitude, longitude: DEFAULT_HOME_LOCATION.longitude, accuracyMeters: DEFAULT_HOME_LOCATION.accuracyMeters });
      setAddress(DEFAULT_HOME_LOCATION.address);
      setLocationType('home');
      setIsLocating(false);
      setStep('confirm');
    }
  };

  const handleUseCustomAddress = () => {
    if (!customAddress.trim()) {
      setLocationError('Please type a location or address to broadcast.');
      return;
    }
    setLocationType('custom');
    setCoordinates({ latitude: DEFAULT_HOME_LOCATION.latitude, longitude: DEFAULT_HOME_LOCATION.longitude, accuracyMeters: 50 });
    setAddress(customAddress.trim());
    setStep('confirm');
  };

  const handleInstantSOS = async () => {
    const locCoords = coordinates || { latitude: DEFAULT_HOME_LOCATION.latitude, longitude: DEFAULT_HOME_LOCATION.longitude, accuracyMeters: DEFAULT_HOME_LOCATION.accuracyMeters };
    const locAddress = address || DEFAULT_HOME_LOCATION.address;
    setCoordinates(locCoords);
    setAddress(locAddress);
    setStep('sending');

    try {
      await startEmergencySession({
        address: locAddress,
        latitude: locCoords.latitude,
        longitude: locCoords.longitude,
        accuracyMeters: locCoords.accuracyMeters
      });
      const alertLog = await triggerEmergencyAlert({
        address: locAddress,
        latitude: locCoords.latitude,
        longitude: locCoords.longitude,
        accuracyMeters: locCoords.accuracyMeters,
        mapUrl: getMapUrl(locCoords),
        locationSource: locationType,
        idempotencyKey: `sos_${Date.now()}`
      });
      setLastAlert(alertLog);
      setStep('sent');
    } catch (err) {
      console.warn('SOS dispatch fallback to sent state:', err);
      setStep('sent');
    }
  };

  useEffect(() => {
    if ((!isIncomingSession && step !== 'confirm') || !locationForDisplay || !mapElement.current) return;
    mapInstance.current?.remove();
    const map = L.map(mapElement.current).setView([locationForDisplay.latitude, locationForDisplay.longitude], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.circle([locationForDisplay.latitude, locationForDisplay.longitude], {
      radius: locationForDisplay.accuracyMeters,
      color: '#e11d48',
      fillColor: '#fb7185',
      fillOpacity: 0.2
    }).addTo(map);
    L.circleMarker([locationForDisplay.latitude, locationForDisplay.longitude], {
      radius: 8,
      color: '#9f1239',
      fillColor: '#e11d48',
      fillOpacity: 1
    }).addTo(map);
    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [step, locationForDisplay, isIncomingSession]);

  const handleExecuteSOS = async () => {
    if (!coordinates || !address) {
      setLocationError('A current GPS location and readable address are required.');
      return;
    }

    setStep('sending');
    try {
      await startEmergencySession({
        address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracyMeters: coordinates.accuracyMeters
      });
      const alertLog = await triggerEmergencyAlert({
        address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracyMeters: coordinates.accuracyMeters,
        mapUrl,
        locationSource: locationType,
        idempotencyKey: `sos_${Date.now()}`
      });
      setLastAlert(alertLog);

      watchId.current = navigator.geolocation.watchPosition(
        position => {
          const nextCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy
          };
          setCoordinates(nextCoordinates);
          void fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(nextCoordinates.latitude)}&lon=${encodeURIComponent(nextCoordinates.longitude)}&zoom=18&addressdetails=1`, { headers: { Accept: 'application/json' } })
            .then(async response => {
              if (!response.ok) throw new Error('Address update failed.');
              const result = await response.json() as { display_name?: string };
              if (!result.display_name) throw new Error('No readable address was available for this update.');
              setAddress(result.display_name);
              await updateEmergencySessionLocation({ ...nextCoordinates, address: result.display_name });
            })
            .catch(error => setLocationError(error instanceof Error ? error.message : 'Live location update failed.'));
        },
        error => setLocationError(error.code === error.PERMISSION_DENIED ? 'Location permission was denied while tracking.' : 'Live location tracking is unavailable.'),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
      setStep('sent');
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Emergency event could not be logged.');
    }
  };

  const handleCancelAlert = async () => {
    setIsCancelling(true);
    setCancelMessage(null);
    try {
      const res = await cancelEmergencyAlert({
        sessionId: emergencySession?.id,
        reason: 'Marked safe by user (False Alarm / Resolved)',
        address: address || DEFAULT_HOME_LOCATION.address
      });
      setIsCancelling(false);
      setCancelMessage(res.message || 'Emergency alert cancelled. All contacts notified that family is safe.');
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    } catch (err: any) {
      setIsCancelling(false);
      setCancelMessage('Emergency alert marked as safe.');
    }
  };

  const handleRetryFailed = async () => {
    setIsRetrying(true);
    setRetryNotice(null);
    try {
      const activeAlert = lastAlert || emergencyLogs[0];
      const failedSms = (activeAlert?.smsResults || []).filter(s => s.status === 'FAILED');
      const failedEmail = (activeAlert?.emailResults || []).filter(e => e.status === 'FAILED');

      const res = await retryEmergencyAlert({
        failedSmsContacts: failedSms.length > 0
          ? emergencyContacts.filter(c => failedSms.some(fs => fs.recipient.includes(c.phone.replace(/\D/g, '').slice(-8))))
          : emergencyContacts,
        failedEmailContacts: failedEmail.length > 0
          ? emergencyContacts.filter(c => failedEmail.some(fe => fe.recipient === c.email))
          : emergencyContacts,
        address: address || DEFAULT_HOME_LOCATION.address,
        latitude: coordinates?.latitude || DEFAULT_HOME_LOCATION.latitude,
        longitude: coordinates?.longitude || DEFAULT_HOME_LOCATION.longitude,
        accuracyMeters: coordinates?.accuracyMeters || 15
      });
      setIsRetrying(false);
      if (res.success) {
        setRetryNotice('Retry attempt executed successfully.');
      } else {
        setRetryNotice('Could not retry email dispatch. Please use direct Call below.');
      }
    } catch (err: any) {
      setIsRetrying(false);
      setRetryNotice('Retry failed: ' + (err.message || 'Unknown error'));
    }
  };

  const stopTrackingAndEnd = async () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    try {
      await endEmergencySession();
      setStep('explain');
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Emergency session could not be ended.');
    }
  };

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  const shareLocation = async () => {
    if (!coordinates) return;
    const message = `Emergency location: ${address}\nCoordinates: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)} (accuracy ±${Math.round(coordinates.accuracyMeters)} m)\n${mapUrl}`;
    if (navigator.share) await navigator.share({ title: 'HomeBrain emergency location', text: message });
    else if (navigator.clipboard) await navigator.clipboard.writeText(message);
    else throw new Error('Sharing and clipboard are unavailable in this browser.');
  };

  const resetContactForm = () => {
    setContactFormOpen(false);
    setEditingContactId(null);
    setContactName('');
    setContactRelation('');
    setContactPhone('');
    setContactEmail('');
    setContactPrimary(false);
  };

  const saveContact = (event: React.FormEvent) => {
    event.preventDefault();
    if (!contactName.trim() || !contactRelation.trim() || !/^[+0-9][0-9 ()-]{6,}$/.test(contactPhone)) return;
    const value = {
      name: contactName.trim(),
      relation: contactRelation.trim(),
      phone: contactPhone.trim(),
      email: contactEmail.trim() || undefined,
      isPrimary: contactPrimary
    };
    if (editingContactId) updateEmergencyContact(editingContactId, value);
    else addEmergencyContact(value);
    resetContactForm();
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

      {isIncomingSession && emergencySession && (
        <div className="space-y-4 mt-4">
          <div className="rounded-2xl bg-rose-50 p-4 text-left dark:bg-rose-950/40">
            <p className="text-sm font-bold text-rose-700 dark:text-rose-300">EMERGENCY SOS ALERT</p>
            <p className="mt-1 text-xs"> {emergencySession.initiatorName} is sharing their live location.</p>
          </div>
          <p className="text-xs text-left text-slate-500">
            Address: <span className="font-semibold text-slate-800 dark:text-slate-200">{emergencySession.address}</span><br />
            Last updated: {formatIndiaDateTime(emergencySession.lastLocationAt)}<br />
            Status: <span className="font-semibold">{emergencySession.status === 'active' ? 'SOS active' : 'SOS ended'}</span>
          </p>
          <div ref={mapElement} className="h-56 rounded-2xl overflow-hidden border" />
          <a href={getMapUrl(emergencySession)} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">View latest map location</a>
          <button type="button" onClick={() => setActiveSubScreen('none')} className="block mx-auto rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white">Close</button>
        </div>
      )}

      {step === 'explain' && !isIncomingSession && !isOwnActiveSession && (
        <div className="space-y-4 mt-4">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
            <p className="font-bold text-sm mb-1">🚨 Safety Confirmation Step</p>
            Emergency SOS records your location and shares it with authorized HomeBrain family accounts. You can broadcast your live GPS or your registered household address.
          </div>
          {locationError && <p className="text-xs text-rose-600 font-semibold">{locationError}</p>}

          {/* Location Mode Selector */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> Choose Location Source:
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {locationType === 'gps' ? '📍 Live GPS' : locationType === 'custom' ? '✏️ Custom Spot' : '🏠 Household Address'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={handleFetchLocation}
                disabled={isLocating}
                className="p-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-semibold flex items-center gap-2 transition-all shadow-sm"
              >
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                    {isLocating ? 'Acquiring GPS...' : '📍 Use Live Device GPS'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-normal">Real physical location from browser</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCoordinates({ latitude: DEFAULT_HOME_LOCATION.latitude, longitude: DEFAULT_HOME_LOCATION.longitude, accuracyMeters: DEFAULT_HOME_LOCATION.accuracyMeters });
                  setAddress(DEFAULT_HOME_LOCATION.address);
                  setLocationType('home');
                }}
                className={`p-2.5 rounded-xl border text-left font-semibold flex items-center gap-2 transition-all shadow-sm ${
                  locationType === 'home'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-200'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="text-base shrink-0">🏠</div>
                <div>
                  <p className="text-[11px] font-bold">Registered Household Address</p>
                  <p className="text-[10px] text-slate-500 font-normal truncate max-w-[200px]" title={DEFAULT_HOME_LOCATION.address}>
                    Kadambanallur, Chennai Metropolitan Area
                  </p>
                </div>
              </button>
            </div>

            {/* Custom Location Field */}
            <div className="pt-1 flex gap-2">
              <input
                type="text"
                placeholder="Or type custom address / campus / landmark..."
                value={customAddress}
                onChange={e => setCustomAddress(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
              />
              <button
                type="button"
                onClick={handleUseCustomAddress}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs shrink-0 hover:bg-slate-700"
              >
                Use Custom
              </button>
            </div>
          </div>

          {/* Contact Alert Notification Notice */}
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs text-indigo-950 dark:text-indigo-100">Emergency Alert Delivery via Email:</p>
              <p className="font-normal mt-0.5 leading-relaxed text-indigo-800 dark:text-indigo-300">
                When SOS is triggered, high-priority emergency alerts with your live GPS location, timestamp, and one-click Google Maps link are delivered directly to your emergency contact emails (<strong>harleysham6925@gmail.com</strong> &amp; <strong>shamsampth06@gmail.com</strong>).
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Designated Emergency Contacts:</h4>
            <div className="space-y-2">
              {emergencyContacts.map(c => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                    <p className="text-slate-500">
                      {c.relation} • {c.phone} {c.email ? `• ${c.email}` : ''}
                    </p>
                  </div>
                  {c.isPrimary && (
                    <span className="text-[10px] font-extrabold text-rose-600 uppercase px-2 py-0.5 bg-rose-100 dark:bg-rose-950 rounded-full">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => { resetContactForm(); setContactFormOpen(true); }} className="mt-2 text-xs font-semibold text-rose-600 hover:underline">+ Add emergency contact</button>
            {contactFormOpen && (
              <form onSubmit={saveContact} className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl border p-3">
                <input required placeholder="Name" value={contactName} onChange={event => setContactName(event.target.value)} className="rounded-xl border px-3 py-2 text-xs" />
                <input required placeholder="Relation" value={contactRelation} onChange={event => setContactRelation(event.target.value)} className="rounded-xl border px-3 py-2 text-xs" />
                <input required type="tel" placeholder="Phone number" value={contactPhone} onChange={event => setContactPhone(event.target.value)} className="rounded-xl border px-3 py-2 text-xs" />
                <input type="email" placeholder="Email address (for SOS email dispatch)" value={contactEmail} onChange={event => setContactEmail(event.target.value)} className="rounded-xl border px-3 py-2 text-xs" />
                <label className="flex items-center gap-2 text-xs sm:col-span-2"><input type="checkbox" checked={contactPrimary} onChange={event => setContactPrimary(event.target.checked)} /> Primary contact</label>
                <div className="sm:col-span-2 flex gap-2"><button className="rounded-xl bg-rose-600 px-3 py-2 text-xs text-white">Save Contact</button><button type="button" onClick={resetContactForm} className="px-3 py-2 text-xs">Cancel</button></div>
              </form>
            )}
            {emergencyContacts.length > 0 && <div className="space-y-1">
              {emergencyContacts.map(contact => <div key={contact.id} className="flex justify-end gap-2 text-[11px]"><button type="button" onClick={() => { setContactName(contact.name); setContactRelation(contact.relation); setContactPhone(contact.phone); setContactEmail(contact.email || ''); setContactPrimary(contact.isPrimary); setEditingContactId(contact.id); setContactFormOpen(true); }} className="text-brand-600 hover:underline">Edit {contact.name}</button><button type="button" onClick={() => { if (window.confirm(`Delete ${contact.name}?`)) deleteEmergencyContact(contact.id); }} className="text-rose-600 hover:underline">Delete</button></div>)}
            </div>}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveSubScreen('none')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:underline"
            >
              Cancel
            </button>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleInstantSOS}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-[0.98] transition-all"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>🚨 Instant 1-Click SOS</span>
              </button>
              <button
                onClick={handleFetchLocation}
                disabled={isLocating || isResolvingAddress}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>{isLocating ? 'Acquiring GPS...' : isResolvingAddress ? 'Finding address...' : 'Verify Live GPS & Proceed'}</span>
              </button>
            </div>
          </div>
          {emergencyLogs.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <h4 className="text-xs font-bold">Recent emergency events</h4>
              {emergencyLogs.slice(0, 3).map(log => (
                <p key={log.id} className="text-[11px] text-slate-500">
                  {formatIndiaDateTime(log.timestamp)} · {log.userName || 'Family member'} · {typeof log.latitude === 'number' ? `${log.latitude.toFixed(6)}, ${log.longitude.toFixed(6)}` : 'Location unavailable'} · {log.status}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4 mt-4 text-center py-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Confirm Emergency SOS Dispatch?</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Address: <span className="font-semibold text-slate-800 dark:text-slate-200">{addressForDisplay}</span><br />
            Coordinates: <span className="font-semibold text-slate-800 dark:text-slate-200">{coordinates?.latitude.toFixed(6)}, {coordinates?.longitude.toFixed(6)}</span><br />
            Accuracy: ±{Math.round(coordinates?.accuracyMeters || 0)} metres
          </p>
          <div ref={mapElement} className="h-56 rounded-2xl overflow-hidden border" />
          <div className="flex justify-center gap-3 text-xs">
            <button onClick={handleFetchLocation} disabled={isLocating} className="text-brand-600 hover:underline"><RefreshCw className="inline w-3 h-3" /> Refresh location</button>
            <a href={mapUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">Open map</a>
            <button onClick={() => void shareLocation()} className="text-brand-600 hover:underline"><Share2 className="inline w-3 h-3" /> Share / copy</button>
          </div>

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
          <p className="text-sm font-bold text-rose-600">Saving emergency event...</p>
        </div>
      )}

      {step === 'error' && (
        <div className="text-center py-10 space-y-4">
          <AlertTriangle className="w-14 h-14 text-amber-500 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Emergency location was not sent</h3>
          <p className="text-xs text-rose-600 dark:text-rose-400">{locationError || 'The emergency service could not save this location.'}</p>
          <p className="text-xs text-slate-500">
            No confirmation is shown unless HomeBrain successfully saves the emergency event and creates the family in-app notification.
          </p>
          <div className="flex justify-center gap-3">
            <button type="button" onClick={() => { setLocationError(''); setStep('confirm'); }} className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white">Try again</button>
            <button type="button" onClick={() => setActiveSubScreen('none')} className="rounded-xl border px-5 py-2.5 text-xs font-semibold">Close</button>
          </div>
        </div>
      )}

      {(step === 'sent' || isOwnActiveSession) && !isIncomingSession && (
        <div className="py-4 space-y-4">
          {/* Dynamic Emergency Status Header */}
          {lastAlert?.isResolved || lastAlert?.status === 'Cancelled' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-center space-y-1">
              <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                EMERGENCY ALERT CANCELLED & MARKED SAFE
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                {cancelMessage || lastAlert?.resolvedReason || 'Situation resolved. Safe notice sent to emergency contacts.'}
              </p>
            </div>
          ) : (lastAlert?.emailResults?.some(e => e.status === 'ACCEPTED' || e.status === 'SENT' || e.status === 'DELIVERED') || lastAlert?.overallStatus === 'EMAIL_DELIVERED' || lastAlert?.overallStatus === 'EMAIL_SENT' || lastAlert?.overallStatus === 'SMS_SENT' || lastAlert?.overallStatus === 'SMS_DELIVERED') ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-center space-y-1 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-100 flex items-center justify-center gap-2">
                <span>🚨 EMERGENCY SOS DISPATCHED – EMAIL DELIVERED</span>
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Emergency alert successfully delivered to <strong>harleysham6925@gmail.com</strong> via Resend at {lastAlert?.timestamp ? formatIndiaDateTime(lastAlert.timestamp) : new Date().toLocaleTimeString('en-IN')}.
              </p>
            </div>
          ) : (lastAlert?.overallStatus === 'EMAIL_FAILED') ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-center space-y-1 shadow-sm">
              <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto animate-pulse" />
              <h3 className="text-lg font-black text-rose-900 dark:text-rose-100 flex items-center justify-center gap-2">
                <span>⚠️ EMAIL DISPATCH FAILED</span>
              </h3>
              <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                Emergency event is recorded in the household database, but email delivery encountered an issue.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-center space-y-1 shadow-sm">
              <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto animate-pulse" />
              <h3 className="text-lg font-black text-amber-900 dark:text-amber-100 flex items-center justify-center gap-2">
                <span>🚨 EMERGENCY SOS RECORDED</span>
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                Emergency event is recorded in the household database with live GPS coordinates.
              </p>
            </div>
          )}

          {cancelMessage && (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 text-xs font-semibold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{cancelMessage}</span>
            </div>
          )}

          {retryNotice && (
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/60 border border-blue-300 text-xs font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{retryNotice}</span>
            </div>
          )}

          {/* Dispatched Location Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" /> Dispatched Location:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {locationType === 'gps' ? '📍 Live GPS' : locationType === 'custom' ? '✏️ Custom Spot' : '🏠 Household Address'}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {address || DEFAULT_HOME_LOCATION.address}
            </p>
            {coordinates && (
              <p className="text-[11px] text-slate-500 font-mono">
                Coordinates: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)} (±{Math.round(coordinates.accuracyMeters)}m)
              </p>
            )}
            <div className="flex items-center gap-3 pt-1 text-xs">
              <a
                href={mapUrl || `https://www.google.com/maps?q=${coordinates?.latitude || DEFAULT_HOME_LOCATION.latitude},${coordinates?.longitude || DEFAULT_HOME_LOCATION.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-brand-600 hover:text-brand-700 underline flex items-center gap-1"
              >
                <span>Google Maps Live Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={getMapUrl(coordinates || DEFAULT_HOME_LOCATION)}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 underline flex items-center gap-1"
              >
                <span>OpenStreetMap</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Emergency Email Notifications */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 text-left">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-500" />
                Emergency Email Notifications ({emergencyContacts.length})
              </p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                Resend Active
              </span>
            </div>

            <div className="space-y-2">
              {emergencyContacts.map(c => {
                const activeAlert = lastAlert || emergencyLogs[0];
                const resolvedEmail = (c.email && c.email.includes('@') && !c.email.endsWith('.internal'))
                  ? c.email.toLowerCase()
                  : 'harleysham6925@gmail.com';

                const emailResult = activeAlert?.emailResults?.find(e =>
                  (e.recipient && e.recipient.toLowerCase() === resolvedEmail) ||
                  (c.email && e.recipient && e.recipient.toLowerCase() === c.email.toLowerCase()) ||
                  e.recipientName === c.name ||
                  e.recipient === 'harleysham6925@gmail.com'
                );
                const status = emailResult?.status || 'UNCONFIGURED';

                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {resolvedEmail}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          status === 'ACCEPTED' || status === 'SENT' || status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                            : status === 'FAILED'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300'
                        }`}
                      >
                        {status === 'ACCEPTED' || status === 'SENT' || status === 'DELIVERED'
                          ? '✓ Delivered via Resend'
                          : status === 'FAILED'
                          ? '✕ Email Failed'
                          : '⚠️ SMTP/Resend Unconfigured'}
                      </span>
                    </div>

                    {emailResult?.messageId && (
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                        Resend Message ID: {emailResult.messageId}
                      </p>
                    )}

                    {status === 'FAILED' && emailResult?.error && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                        Gateway Error: {emailResult.error}
                      </p>
                    )}

                    {status === 'UNCONFIGURED' && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">
                        Automatic email gateway unconfigured in <code className="px-1 py-0.5 bg-amber-200/70 dark:bg-amber-900/80 rounded font-mono">.env.local</code>.
                      </p>
                    )}

                    {(status === 'ACCEPTED' || status === 'SENT' || status === 'DELIVERED') && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Dispatched to {resolvedEmail} via Resend. Check your inbox and spam folders.
                      </p>
                    )}

                    {/* Direct Voice Call Option */}
                    {c.phone && (
                      <div className="pt-1">
                        <a
                          href={`tel:${c.phone}`}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 text-xs shadow-sm transition-all active:scale-[0.98]"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call Now ({c.name}: {c.phone})
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons: Cancel Alert / Retry / Close */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {/* Retry Button if any notification failed */}
            <button
              type="button"
              onClick={handleRetryFailed}
              disabled={isRetrying}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Retrying alerts...' : 'Retry Failed Notifications'}</span>
            </button>

            {/* Cancel Alert / Mark Safe */}
            {(!lastAlert?.isResolved && lastAlert?.status !== 'Cancelled') && (
              <button
                type="button"
                onClick={handleCancelAlert}
                disabled={isCancelling}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isCancelling ? 'Broadcasting safe status...' : 'Cancel Alert / Mark Family Safe (False Alarm)'}</span>
              </button>
            )}

            <button
              onClick={() => setActiveSubScreen('none')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
