import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X, FolderTree } from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { Alert, Field, Spinner, Button, EmptyState } from './ui';

export interface CatalogField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'checkbox';
  placeholder?: string;
  /** Disable this input when another field value is truthy (e.g. quota when unlimited). */
  disabledWhen?: string;
  defaultValue?: string | number | boolean;
}

export interface CatalogColumn {
  header: string;
  render: (item: any) => React.ReactNode;
}

interface Props {
  entity: string; // API segment: departments | designations | leave-types | holidays
  singular: string;
  fields: CatalogField[];
  columns: CatalogColumn[];
  canEdit: boolean;
  emptyHint: string;
}

const blankValues = (fields: CatalogField[]) =>
  Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? (f.type === 'checkbox' ? false : '')]));

/** Generic list + add/edit/delete panel used by every Admin-managed catalog. */
export const CatalogPanel: React.FC<Props> = ({ entity, singular, fields, columns, canEdit, emptyHint }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [values, setValues] = useState<Record<string, any>>(blankValues(fields));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.get(`/org/catalog/${entity}`);
      setItems(res.data.items);
    } catch (e) {
      setLoadError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setValues(blankValues(fields));
    setFormError('');
    setEditing('new');
  };

  const openEdit = (item: any) => {
    setValues({ ...blankValues(fields), ...Object.fromEntries(fields.map((f) => [f.key, item[f.key]])) });
    setFormError('');
    setEditing(item._id);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    const payload = Object.fromEntries(
      fields.map((f) => [f.key, f.type === 'number' ? (values[f.key] === '' ? '' : Number(values[f.key])) : values[f.key]])
    );
    try {
      if (editing === 'new') await api.post(`/org/catalog/${entity}`, payload);
      else await api.put(`/org/catalog/${entity}/${editing}`, payload);
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: any) => {
    if (!window.confirm(`Delete this ${singular.toLowerCase()}?`)) return;
    try {
      await api.delete(`/org/catalog/${entity}/${item._id}`);
      await load();
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{singular} Directory</span>
          <span className="text-xs font-mono text-slate-400 bg-surface-raised px-2 py-0.5 rounded-full border border-white/5">
            {items.length} {items.length === 1 ? 'record' : 'records'}
          </span>
        </div>
        {canEdit && (
          <Button onClick={openNew} icon={Plus} size="sm">
            Add {singular}
          </Button>
        )}
      </div>

      {loadError && <Alert kind="error">{loadError}</Alert>}

      {/* Inline Creation / Edit Form */}
      {editing && (
        <form
          onSubmit={submit}
          className="surface-card rounded-2xl p-6 border-brand-500/30 space-y-5"
          noValidate
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-white tracking-tight">
              {editing === 'new' ? `Create ${singular}` : `Edit ${singular}`}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              aria-label="Close form"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && <Alert kind="error">{formError}</Alert>}

          <div className="grid sm:grid-cols-2 gap-5">
            {fields.map((f) =>
              f.type === 'checkbox' ? (
                <div key={f.key} className="flex items-center sm:pt-6">
                  <label className="relative flex items-center gap-3 cursor-pointer select-none text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={!!values[f.key]}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 bg-surface-input text-brand-600 focus:ring-brand-500"
                    />
                    <span className="font-medium">{f.label}</span>
                  </label>
                </div>
              ) : (
                <Field
                  key={f.key}
                  id={`${entity}-${f.key}`}
                  label={f.label}
                  type={f.type}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ''}
                  disabled={!!f.disabledWhen && !!values[f.disabledWhen]}
                  min={f.type === 'number' ? 0 : undefined}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              )
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              Save {singular}
            </Button>
          </div>
        </form>
      )}

      {/* Catalog Table */}
      <div className="surface-card rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surface-raised/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {columns.map((c) => (
                  <th key={c.header} className="px-5 py-3.5 font-semibold">
                    {c.header}
                  </th>
                ))}
                {canEdit && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (canEdit ? 1 : 0)} className="px-5 py-12 text-center text-slate-400">
                    <Spinner className="inline w-5 h-5 mr-2 text-brand-500" />
                    Loading records…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (canEdit ? 1 : 0)} className="p-8">
                    <EmptyState
                      icon={FolderTree}
                      title={`No ${singular.toLowerCase()}s recorded`}
                      description={emptyHint}
                      action={
                        canEdit && (
                          <Button onClick={openNew} icon={Plus} size="sm">
                            Add first {singular.toLowerCase()}
                          </Button>
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {columns.map((c) => (
                      <td key={c.header} className="px-5 py-4 text-slate-200">
                        {c.render(item)}
                      </td>
                    ))}
                    {canEdit && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(item)}
                            title={`Edit ${singular}`}
                            aria-label={`Edit ${singular}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => remove(item)}
                            title={`Delete ${singular}`}
                            aria-label={`Delete ${singular}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
