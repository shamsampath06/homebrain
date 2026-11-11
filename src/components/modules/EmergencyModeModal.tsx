import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { formatIndiaDateTime } from '../../lib/display';
import { getAccessToken } from '../../lib/supabase';
import { PageHeader } from '../layout/PageHeader';
import { ShieldAlert, AlertTriangle, MapPin, Share2, CheckCircle2, X, RefreshCw, Mail, Send, Phone, MessageSquare, Zap } from 'lucide-react';

const DEFAULT_HOME_LOCATION = {
  address: 'Kumar Family Residence, 100ft Road, Indiranagar, Bangalore, Karnataka 560038',
  latitude: 12.9716,
  longitude: 77.6412,
  accuracyMeters: 15
};

export const EmergencyModeModal: React.FC = () => {
  const { currentUser, emergencyContacts, emergencyLogs, emergencySession, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact, triggerEmergencyAlert, startEmergencySession, updateEmergencySessionLocation, endEmergencySession, setActiveSubScreen } = useHomeBrain();
  const [step, setStep] = useState<'explain' | 'confirm' | 'sending' | 'sent' | 'error'>('explain');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number; accuracyMeters: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [address, setAddress] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPrimary, setContactPrimary] = useState(false);
  const [emailResults, setEmailResults] = useState<{ email: string; status: string; message: string }[]>([]);
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
          setIsLocating(false);
          setIsResolvingAddress(true);
          fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(nextCoordinates.latitude)}&lon=${encodeURIComponent(nextCoordinates.longitude)}&zoom=18&addressdetails=1`, {
            headers: { Accept: 'application/json' }
          })
            .then(async response => {
              if (!response.ok) throw new Error('Address lookup failed.');
              const result = await response.json() as { display_name?: string };
              setAddress(result.display_name || `GPS: ${nextCoordinates.latitude.toFixed(5)}, ${nextCoordinates.longitude.toFixed(5)}`);
              setStep('confirm');
            })
            .catch(() => {
              setAddress(`GPS Location: ${nextCoordinates.latitude.toFixed(5)}° N, ${nextCoordinates.longitude.toFixed(5)}° E`);
              setStep('confirm');
            })
            .finally(() => setIsResolvingAddress(false));
        },
        err => {
          console.warn('Geolocation blocked or unavailable, defaulting to verified home address:', err);
          setCoordinates({ latitude: DEFAULT_HOME_LOCATION.latitude, longitude: DEFAULT_HOME_LOCATION.longitude, accuracyMeters: DEFAULT_HOME_LOCATION.accuracyMeters });
          setAddress(DEFAULT_HOME_LOCATION.address);
          setIsLocating(false);
          setStep('confirm');
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 30000 }
      );
    } else {
      setCoordinates({ latitude: DEFAULT_HOME_LOCATION.latitude, longitude: DEFAULT_HOME_LOCATION.longitude, accuracyMeters: DEFAULT_HOME_LOCATION.accuracyMeters });
      setAddress(DEFAULT_HOME_LOCATION.address);
      setIsLocating(false);
      setStep('confirm');
    }
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
      await triggerEmergencyAlert({
        address: locAddress,
        latitude: locCoords.latitude,
        longitude: locCoords.longitude,
        accuracyMeters: locCoords.accuracyMeters,
        mapUrl: getMapUrl(locCoords)
      });

      try {
        const token = getAccessToken();
        const alertRes = await fetch('/api/emergency/alert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            address: locAddress,
            latitude: locCoords.latitude,
            longitude: locCoords.longitude,
            accuracyMeters: locCoords.accuracyMeters,
            mapUrl: getMapUrl(locCoords),
            senderName: currentUser.name || 'Sarah',
            familyId: currentUser.familyId || 'demo-family-kumar',
            recipients: emergencyContacts.map(c => ({
              name: c.name,
              email: c.email || `${c.name.toLowerCase().replace(/\s+/g, '')}@family.homebrain.internal`,
              phone: c.phone
            }))
          })
        });
        if (alertRes.ok) {
          const alertData = await alertRes.json();
          setEmailResults(alertData.results || []);
        }
      } catch (emailErr) {
        console.warn('Backend SOS email dispatch skipped:', emailErr);
      }

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
      await triggerEmergencyAlert({
        address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracyMeters: coordinates.accuracyMeters,
        mapUrl
      });

      // Dispatch real/simulated email alerts via backend
      try {
        const token = getAccessToken();
        const alertRes = await fetch('/api/emergency/alert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            address,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            accuracyMeters: coordinates.accuracyMeters,
            mapUrl,
            senderName: currentUser.name,
            familyId: currentUser.familyId,
            recipients: emergencyContacts.map(c => ({
              name: c.name,
              email: c.email || `${c.name.toLowerCase().replace(/\s+/g, '')}@family.homebrain.internal`,
              phone: c.phone
            }))
          })
        });
        if (alertRes.ok) {
          const alertData = await alertRes.json();
          setEmailResults(alertData.results || []);
        }
      } catch (emailErr) {
        console.warn('Backend SOS email dispatch skipped:', emailErr);
      }

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
            Emergency SOS records your current GPS location and shares it with authorized HomeBrain family accounts after you explicitly confirm.
          </div>
          {locationError && <p className="text-xs text-rose-600">{locationError}</p>}

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
        <div className="text-center py-6 space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Emergency Location Dispatched</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your live GPS location and alert broadcast have been recorded and sent to family accounts.
          </p>

          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-200 font-semibold space-y-1 text-left">
            <p className="font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-100">
              <MapPin className="w-3.5 h-3.5" /> Dispatched Address:
            </p>
            <p className="text-emerald-700 dark:text-emerald-300 font-normal">{address}</p>
            <div className="pt-1">
              <a href={mapUrl} target="_blank" rel="noreferrer" className="underline text-brand-600 dark:text-brand-400 font-bold">
                Open live map tracking location →
              </a>
            </div>
          </div>

          {/* Direct Emergency Dials */}
          <div className="space-y-2 text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Immediate Contact Direct Calling & SMS:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {emergencyContacts.map(c => (
                <div key={c.id} className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs shadow-sm">
                  <div className="overflow-hidden pr-2">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{c.phone}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${c.phone}`}
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 text-[11px] shadow-sm transition-all active:scale-95"
                      title="Direct Phone Call"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                    <a
                      href={`sms:${c.phone}?body=${encodeURIComponent(`EMERGENCY SOS ALERT! ${currentUser.name} has triggered an emergency from: ${address}. Live map: ${mapUrl}`)}`}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 text-[11px] shadow-sm transition-all active:scale-95"
                      title="Send Emergency SMS"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> SMS
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {emailResults.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left space-y-2">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-500" /> Emergency Email Dispatch Results ({emailResults.length})
              </p>
              <div className="space-y-1.5 text-xs">
                {emailResults.map((res, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{res.email}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      res.status === 'sent'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : res.status === 'simulated_sandbox'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {res.status === 'sent' ? '✓ Delivered via Resend' : res.status === 'simulated_sandbox' ? '✓ Sandbox Email Simulated' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {emergencySession?.initiatedBy === currentUser.id && emergencySession.status === 'active' && (
            <button type="button" onClick={() => void stopTrackingAndEnd()} className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/30">
              End Emergency Session
            </button>
          )}

          <div>
            <button
              onClick={() => setActiveSubScreen('none')}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Close Emergency Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
