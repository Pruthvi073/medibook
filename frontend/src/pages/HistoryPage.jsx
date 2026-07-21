/**
 * HistoryPage
 *
 * Fetches and displays the authenticated user's past disease predictions
 * from GET /api/history.
 *
 * Features:
 *  - Loading skeleton state
 *  - Empty state with CTA
 *  - Expandable accordion rows showing symptoms and precautions
 *  - Confidence badges colour-coded by level
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

// ── Helper: format ISO timestamp for display ──────────────────
const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ── Helper: confidence badge styles ──────────────────────────
const getConfStyle = (conf) => {
  const c = parseFloat(conf);
  if (c >= 75) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
  if (c >= 50) return 'text-amber-400  bg-amber-500/10  border-amber-500/25';
  return              'text-rose-400   bg-rose-500/10   border-rose-500/25';
};

// ── Helper: safely parse JSON or return array as-is ───────────
const safeParse = (val) => {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || '[]'); } catch { return []; }
};

export default function HistoryPage() {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null); // ID of the currently expanded row

  // ── Fetch history on mount ────────────────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/history');
        setHistory(data.data);
      } catch (err) {
        console.error('[HistoryPage] fetchHistory:', err);
        toast.error('Failed to load your prediction history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 animate-pulse">Loading your history...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Prediction <span className="gradient-text">History</span>
          </h1>
          <p className="text-slate-400 mt-1.5">
            {history.length > 0
              ? `${history.length} past prediction${history.length !== 1 ? 's' : ''} on record`
              : 'No predictions yet'}
          </p>
        </div>
        <Link to="/" className="btn-primary py-2.5 sm:self-start">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          New Prediction
        </Link>
      </div>

      {/* ── Empty state ──────────────────────────────────────── */}
      {history.length === 0 ? (
        <div className="glass-card p-16 text-center animate-slide-up">
          <div className="w-20 h-20 mx-auto rounded-full bg-brand-600/15 flex items-center justify-center mb-5 animate-float">
            <svg className="w-10 h-10 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No predictions yet</h2>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            Head over to the Symptom Checker and get your first AI-powered disease prediction.
          </p>
          <Link to="/" className="btn-primary">Start Predicting</Link>
        </div>
      ) : (
        /* ── History list ────────────────────────────────────── */
        <div className="space-y-3">
          {history.map((entry, idx) => {
            const symptoms    = safeParse(entry.symptoms_used);
            const precautions = safeParse(entry.precautions);
            const isExpanded  = expanded === entry.id;

            return (
              <div
                key={entry.id}
                className="glass-card overflow-hidden animate-slide-up"
                style={{ animationDelay: `${Math.min(idx * 0.04, 0.4)}s` }}
              >
                {/* ── Row header (always visible) ────────────── */}
                <button
                  id={`history-item-${entry.id}`}
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/3 transition-colors"
                >
                  {/* Index badge */}
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-600/20 text-brand-400 text-sm font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>

                  {/* Disease + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{entry.predicted_disease}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {symptoms.length} symptom{symptoms.length !== 1 ? 's' : ''}
                      {' '}•{' '}
                      {formatDate(entry.created_at)}
                    </p>
                  </div>

                  {/* Confidence badge */}
                  <span
                    className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${getConfStyle(entry.confidence)}`}
                  >
                    {parseFloat(entry.confidence).toFixed(0)}%
                  </span>

                  {/* Expand / collapse chevron */}
                  <svg
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                {/* ── Expanded detail panel ─────────────────── */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-white/8 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">

                      {/* Symptoms used */}
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Symptoms Used
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {symptoms.map((sym) => (
                            <span
                              key={sym}
                              className="px-2 py-1 text-xs rounded-full bg-purple-600/15 text-purple-400 border border-purple-500/20"
                            >
                              {sym.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Key precautions (top 3) */}
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Key Precautions
                        </h3>
                        <ol className="space-y-1.5">
                          {precautions.slice(0, 3).map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-brand-600/20 text-brand-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{p}</span>
                            </li>
                          ))}
                          {precautions.length > 3 && (
                            <p className="text-xs text-slate-600 ml-6">
                              +{precautions.length - 3} more precaution{precautions.length - 3 !== 1 ? 's' : ''}
                            </p>
                          )}
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
