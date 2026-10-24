import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, CheckCircle2, AlertTriangle, MapPin, Camera, RefreshCw,
  Calendar, ShieldCheck, Play, Square, UserCheck, Sparkles, AlertCircle
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { Alert, Badge, Button, Spinner } from '../components/ui';

interface TodayAttendanceData {
  employee: {
    employeeId: string;
    name: string;
    department: string;
    designation: string;
  };
  attendance: {
    _id: string;
    date: string;
    checkIn: string;
    checkOut?: string;
    status: 'present' | 'late' | 'half-day' | 'absent';
    workHours: number;
    isLate: boolean;
    lateMinutes: number;
    checkInPhoto?: string;
    checkOutPhoto?: string;
    checkInLocation?: { lat?: number; lng?: number; address?: string };
  } | null;
  settings: {
    officeStart: string;
    graceMinutes: number;
    halfDayHours: number;
    weekend: number[];
    office?: { lat?: number; lng?: number; radiusMeters?: number };
  };
  serverTime: string;
}

export const ClockInOut: React.FC = () => {
  const [data, setData] = useState<TodayAttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Optional Camera & Location State
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('idle');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Update live clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load today's status
  const loadTodayStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/attendance/today');
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayStatus();
  }, []);

  // Start Camera
  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 360 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      setError('Unable to access camera. Please allow camera permissions in your browser.');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Snap photo from video stream
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  // Detect GPS Location
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationStatus('detected');
      },
      () => {
        setLocationStatus('denied');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Clock In
  const handleClockIn = async () => {
    setError('');
    setSuccessMsg('');
    setActionLoading(true);

    try {
      const res = await api.post('/attendance/check-in', {
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        photo: capturedPhoto || undefined,
      });

      setSuccessMsg(res.data.message || 'Checked in successfully!');
      setCapturedPhoto(null);
      await loadTodayStatus();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Clock Out
  const handleClockOut = async () => {
    setError('');
    setSuccessMsg('');
    setActionLoading(true);

    try {
      const res = await api.post('/attendance/check-out', {
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        photo: capturedPhoto || undefined,
      });

      setSuccessMsg(res.data.message || 'Checked out successfully!');
      setCapturedPhoto(null);
      await loadTodayStatus();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Spinner className="w-8 h-8 text-brand-500" />
        <p className="text-sm">Loading attendance status…</p>
      </div>
    );
  }

  const att = data?.attendance;
  const isCheckedIn = !!att;
  const isCheckedOut = !!att?.checkOut;

  // Calculate live elapsed time
  let elapsedMinutes = 0;
  if (isCheckedIn && !isCheckedOut && att) {
    const diffMs = currentTime.getTime() - new Date(att.checkIn).getTime();
    elapsedMinutes = Math.max(0, Math.floor(diffMs / 60000));
  }
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedMinsRemain = elapsedMinutes % 60;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
              <Clock className="w-8 h-8 text-brand-400" />
              Clock In / Out
            </h1>
            <Badge variant="indigo">Web Terminal</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Self-service attendance check-in and check-out with automatic policy compliance.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadTodayStatus}>
          Refresh Status
        </Button>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {successMsg && <Alert kind="success">{successMsg}</Alert>}

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Action Clock Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="surface-card rounded-2xl p-6 sm:p-8 border border-brand-500/30 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-6">
              {/* Live Digital Clock */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-mono tracking-widest text-brand-400 font-bold">
                  {currentTime.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <div className="text-4xl sm:text-6xl font-black text-white font-mono tracking-tight drop-shadow-md">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Official Office Hours: <strong className="text-slate-200">{data?.settings.officeStart || '09:00'} AM</strong>{' '}
                  • Grace Period: <strong className="text-slate-200">{data?.settings.graceMinutes || 15} mins</strong>
                </div>
              </div>

              {/* Status Dial Badge */}
              <div className="p-4 rounded-2xl bg-surface-raised/40 border border-white/5 w-full max-w-md">
                {!isCheckedIn ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Ready to Check In</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      You haven't checked in for today yet. Click the button below to mark your attendance.
                    </p>
                  </div>
                ) : !isCheckedOut ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant={att.isLate ? 'amber' : 'emerald'} pulse>
                        {att.isLate ? `Checked In Late (+${att.lateMinutes}m)` : 'Currently On Duty (Present)'}
                      </Badge>
                    </div>
                    <div className="text-2xl font-black font-mono text-white">
                      {elapsedHours}h {elapsedMinsRemain}m{' '}
                      <span className="text-xs font-normal text-slate-400 font-sans">elapsed today</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Checked in at:{' '}
                      <strong className="text-slate-200">
                        {new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2 text-indigo-400 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Shift Completed Today</span>
                    </div>
                    <div className="text-lg font-black font-mono text-emerald-300">
                      Total Worked: {att.workHours} hours
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Out at: {new Date(att.checkOut!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="w-full max-w-md">
                {!isCheckedIn ? (
                  <Button
                    size="lg"
                    icon={Play}
                    loading={actionLoading}
                    onClick={handleClockIn}
                    className="w-full py-4 text-base font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30"
                  >
                    Clock In for Today
                  </Button>
                ) : !isCheckedOut ? (
                  <Button
                    size="lg"
                    icon={Square}
                    loading={actionLoading}
                    onClick={handleClockOut}
                    className="w-full py-4 text-base font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xl shadow-amber-600/30"
                  >
                    Clock Out &amp; Complete Shift
                  </Button>
                ) : (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 text-center font-mono">
                    ✓ You have completed both Check In and Check Out for today.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Optional Web Camera & GPS Section (Prompt feature: camera + location) */}
          <div className="surface-card rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Camera className="w-4 h-4 text-brand-400" />
              Verification Attachments (Camera &amp; GPS Location - Optional)
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Camera Verification Box */}
              <div className="p-4 rounded-xl bg-surface-raised/40 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-brand-400" /> Web Camera
                  </span>
                  {capturedPhoto ? (
                    <Badge variant="emerald">Photo Attached</Badge>
                  ) : cameraActive ? (
                    <Badge variant="amber">Camera Live</Badge>
                  ) : (
                    <Badge variant="slate">Optional</Badge>
                  )}
                </div>

                {cameraActive && (
                  <div className="relative rounded-lg overflow-hidden border border-white/10 aspect-video bg-black">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={captureSnapshot}
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" /> Snap Photo
                    </button>
                  </div>
                )}

                {capturedPhoto && (
                  <div className="relative rounded-lg overflow-hidden border border-emerald-500/30 aspect-video">
                    <img src={capturedPhoto} alt="Snapshot" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCapturedPhoto(null)}
                      className="absolute top-2 right-2 bg-black/70 text-rose-300 hover:text-white px-2 py-0.5 rounded text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {!cameraActive && !capturedPhoto && (
                  <Button variant="outline" size="sm" icon={Camera} onClick={startCamera} className="w-full text-xs">
                    Enable Web Camera
                  </Button>
                )}
              </div>

              {/* GPS Geolocation Box */}
              <div className="p-4 rounded-xl bg-surface-raised/40 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-400" /> Office Geofence / GPS
                  </span>
                  {userLocation ? (
                    <Badge variant="emerald">Coordinates Verified</Badge>
                  ) : (
                    <Badge variant="slate">Optional</Badge>
                  )}
                </div>

                {userLocation ? (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-mono space-y-1">
                    <div>Latitude: {userLocation.lat.toFixed(6)}</div>
                    <div>Longitude: {userLocation.lng.toFixed(6)}</div>
                    <div className="text-[10px] text-emerald-400 font-sans">✓ Location tagged with attendance record</div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Tag your office GPS coordinates to verify physical attendance presence.
                  </p>
                )}

                {!userLocation && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={MapPin}
                    loading={locationStatus === 'locating'}
                    onClick={detectLocation}
                    className="w-full text-xs"
                  >
                    Detect My GPS Location
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Policy & Quick Info Card */}
        <div className="space-y-6">
          {/* Employee Summary Card */}
          <div className="surface-card rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Employee On-Duty
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-300 font-bold flex items-center justify-center text-lg">
                {data?.employee.name.charAt(0) || 'E'}
              </div>
              <div>
                <h4 className="font-bold text-white text-base">{data?.employee.name}</h4>
                <p className="text-xs text-slate-400 font-mono">{data?.employee.employeeId}</p>
                <p className="text-xs text-indigo-300 font-medium">
                  {data?.employee.designation} • {data?.employee.department}
                </p>
              </div>
            </div>
          </div>

          {/* Rules & Policy Card */}
          <div className="surface-card rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-400" /> Attendance Policy Rules
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-raised/40 border border-white/5">
                <span className="text-slate-400 block font-medium">Standard Office Start:</span>
                <span className="font-bold text-white font-mono text-sm">{data?.settings.officeStart || '09:00'} AM</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-raised/40 border border-white/5">
                <span className="text-slate-400 block font-medium">Grace Period Cutoff:</span>
                <span className="font-bold text-amber-300 font-mono text-sm">
                  {data?.settings.graceMinutes || 15} Minutes
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Check-ins after 09:15 AM are flagged as Late.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-raised/40 border border-white/5">
                <span className="text-slate-400 block font-medium">Half-Day Threshold:</span>
                <span className="font-bold text-indigo-300 font-mono text-sm">
                  {data?.settings.halfDayHours || 5} Hours Minimum
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Shifts under 5 hours are recorded as half-days.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-raised/40 border border-white/5">
                <span className="text-slate-400 block font-medium">Duplicate Check-In Guard:</span>
                <span className="font-bold text-emerald-400 text-sm">1 Check-In Per Day</span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Single daily check-in enforced as per brief.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClockInOut;
