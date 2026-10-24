import React, { useEffect, useState } from 'react';
import { MapPin, Building, Clock, Navigation } from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { Alert, Field, Spinner, Button, Card } from './ui';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Form {
  companyName: string;
  officeStart: string;
  graceMinutes: string;
  halfDayHours: string;
  weekend: number[];
  lat: string;
  lng: string;
  radiusMeters: string;
}

const toForm = (s: any): Form => ({
  companyName: s.companyName ?? '',
  officeStart: s.officeStart ?? '09:00',
  graceMinutes: String(s.graceMinutes ?? 15),
  halfDayHours: String(s.halfDayHours ?? 5),
  weekend: s.weekend ?? [0, 6],
  lat: s.office?.lat == null ? '' : String(s.office.lat),
  lng: s.office?.lng == null ? '' : String(s.office.lng),
  radiusMeters: String(s.office?.radiusMeters ?? 150),
});

/** Company profile, office hours and geofence. Admin edits; HR sees it read-only. */
export const SettingsPanel: React.FC<{ canEdit: boolean }> = ({ canEdit }) => {
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    api
      .get('/org/settings')
      .then((r) => setForm(toForm(r.data.settings)))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  if (!form) {
    return error ? (
      <Alert kind="error">{error}</Alert>
    ) : (
      <div className="py-12 text-center text-slate-400">
        <Spinner className="inline w-6 h-6 mr-2 text-brand-500" /> Loading company settings…
      </div>
    );
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaved(false);
    setForm({ ...form, [k]: e.target.value });
  };

  const toggleDay = (d: number) => {
    if (!canEdit) return;
    setSaved(false);
    setForm({
      ...form,
      weekend: form.weekend.includes(d) ? form.weekend.filter((x) => x !== d) : [...form.weekend, d],
    });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('Geolocation is not supported by this browser.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => f && { ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
        setLocating(false);
        setSaved(false);
      },
      () => {
        setError('Could not read your location. Allow location access or type the coordinates.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    const hasCoords = form.lat !== '' && form.lng !== '';
    if ((form.lat !== '') !== (form.lng !== '')) {
      return setError('Enter both latitude and longitude, or leave both empty.');
    }
    setSaving(true);
    try {
      const res = await api.put('/org/settings', {
        companyName: form.companyName,
        officeStart: form.officeStart,
        graceMinutes: Number(form.graceMinutes),
        halfDayHours: Number(form.halfDayHours),
        weekend: form.weekend,
        office: {
          lat: hasCoords ? Number(form.lat) : null,
          lng: hasCoords ? Number(form.lng) : null,
          radiusMeters: Number(form.radiusMeters),
        },
      });
      setForm(toForm(res.data.settings));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-4xl" noValidate>
      {error && <Alert kind="error">{error}</Alert>}
      {saved && (
        <Alert kind="success">
          Settings successfully updated. Business rules apply automatically to newly recorded entries.
        </Alert>
      )}

      {/* Section 1: Entity Identity */}
      <Card
        title="Organization Profile"
        subtitle="Primary organization profile visible to all employees"
      >
        <div className="max-w-md">
          <Field
            id="companyName"
            label="Legal Company Name"
            value={form.companyName}
            disabled={!canEdit}
            onChange={set('companyName')}
          />
        </div>
      </Card>

      {/* Section 2: Attendance & Timing Policy */}
      <Card
        title="Working Hours & Attendance Policy"
        subtitle="Configures daily check-in evaluations: late flags (09:15) and half-day thresholds"
      >
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-5">
            <Field
              id="officeStart"
              type="time"
              label="Standard Office Start"
              hint="HH:mm format"
              disabled={!canEdit}
              value={form.officeStart}
              onChange={set('officeStart')}
            />
            <Field
              id="graceMinutes"
              type="number"
              min={0}
              label="Grace Period (Minutes)"
              hint="Check-in after start + grace = Late"
              disabled={!canEdit}
              value={form.graceMinutes}
              onChange={set('graceMinutes')}
            />
            <Field
              id="halfDayHours"
              type="number"
              min={1}
              step="0.5"
              label="Half-Day Threshold (Hours)"
              hint="Total duration < threshold = Half Day"
              disabled={!canEdit}
              value={form.halfDayHours}
              onChange={set('halfDayHours')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide text-slate-300 mb-2">
              Recognized Weekend Days (Non-Working)
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, i) => {
                const on = form.weekend.includes(i);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(i)}
                    disabled={!canEdit}
                    aria-pressed={on}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 border ${
                      on
                        ? 'bg-brand-600 text-white border-brand-500 shadow-sm shadow-brand-600/20'
                        : 'bg-surface-raised text-slate-400 border-white/5 hover:text-white hover:bg-white/5'
                    } disabled:cursor-not-allowed`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Attendance expectations and leave balance calculations skip these selected days.
            </p>
          </div>
        </div>
      </Card>

      {/* Section 3: Geofence for Camera Attendance */}
      <Card
        title="Office Geofence & Location Bounds"
        subtitle="Defines the physical coordinates for mobile/web camera check-in verification"
      >
        <div className="space-y-5">
          <div className="grid sm:grid-cols-3 gap-5">
            <Field
              id="lat"
              type="number"
              step="any"
              label="Office Latitude"
              placeholder="e.g. 24.8607"
              disabled={!canEdit}
              value={form.lat}
              onChange={set('lat')}
            />
            <Field
              id="lng"
              type="number"
              step="any"
              label="Office Longitude"
              placeholder="e.g. 67.0011"
              disabled={!canEdit}
              value={form.lng}
              onChange={set('lng')}
            />
            <Field
              id="radiusMeters"
              type="number"
              min={10}
              label="Acceptance Radius (Meters)"
              disabled={!canEdit}
              value={form.radiusMeters}
              onChange={set('radiusMeters')}
            />
          </div>

          {canEdit && (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={MapPin}
                loading={locating}
                onClick={useMyLocation}
              >
                Acquire Current Location (GPS)
              </Button>
            </div>
          )}
        </div>
      </Card>

      {canEdit ? (
        <div className="pt-2">
          <Button type="submit" loading={saving}>
            Save Organization Settings
          </Button>
        </div>
      ) : (
        <p className="text-xs text-slate-500 font-mono">
          Settings are governed at the company level by Administrators.
        </p>
      )}
    </form>
  );
};
