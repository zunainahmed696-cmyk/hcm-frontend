import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock, MapPin, LogIn, LogOut, CheckCircle2, AlertTriangle,
  ShieldCheck, Navigation, Calendar, Sparkles, Camera, RefreshCw, X, RotateCcw, Upload, Image as ImageIcon
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { TodayAttendanceResponse } from '../types';
import { Alert, Badge, Button, Spinner } from '../components/ui';

const RESET_PRESETS = [
  'Clicked Clock Out by mistake while still on shift',
  'Accidental tap on mobile / browser',
  'Stepped out briefly and clicked Clock Out instead of break',
];

export const ClockInOut: React.FC = () => {
  const [status, setStatus] = useState<TodayAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Accidental Clock-Out Reset Application State
  const [resetReason, setResetReason] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  // Live clock
  const [now, setNow] = useState(new Date());

  // Geolocation state
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoError, setGeoError] = useState('');
  const [locating, setLocating] = useState(false);

  // Camera & Photo Verification State
  const [cameraActive, setCameraActive] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch {
      setCameraError('Unable to access webcam. You can use "Upload Photo" instead to attach a punch image.');
    }
  };

  const captureSnapshotFromVideo = (): string | null => {
    if (!videoRef.current || !videoRef.current.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 270;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.75);
  };

  const capturePhoto = () => {
    const dataUrl = captureSnapshotFromVideo();
    if (dataUrl) {
      setPhotoDataUrl(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCameraError('');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 360;
        const maxH = 270;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else if (height > maxH) {
          width = Math.round((width * maxH) / height);
          height = maxH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.78));
          stopCamera();
        }
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const res = await api.get('/attendance/today');
      setStatus(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const requestLocation = useCallback((): Promise<{ lat: number; lng: number; accuracy: number } | null> => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser.');
      return Promise.resolve(null);
    }
    setLocating(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          };
          setCoords(c);
          setLocating(false);
          resolve(c);
        },
        (err) => {
          setLocating(false);
          setGeoError(
            err.code === 1
              ? 'Location permission denied. Please allow location access in your browser.'
              : 'Unable to acquire GPS coordinates. Try again.'
          );
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  const resolvePunchPhoto = (): string | undefined => {
    if (photoDataUrl) return photoDataUrl;
    if (cameraActive) {
      const snapped = captureSnapshotFromVideo();
      if (snapped) {
        setPhotoDataUrl(snapped);
        stopCamera();
        return snapped;
      }
    }
    return undefined;
  };

  const handleCheckIn = async () => {
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      let currentCoords = coords;
      if (!currentCoords) {
        currentCoords = await requestLocation();
      }
      const finalPhoto = resolvePunchPhoto();
      const res = await api.post('/attendance/check-in', {
        ...(currentCoords ? { lat: currentCoords.lat, lng: currentCoords.lng } : {}),
        ...(finalPhoto ? { photo: finalPhoto } : {}),
      });
      setMessage(res.data.message || 'Checked in successfully.');
      setPhotoDataUrl(null);
      await loadStatus();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      let currentCoords = coords;
      if (!currentCoords && navigator.geolocation) {
        currentCoords = await requestLocation();
      }
      const finalPhoto = resolvePunchPhoto();
      const res = await api.post('/attendance/check-out', {
        ...(currentCoords ? { lat: currentCoords.lat, lng: currentCoords.lng } : {}),
        ...(finalPhoto ? { photo: finalPhoto } : {}),
      });
      setMessage(res.data.message || 'Checked out successfully.');
      setPhotoDataUrl(null);
      await loadStatus();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestClockOutReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const finalReason = resetReason.trim() || 'Accidental clock-out — requesting HR/Owner to reopen my shift for today.';
    setSubmittingReset(true);
    try {
      const res = await api.post('/attendance/clockout-reset-request', { reason: finalReason });
      setMessage(res.data.message || 'Clock-out reset application sent to HR & Owner.');
      setResetReason('');
      await loadStatus();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmittingReset(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <Spinner className="inline w-6 h-6 mr-2 text-brand-500" />
        Loading your attendance terminal…
      </div>
    );
  }

  const att = status?.attendance;
  const hasCheckedIn = !!att?.checkIn;
  const hasCheckedOut = !!att?.checkOut;
  const geofenceActive = !!(status?.policy.office?.lat && status?.policy.office?.lng);
  const shiftPolicy = status?.policy as any;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-brand-400 font-semibold">
              Biometric &amp; Geofenced Terminal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Daily Clock In / Out
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {status?.employee.fullName} ({status?.employee.employeeId}) • {status?.employee.department}
          </p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-raised border border-white/10">
          <Clock className="w-5 h-5 text-brand-400" />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              {shiftPolicy?.shiftName || 'Assigned Shift'}
            </p>
            <p className="text-xs font-semibold text-white">
              {status?.policy.officeStart || '09:00'}
              {shiftPolicy?.officeEnd ? ` – ${shiftPolicy.officeEnd}` : ''} (+{status?.policy.graceMinutes || 15}m grace)
            </p>
          </div>
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {message && <Alert kind="success">{message}</Alert>}
      {geoError && <Alert kind="warning">{geoError}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Clock + Punch Controls */}
        <div className="lg:col-span-7 surface-card rounded-2xl p-6 sm:p-8 border border-white/5 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs font-mono text-slate-400">
              <Calendar className="w-4 h-4 text-brand-400" />
              {now.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <Badge
              variant={
                hasCheckedOut
                  ? 'emerald'
                  : hasCheckedIn
                  ? 'sky'
                  : status?.isHoliday || status?.isWeekend
                  ? 'amber'
                  : 'slate'
              }
            >
              {hasCheckedOut
                ? 'Shift Completed'
                : hasCheckedIn
                ? 'On Duty (Clocked In)'
                : status?.isHoliday
                ? `Holiday: ${status.holidayName}`
                : status?.isWeekend
                ? 'Weekend'
                : 'Not Clocked In'}
            </Badge>
          </div>

          {/* Digital Time Display */}
          <div className="py-6 text-center rounded-2xl bg-slate-950/60 border border-white/5">
            <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white">
              {now.toLocaleTimeString()}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              Half-day threshold: &lt; {status?.policy.halfDayHours}h • Full-day: ≥ {status?.policy.halfDayHours}h
            </p>
          </div>

          {/* Punch Image Verification Widget (Camera + File Upload) */}
          {!hasCheckedOut && (
            <div className="p-4 rounded-xl bg-slate-950/50 border border-white/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-brand-400" />
                    Punch Photo Verification
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Visible to Owner &amp; HR on the Attendance Panel
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  {!cameraActive && !photoDataUrl && (
                    <>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Open Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Photo
                      </button>
                    </>
                  )}
                  {cameraActive && (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Close Camera
                    </button>
                  )}
                  {photoDataUrl && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoDataUrl(null);
                          startCamera();
                        }}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-mono text-amber-400 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Retake
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> Change File
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {cameraError && <p className="text-xs text-amber-400">{cameraError}</p>}

              {cameraActive && (
                <div className="relative rounded-xl overflow-hidden bg-black border border-white/10 max-w-xs mx-auto">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover" />
                  <div className="p-2 bg-slate-900/90 flex justify-center">
                    <Button size="sm" icon={Camera} onClick={capturePhoto}>
                      Capture Punch Photo
                    </Button>
                  </div>
                </div>
              )}

              {photoDataUrl && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <img
                    src={photoDataUrl}
                    alt="Captured punch"
                    className="w-20 h-16 object-cover rounded-lg border border-emerald-500/30"
                  />
                  <div className="text-xs text-slate-300">
                    <p className="font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Punch Photo Ready
                    </p>
                    <p className="text-[11px] text-slate-400">
                      This image will be attached to your {hasCheckedIn ? 'Check-Out' : 'Check-In'} record.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              size="lg"
              icon={LogIn}
              disabled={hasCheckedIn || submitting}
              loading={submitting && !hasCheckedIn}
              onClick={handleCheckIn}
              className="w-full py-4 text-base"
            >
              {hasCheckedIn ? 'Clocked In' : 'Clock In Now'}
            </Button>

            <Button
              size="lg"
              variant={hasCheckedIn && !hasCheckedOut ? 'primary' : 'outline'}
              icon={LogOut}
              disabled={!hasCheckedIn || hasCheckedOut || submitting}
              loading={submitting && hasCheckedIn && !hasCheckedOut}
              onClick={handleCheckOut}
              className="w-full py-4 text-base"
            >
              {hasCheckedOut ? 'Clocked Out' : 'Clock Out'}
            </Button>
          </div>

          {/* Accidental Clock-Out Application Box */}
          {hasCheckedOut && (
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-bold text-zinc-100">
                    Clocked Out Accidentally? Request Shift Re-Open
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Employees can only clock in and clock out once per day. If you clocked out by mistake, submit an application below so HR or the Owner can reset your clock-out and reopen your shift.
                  </p>
                </div>
              </div>

              {status?.pendingResetRequest && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-amber-300">
                      Reset Application Pending HR / Owner Approval
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Reason: &ldquo;{status.pendingResetRequest.reason}&rdquo;
                    </p>
                  </div>
                  <Badge variant="amber">Pending Reset</Badge>
                </div>
              )}

              {!status?.pendingResetRequest && (
                <form onSubmit={handleRequestClockOutReset} className="space-y-2.5 pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {RESET_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setResetReason(preset)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                          resetReason === preset
                            ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    placeholder="Explain briefly why your clock-out should be reset (or select a reason above)..."
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      icon={RotateCcw}
                      loading={submittingReset}
                    >
                      Submit Reset Application to HR / Owner
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* GPS / Geofence Status Footer */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-slate-200">
                  {geofenceActive
                    ? `Geofence Active (${status?.policy.office?.radiusMeters}m radius)`
                    : 'Geofence Not Enforced (Flexible Location)'}
                </p>
                {coords ? (
                  <p className="text-slate-400 font-mono mt-0.5">
                    GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} (±{coords.accuracy}m)
                  </p>
                ) : (
                  <p className="text-slate-400 mt-0.5">
                    Click &ldquo;Detect GPS&rdquo; or punch directly to capture location.
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={Navigation}
              loading={locating}
              onClick={requestLocation}
            >
              Detect GPS
            </Button>
          </div>
        </div>

        {/* Right: Today's Recorded Summary */}
        <div className="lg:col-span-5 surface-card rounded-2xl p-6 border border-white/5 space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Today&apos;s Recorded Log
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">Attendance Status</span>
              {att ? (
                <Badge
                  variant={
                    att.status === 'Present'
                      ? 'emerald'
                      : att.status === 'Late'
                      ? 'amber'
                      : att.status === 'Half-Day'
                      ? 'sky'
                      : 'rose'
                  }
                >
                  {att.status}
                </Badge>
              ) : (
                <span className="text-slate-500 font-mono">Pending Check-In</span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">Check-In Time</span>
              <span className="font-mono font-bold text-white">
                {att?.checkIn ? new Date(att.checkIn).toLocaleTimeString() : '—'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">Check-Out Time</span>
              <span className="font-mono font-bold text-white">
                {att?.checkOut ? new Date(att.checkOut).toLocaleTimeString() : '—'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">Late Arrival Minutes</span>
              <span className={`font-mono font-bold ${att?.lateMinutes ? 'text-amber-400' : 'text-emerald-400'}`}>
                {att?.lateMinutes ? `${att.lateMinutes} mins late` : '0 mins (On Time)'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">Logged Working Hours</span>
              <span className="font-mono font-bold text-brand-300">
                {att?.workingHours ? `${att.workingHours.toFixed(2)} hrs` : '0.00 hrs'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">Geofence Verification</span>
              {att?.checkInLocation ? (
                att.checkInLocation.withinGeofence ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Verified ({att.checkInLocation.distanceMeters ?? 0}m)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                    <AlertTriangle className="w-4 h-4" /> Outside Radius
                  </span>
                )
              ) : (
                <span className="text-slate-500 font-mono">No GPS tag</span>
              )}
            </div>

            {/* Recorded Punch Photos */}
            {(att?.checkInPhoto || att?.checkOutPhoto) && (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                  <ImageIcon className="w-3.5 h-3.5 text-brand-400" />
                  Recorded Punch Images
                </span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {att?.checkInPhoto && (
                    <div className="space-y-1">
                      <img
                        src={att.checkInPhoto}
                        alt="Check-In Punch"
                        className="w-full h-24 object-cover rounded-lg border border-white/10"
                      />
                      <p className="text-[10px] font-mono text-slate-400 text-center">Check-In Photo</p>
                    </div>
                  )}
                  {att?.checkOutPhoto && (
                    <div className="space-y-1">
                      <img
                        src={att.checkOutPhoto}
                        alt="Check-Out Punch"
                        className="w-full h-24 object-cover rounded-lg border border-white/10"
                      />
                      <p className="text-[10px] font-mono text-slate-400 text-center">Check-Out Photo</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClockInOut;
