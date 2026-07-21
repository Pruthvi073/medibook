/**
 * DashboardPage  (Symptom Predictor)
 *
 * The main protected page where users:
 *  1. Search and select symptoms from the full catalogue
 *  2. View selected symptoms as removable chips
 *  3. Submit for ML disease prediction
 *
 * Symptoms are fetched from GET /api/symptoms on mount.
 * Prediction is submitted to POST /api/diagnose.
 * On success the user is navigated to /results with the prediction data.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DashboardPage() {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  // ── State ────────────────────────────────────────────────
  const [allSymptoms, setAllSymptoms]         = useState([]);   // { id, symptom_name, display_name }[]
  const [selected, setSelected]               = useState([]);   // symptom_name string[]
  const [search, setSearch]                   = useState('');
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [predicting, setPredicting]           = useState(false);

  // ── Fetch symptom catalogue on mount ─────────────────────
  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const { data } = await api.get('/symptoms');
        setAllSymptoms(data.data);
      } catch (err) {
        console.error('[DashboardPage] fetchSymptoms:', err);
        toast.error('Failed to load symptoms. Please refresh the page.');
      } finally {
        setLoadingSymptoms(false);
      }
    };
    fetchSymptoms();
  }, []);

  // ── Filtered symptom list (derived from search query) ────
  const filteredSymptoms = useMemo(() => {
    if (!search.trim()) return allSymptoms;
    const q = search.toLowerCase();
    return allSymptoms.filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        s.symptomName.replace(/_/g, ' ').includes(q),
    );
  }, [allSymptoms, search]);

  // ── Helpers ──────────────────────────────────────────────
  const toggleSymptom = (name) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );

  const removeSymptom = (name) =>
    setSelected((prev) => prev.filter((s) => s !== name));

  const getDisplayName = (name) =>
    allSymptoms.find((s) => s.symptomName === name)?.displayName ||
    name.replace(/_/g, ' ');

  const clearAll = () => {
    setSelected([]);
    setSearch('');
  };

  // ── Submit for prediction ─────────────────────────────────
  const handlePredict = async () => {
    if (selected.length === 0) {
      toast.error('Please select at least one symptom');
      return;
    }
    if (selected.length === 1) {
      toast('Selecting more symptoms improves accuracy', { icon: '💡' });
    }
    setPredicting(true);
    try {
      const { data } = await api.post('/diagnose', { symptoms: selected });
      toast.success('Prediction complete!');
      // Pass the result and original symptom list via router state
      navigate('/results', { state: { result: data.data, symptoms: selected } });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Prediction failed. Is the ML service running on port 5001?';
      toast.error(msg);
    } finally {
      setPredicting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────
  if (loadingSymptoms) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 animate-pulse">Loading symptom database...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Symptom <span className="gradient-text">Checker</span>
        </h1>
        <p className="text-slate-400 mt-2">
          Hello, <span className="text-slate-200 font-medium">{user?.name}</span>.
          Select all symptoms you are currently experiencing and our AI will analyse them instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left panel: Symptom library ──────────────────── */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              {/* Clipboard icon */}
              <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Symptom Library
              <span className="ml-1 text-sm font-normal text-slate-500">
                ({filteredSymptoms.length} of {allSymptoms.length})
              </span>
            </h2>
            {selected.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              id="symptom-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symptoms (e.g. fever, headache, cough...)"
              className="form-input pl-10"
            />
          </div>

          {/* Symptom grid */}
          <div className="h-[420px] overflow-y-auto pr-1 scrollbar-hide">
            {filteredSymptoms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                <svg className="w-12 h-12 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-sm">No symptoms match &quot;{search}&quot;</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredSymptoms.map((symptom) => {
                  const isSelected = selected.includes(symptom.symptomName);
                  return (
                    <button
                      key={symptom.symptomName}
                      id={`symptom-${symptom.symptomName}`}
                      onClick={() => toggleSymptom(symptom.symptomName)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-150 ${
                        isSelected
                          ? 'bg-brand-600/25 border border-brand-500/50 text-brand-300'
                          : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:border-white/10'
                      }`}
                    >
                      {/* Custom checkbox */}
                      <span
                        className={`flex-shrink-0 w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center ${
                          isSelected
                            ? 'bg-brand-500 border-brand-500'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                      </span>
                      <span className="truncate">{symptom.displayName}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel: Selection + Predict ─────────────── */}
        <div className="space-y-4">

          {/* Selected symptoms card */}
          <div className="glass-card p-5">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Selected Symptoms
              {selected.length > 0 && (
                <span className="ml-auto text-xs bg-brand-600/30 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded-full font-medium">
                  {selected.length}
                </span>
              )}
            </h2>

            {selected.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 mx-auto text-slate-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                <p className="text-sm text-slate-500">
                  No symptoms selected.<br/>
                  Click any item from the list.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto scrollbar-hide">
                {selected.map((name) => (
                  <span key={name} className="symptom-chip">
                    {getDisplayName(name)}
                    <button
                      onClick={() => removeSymptom(name)}
                      className="text-brand-500 hover:text-brand-300 transition-colors"
                      aria-label={`Remove ${name}`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Predict card */}
          <div className="glass-card p-5">
            {/* Disclaimer banner */}
            <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                Results are <strong className="text-amber-300">preliminary only</strong> and
                not a substitute for professional medical advice.
              </p>
            </div>

            {/* Predict button */}
            <button
              id="btn-predict"
              onClick={handlePredict}
              disabled={predicting || selected.length === 0}
              className="btn-primary w-full text-base py-3.5"
            >
              {predicting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Analysing...
                </>
              ) : (
                <>
                  {/* Lightbulb / brain icon */}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                  Predict Disease
                </>
              )}
            </button>

            {selected.length > 0 && (
              <p className="text-xs text-slate-500 text-center mt-3">
                Using {selected.length} symptom{selected.length !== 1 ? 's' : ''} for prediction
              </p>
            )}
          </div>

          {/* Tips card */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">💡 Tips for best results</h3>
            <ul className="text-xs text-slate-500 space-y-1.5">
              <li>• Select <strong className="text-slate-400">3 or more</strong> symptoms for higher accuracy</li>
              <li>• Use the <strong className="text-slate-400">search bar</strong> to quickly find symptoms</li>
              <li>• All results are saved to your <strong className="text-slate-400">History</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
