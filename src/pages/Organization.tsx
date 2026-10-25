import React, { useState } from 'react';
import { Sliders, Building2, Award, CalendarDays, Palmtree, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SettingsPanel } from '../components/SettingsPanel';
import { CatalogPanel, CatalogField, CatalogColumn } from '../components/CatalogPanel';
import { ShiftAssignmentPanel } from '../components/ShiftAssignmentPanel';
import { PageHeader, Badge } from '../components/ui';

const nameField: CatalogField = { key: 'name', label: 'Title / Name', type: 'text', placeholder: 'Enter name' };
const nameCol: CatalogColumn = {
  header: 'Name',
  render: (i) => <span className="font-semibold text-white">{i.name}</span>,
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const TABS = [
  { id: 'settings', label: 'Company Settings', icon: Sliders },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'shifts', label: 'Shift Assignment', icon: Clock },
  { id: 'designations', label: 'Designations', icon: Award },
  { id: 'leave-types', label: 'Leave Types', icon: Palmtree },
  { id: 'holidays', label: 'Public Holidays', icon: CalendarDays },
] as const;

export const Organization: React.FC = () => {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';
  const canAssignShifts = user?.role === 'admin' || user?.role === 'hr';
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>(user?.role === 'hr' ? 'shifts' : 'settings');

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Departments & Organization Setup"
        subtitle={
          canEdit
            ? 'Configure core entity policies, operational departments, shift assignments, designations, and leave quotas.'
            : 'Assign department and employee work shifts, and view organizational policies established by Administrators.'
        }
        badge={
          <Badge variant={canEdit || tab === 'shifts' ? 'indigo' : 'slate'}>
            {canEdit ? 'Administrative Access' : tab === 'shifts' ? 'HR Shift Assignment Access' : 'HR View & Shift Control'}
          </Badge>
        }
      />

      {/* Tabs navigation */}
      <div role="tablist" className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                active
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div className="pt-2">
        {tab === 'settings' && <SettingsPanel canEdit={canEdit} />}

        {tab === 'departments' && (
          <CatalogPanel
            entity="departments"
            singular="Department"
            canEdit={canEdit}
            fields={[nameField]}
            columns={[nameCol]}
            emptyHint="No departments created yet. Add Engineering, Human Resources, or Sales to group employees."
          />
        )}

        {tab === 'shifts' && <ShiftAssignmentPanel canAssign={canAssignShifts} />}

        {tab === 'designations' && (
          <CatalogPanel
            entity="designations"
            singular="Designation"
            canEdit={canEdit}
            fields={[nameField]}
            columns={[nameCol]}
            emptyHint="No job designations created yet. Add Senior Engineer, HR Manager, or Team Lead."
          />
        )}

        {tab === 'leave-types' && (
          <CatalogPanel
            entity="leave-types"
            singular="Leave Type"
            canEdit={canEdit}
            fields={[
              { key: 'name', label: 'Policy Name', type: 'text', placeholder: 'e.g. Annual, Sick, Casual' },
              { key: 'annualQuota', label: 'Annual Days Quota', type: 'number', disabledWhen: 'unlimited', defaultValue: 0 },
              { key: 'isPaid', label: 'Paid Leave Benefit', type: 'checkbox', defaultValue: true },
              { key: 'unlimited', label: 'Unlimited (No Quota Cap)', type: 'checkbox' },
            ]}
            columns={[
              nameCol,
              {
                header: 'Annual Allocation',
                render: (i) => (
                  <span className="num-tabular font-medium text-slate-300">
                    {i.unlimited ? 'Unlimited' : `${i.annualQuota} days / yr`}
                  </span>
                ),
              },
              {
                header: 'Classification',
                render: (i) =>
                  i.isPaid ? (
                    <Badge variant="emerald">Paid</Badge>
                  ) : (
                    <Badge variant="slate">Unpaid</Badge>
                  ),
              },
            ]}
            emptyHint="No leave types defined. Add Annual, Sick, Casual, or Unpaid leave policies."
          />
        )}

        {tab === 'holidays' && (
          <CatalogPanel
            entity="holidays"
            singular="Public Holiday"
            canEdit={canEdit}
            fields={[
              { key: 'name', label: 'Holiday Name', type: 'text', placeholder: 'e.g. Eid-ul-Fitr, Independence Day' },
              { key: 'date', label: 'Observed Date', type: 'date' },
            ]}
            columns={[
              nameCol,
              {
                header: 'Calendar Date',
                render: (i) => (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-brand-300 bg-brand-500/10 px-2 py-1 rounded border border-brand-500/20">
                      {i.date}
                    </span>
                    <span className="text-slate-400 text-xs">{i.date ? formatDate(i.date) : ''}</span>
                  </div>
                ),
              },
            ]}
            emptyHint="No public holidays registered. Dates added here are automatically skipped during leave deductions."
          />
        )}
      </div>
    </div>
  );
};

export default Organization;
