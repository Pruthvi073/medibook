/**
 * VitalsPage
 *
 * Allows users to log health vital readings (BP, blood sugar, heart rate, etc.)
 * and view trends over time via Recharts line charts.
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

// ── Vital field definitions ────────────────────────────────────
const VITALS_DEF = [
  { key: 'bloodPressureSystolic',  label: 'BP Systolic',  unit: 'mmHg', color: '#f43f5e', min: 60,  max: 250, normal: '90–120' },
  { key: 'bloodPressureDiastolic', label: 'BP Diastolic', unit: 'mmHg', color: '#f97316', min: 40,  max: 150, normal: '60–80'  },
  { key: 'bloodSugar',             label: 'Blood Sugar',  unit: 'mg/dL', color: '#eab308', min: 0,   max: 600, normal: '70–140' },
  { key: 'heartRate',              label: 'Heart Rate',   unit: 'bpm',  color: '#ec4899', min: 30,  max: 250, normal: '60–100' },
  { key: 'spO2',                   label: 'SpO₂',         unit: '%',    color: '#6366f1', min: 50,  max: 100, normal: '95–100' },
  { key: 'temperature',            label: 'Temperature',  unit: '°C',   color: '#14b8a6', min: 30,  max: 45,  normal: '36–37.5' },
  { key: 'weight',                 label: 'Weight',       unit: 'kg',   color: '#a855f7', min: 1,   max: 500, normal: 'varies' },
];

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const formatFull = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const BLANK_FORM = {
  recordedAt: new Date().toISOString().slice(0, 16),
  bloodPressureSystolic: '', bloodPressureDiastolic: '',
  bloodSugar: '', heartRate: '', spO2: '',
  temperature: '', weight: '', notes: '',
};

// Custom Recharts tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, padding: '10px 14px', fontSize: 12,
    }}>
      <p style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function VitalsPage() {
  const [vitals, setVitals]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState(BLANK_FORM);
  const [showForm, setShowForm]   = useState(false);
  const [activeChart, setActiveChart] = useState('bloodPressureSystolic');
  const [deleting, setDeleting]   = useState(null);

  // ── Fetch vitals ─────────────────────────────────────────────
  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const { data } = await api.get('/vitals');
        setVitals(data.data);
      } catch {
        toast.error('Failed to load vitals.');
      } finally {
        setLoading(false);
      }
    };
    fetchVitals();
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Add vital ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    VITALS_DEF.forEach(({ key }) => {
      if (form[key] !== '') payload[key] = parseFloat(form[key]);
    });
    payload.recordedAt = form.recordedAt;
    if (form.notes) payload.notes = form.notes;

    if (Object.keys(payload).filter((k) => k !== 'recordedAt').length === 0) {
      toast.error('Please enter at least one vital measurement.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post('/vitals', payload);
      setVitals((prev) => [data.data, ...prev]);
      setForm(BLANK_FORM);
      setShowForm(false);
      toast.success('Vital reading saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vitals.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete vital ──────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/vitals/${id}`);
      setVitals((prev) => prev.filter((v) => v._id !== id));
      toast.success('Record deleted.');
    } catch {
      toast.error('Failed to delete.');
    } finally {
      setDeleting(null);
    }
  };

  // ── Chart data (chronological) ────────────────────────────────
  const chartData = [...vitals]
    .reverse()
    .filter((v) => v[activeChart] != null)
    .map((v) => ({
      date: formatDate(v.recordedAt || v.createdAt),
      [VITALS_DEF.find((d) => d.key === activeChart)?.label]: v[activeChart],
    }));

  const activeDef = VITALS_DEF.find((d) => d.key === activeChart);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Vitals <span className="gradient-text">Tracker</span>
          </h1>
          <p className="text-slate-400 mt-1.5">
            {vitals.length > 0
              ? `${vitals.length} reading${vitals.length !== 1 ? 's' : ''} on record`
              : 'Start logging your health vitals'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary py-2.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'}/>
          </svg>
          {showForm ? 'Cancel' : 'Log New Reading'}
        </button>
      </div>

      {/* ── Add form ─────────────────────────────────────────── */}
      {showForm && (
        <div className="glass-card p-6 mb-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-white mb-5">New Vital Reading</h2>
          <form onSubmit={handleSubmit}>
            {/* Date/time */}
            <div className="mb-5">
              <label className="form-label">Date & Time</label>
              <input
                type="datetime-local"
                name="recordedAt"
                value={form.recordedAt}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            {/* Vitals grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
              {VITALS_DEF.map(({ key, label, unit, min, max }) => (
                <div key={key}>
                  <label className="form-label text-xs">
                    {label} <span className="text-slate-600">({unit})</span>
                  </label>
                  <input
                    type="number"
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                    placeholder={`${min}–${max}`}
                    min={min}
                    max={max}
                    step="0.1"
                    className="form-input"
                  />
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="mb-5">
              <label className="form-label">Notes (optional)</label>
              <input
                type="text"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="e.g. After breakfast, post-exercise..."
                className="form-input"
                maxLength={500}
              />
            </div>

            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>Saving...</>
              ) : 'Save Reading'}
            </button>
          </form>
        </div>
      )}

      {vitals.length > 0 && (
        <>
          {/* ── Chart section ──────────────────────────────── */}
          <div className="glass-card p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-white">Trends</h2>
              <div className="flex flex-wrap gap-2">
                {VITALS_DEF.filter((d) => vitals.some((v) => v[d.key] != null)).map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setActiveChart(d.key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      activeChart === d.key
                        ? 'text-white border'
                        : 'bg-white/5 text-slate-500 border border-white/10 hover:bg-white/10'
                    }`}
                    style={activeChart === d.key ? { background: d.color + '33', borderColor: d.color + '80', color: d.color } : {}}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {chartData.length < 2 ? (
              <p className="text-slate-500 text-sm text-center py-8">
                Add at least 2 readings to see a trend chart.
              </p>
            ) : (
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      unit={` ${activeDef?.unit}`}
                      width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey={activeDef?.label}
                      stroke={activeDef?.color}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: activeDef?.color, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Normal range hint */}
            {activeDef && (
              <p className="text-xs text-slate-600 mt-2 text-right">
                Normal range: {activeDef.normal} {activeDef.unit}
              </p>
            )}
          </div>

          {/* ── Summary cards ────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {VITALS_DEF.filter((d) => vitals.some((v) => v[d.key] != null)).map((d) => {
              const latest = vitals.find((v) => v[d.key] != null);
              return (
                <div key={d.key} className="glass-card p-4 animate-slide-up">
                  <p className="text-xs text-slate-500 mb-1">{d.label}</p>
                  <p className="text-2xl font-bold" style={{ color: d.color }}>
                    {latest[d.key]}
                  </p>
                  <p className="text-xs text-slate-600">{d.unit}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── History table ───────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/8">
          <h2 className="text-lg font-semibold text-white">Reading History</h2>
        </div>

        {vitals.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-brand-600/10 flex items-center justify-center mb-4 animate-float">
              <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </div>
            <p className="text-white font-semibold mb-1">No vitals logged yet</p>
            <p className="text-slate-400 text-sm mb-5">Start tracking your health by logging your first reading.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Log First Reading
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">BP</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sugar</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">HR</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">SpO₂</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Temp</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Weight</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {vitals.map((v, idx) => (
                  <tr key={v._id} className="hover:bg-white/3 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 0.03}s` }}>
                    <td className="px-5 py-3">
                      <p className="text-white text-xs font-medium">{formatFull(v.recordedAt || v.createdAt)}</p>
                      {v.notes && <p className="text-slate-600 text-xs mt-0.5 truncate max-w-[140px]">{v.notes}</p>}
                    </td>
                    <td className="px-3 py-3 text-center text-rose-400 font-mono text-xs">
                      {v.bloodPressureSystolic && v.bloodPressureDiastolic
                        ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`
                        : v.bloodPressureSystolic ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-center text-amber-400 font-mono text-xs">{v.bloodSugar ?? '—'}</td>
                    <td className="px-3 py-3 text-center text-pink-400 font-mono text-xs">{v.heartRate ?? '—'}</td>
                    <td className="px-3 py-3 text-center text-indigo-400 font-mono text-xs">{v.spO2 ? `${v.spO2}%` : '—'}</td>
                    <td className="px-3 py-3 text-center text-teal-400 font-mono text-xs">{v.temperature ? `${v.temperature}°C` : '—'}</td>
                    <td className="px-3 py-3 text-center text-purple-400 font-mono text-xs">{v.weight ? `${v.weight}kg` : '—'}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleDelete(v._id)}
                        disabled={deleting === v._id}
                        className="text-slate-600 hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
