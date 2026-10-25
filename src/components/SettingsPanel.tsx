import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { Alert, Field, Spinner, Button } from './ui';
import { OfficeLocationPicker } from './OfficeLocationPicker';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface SettingsData {
  companyName: string;
  officeStart: string;
  graceMinutes: number;
  halfDayHours: number;
  weekend: number[];
  office: { address?: string; lat: number | null; lng: number | null; radiusMeters: number };
}

/** Company profile, working hours, weekend days, and office geofence (M2 / functionality #01). */
export const SettingsPanel: React.FC<{ canEdit?: boolean }> = () => {
  const [data, setData] = useState<SettingsData | null>(null);
  const [officeLoc, setOfficeLoc] = useState({
    address: '',
    lat: '',
    lng: '',
    radiusMeters: '150',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get('/org/settings')
      .then((res) => {
        const s: SettingsData = res.data.settings;
        setData(s);
        setOfficeLoc({
          address: s.office?.address || '',
          lat: s.office?.lat != null ? String(s.office.lat) : '',
          lng: s.office?.lng != null ? String(s.office.lng) : '',
          radiusMeters: String(s.office?.radiusMeters ?? 150),
        });
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  if (!data) {
    return error ? (
      <Alert kind="error">{error}</Alert>
    ) : (
      <div className="surface-card rounded-2xl p-12 flex items-center justify-center gap-3 text-zinc-400">
        <Spinner className="w-5 h-5 text-zinc-200" />
        <span className="text-sm font-medium">Loading organization settings…</span>
      </div>
    );
  }

  const toggleDay = (d: number) => {
    const next = data.weekend.includes(d)
      ? data.weekend.filter((x) => x !== d)
      : [...data.weekend, d];
    setData({ ...data, weekend: next });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const hasCoords = officeLoc.lat.trim() !== '' && officeLoc.lng.trim() !== '';
      const res = await api.put('/org/settings', {
        companyName: data.companyName,
        officeStart: data.officeStart,
        graceMinutes: Number(data.graceMinutes),
        halfDayHours: Number(data.halfDayHours),
        weekend: data.weekend,
        office: {
          address: officeLoc.address.trim(),
          lat: hasCoords ? Number(officeLoc.lat) : null,
          lng: hasCoords ? Number(officeLoc.lng) : null,
          radiusMeters: Number(officeLoc.radiusMeters) || 150,
        },
      });
      setData(res.data.settings);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="surface-card rounded-2xl p-6 sm:p-8 space-y-6 max-w-3xl border border-zinc-800" noValidate>
      <div className="border-b border-zinc-800 pb-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Organization &amp; Attendance Governance</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Configure shift timing, late grace threshold, weekend rules, and office location perimeter.
        </p>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {saved && <Alert kind="success">Settings saved and synchronized across the organization.</Alert>}

      <Field
        id="companyName"
        label="Company Legal Name"
        value={data.companyName}
        onChange={(e) => setData({ ...data, companyName: e.target.value })}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <Field
          id="officeStart"
          type="time"
          label="Office Start Time"
          hint="24h format (e.g. 09:00)"
          value={data.officeStart}
          onChange={(e) => setData({ ...data, officeStart: e.target.value })}
        />
        <Field
          id="graceMinutes"
          type="number"
          min={0}
          max={120}
          label="Grace Window (min)"
          hint="Late threshold after start"
          value={data.graceMinutes}
          onChange={(e) => setData({ ...data, graceMinutes: Number(e.target.value) })}
        />
        <Field
          id="halfDayHours"
          type="number"
          min={1}
          max={12}
          label="Half-Day (< hours)"
          hint="Minimum hours for full day"
          value={data.halfDayHours}
          onChange={(e) => setData({ ...data, halfDayHours: Number(e.target.value) })}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-300">Weekend Days</span>
          <span className="text-[11px] font-mono text-zinc-500">Excluded from leave day deductions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((label, i) => {
            const on = data.weekend.includes(i);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(i)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  on
                    ? 'bg-zinc-100 border-zinc-100 text-zinc-950 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Office Location Picker (Best-Practice Address Search + GPS + Presets) */}
      <OfficeLocationPicker
        allowDisable
        value={officeLoc}
        onChange={setOfficeLoc}
      />

      <div className="pt-2 border-t border-zinc-800 flex justify-end">
        <Button type="submit" loading={saving} icon={Save}>
          Save Governance Rules
        </Button>
      </div>
    </form>
  );
};
