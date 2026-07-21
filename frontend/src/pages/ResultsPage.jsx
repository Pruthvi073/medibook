/**
 * ResultsPage
 *
 * Displays the ML prediction result received from /api/diagnose.
 * Data is passed via React Router's location.state (no extra fetch required).
 *
 * Sections:
 *  - Disease name + urgency banner
 *  - Confidence percentage dial
 *  - Health Precautions ordered list
 *  - Symptoms used chips
 *  - Action buttons (New Prediction / View History)
 */

import React, { useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';

// ─────────────────────────────────────────────────────────────
// Disease metadata — urgency level and emoji icon
// ─────────────────────────────────────────────────────────────
const DISEASE_META = {
  'Heart attack':             { urgency: 'critical', icon: '🚨' },
  'Tuberculosis':             { urgency: 'high',     icon: '⚠️' },
  'Pneumonia':                { urgency: 'high',     icon: '🫁' },
  'Dengue':                   { urgency: 'high',     icon: '🦟' },
  'Malaria':                  { urgency: 'high',     icon: '🦟' },
  'Typhoid':                  { urgency: 'medium',   icon: '🌡️' },
  'Diabetes':                 { urgency: 'medium',   icon: '🩺' },
  'Hypertension':             { urgency: 'medium',   icon: '❤️' },
  'Hepatitis B':              { urgency: 'medium',   icon: '🧬' },
  'Hepatitis A':              { urgency: 'medium',   icon: '🧬' },
  'Jaundice':                 { urgency: 'medium',   icon: '💛' },
  'Bronchial Asthma':         { urgency: 'medium',   icon: '💨' },
  'Common Cold':              { urgency: 'low',      icon: '🤧' },
  'Allergy':                  { urgency: 'low',      icon: '🌿' },
  'Acne':                     { urgency: 'low',      icon: '✨' },
  'Fungal infection':         { urgency: 'low',      icon: '🍄' },
  'Migraine':                 { urgency: 'low',      icon: '🧠' },
  'GERD':                     { urgency: 'low',      icon: '🔥' },
  'Chicken pox':              { urgency: 'medium',   icon: '🔴' },
  'Urinary tract infection':  { urgency: 'medium',   icon: '💊' },
  'Arthritis':                { urgency: 'medium',   icon: '🦴' },
  'Varicose veins':           { urgency: 'low',      icon: '🩹' },
  'Hypothyroidism':           { urgency: 'medium',   icon: '🦋' },
  'Hyperthyroidism':          { urgency: 'medium',   icon: '⚡' },
  'Psoriasis':                { urgency: 'low',      icon: '🧴' },
  'Impetigo':                 { urgency: 'low',      icon: '🩺' },
};

// Visual styles per urgency level
const URGENCY_CONFIG = {
  critical: {
    text:      'Seek emergency medical care immediately',
    bg:        'bg-rose-500/20',
    border:    'border-rose-500/40',
    textColor: 'text-rose-400',
  },
  high: {
    text:      'Seek medical attention promptly',
    bg:        'bg-orange-500/15',
    border:    'border-orange-500/30',
    textColor: 'text-orange-400',
  },
  medium: {
    text:      'Consult a doctor soon',
    bg:        'bg-amber-500/15',
    border:    'border-amber-500/30',
    textColor: 'text-amber-400',
  },
  low: {
    text:      'Monitor symptoms; see a GP if they persist',
    bg:        'bg-emerald-500/15',
    border:    'border-emerald-500/30',
    textColor: 'text-emerald-400',
  },
};

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  // Guard: no result in state → redirect to dashboard
  if (!state?.result) {
    navigate('/', { replace: true });
    return null;
  }

  const { result, symptoms } = state;
  const { disease, confidence, precautions, created_at } = result;

  // Look up metadata (default to medium urgency)
  const meta   = DISEASE_META[disease] || { urgency: 'medium', icon: '🩺' };
  const urgCfg = URGENCY_CONFIG[meta.urgency];

  // Confidence dial colour
  const confColor = confidence >= 75 ? 'text-emerald-400' : confidence >= 50 ? 'text-amber-400' : 'text-rose-400';
  const confRing  = confidence >= 75 ? 'border-emerald-500' : confidence >= 50 ? 'border-amber-500' : 'border-rose-500';

  // ── PDF Export ──────────────────────────────────────────────
  const downloadPDF = useCallback(() => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MediBook — Health Report', 14, 18);

    // Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageW - 14, 18, { align: 'right' });

    let y = 40;
    doc.setTextColor(30, 41, 59);

    // Disease
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(`Predicted Condition: ${disease}`, 14, y);
    y += 10;

    // Confidence
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Confidence Score: ${confidence.toFixed(1)}%  |  Urgency: ${meta.urgency.toUpperCase()}`, 14, y);
    y += 14;

    // Precautions
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Health Precautions:', 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    precautions.forEach((p, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${p}`, pageW - 28);
      doc.text(lines, 14, y);
      y += lines.length * 6 + 2;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    // Symptoms
    y += 6;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Symptoms Reported:', 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const sympText = (symptoms || []).map((s) => s.replace(/_/g, ' ')).join(', ');
    const sympLines = doc.splitTextToSize(sympText, pageW - 28);
    doc.text(sympLines, 14, y);
    y += sympLines.length * 6 + 14;

    // Disclaimer
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(12, y, pageW - 24, 22, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const disc = 'DISCLAIMER: This report is generated by a machine learning model for informational purposes only. It is not a medical diagnosis. Always consult a qualified healthcare professional.';
    const discLines = doc.splitTextToSize(disc, pageW - 30);
    doc.text(discLines, 16, y + 7);

    doc.save(`MediBook_${disease.replace(/\s+/g, '_')}_Report.pdf`);
  }, [disease, confidence, precautions, symptoms, meta.urgency]);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* ── Back button ─────────────────────────────────────── */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        New Prediction
      </button>

      {/* ── Primary result card ──────────────────────────────── */}
      <div className="glass-card p-8 mb-6 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">

          {/* Disease name + urgency */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-5xl">{meta.icon}</span>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  Predicted Condition
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  {disease}
                </h1>
              </div>
            </div>

            {/* Urgency banner */}
            <div className={`inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-full text-sm font-medium border ${urgCfg.bg} ${urgCfg.border} ${urgCfg.textColor}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              {urgCfg.text}
            </div>

            {created_at && (
              <p className="text-xs text-slate-600 mt-4">
                Predicted on {new Date(created_at).toLocaleString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </div>

          {/* Confidence dial */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className={`w-28 h-28 rounded-full border-4 ${confRing} flex flex-col items-center justify-center bg-surface-800`}>
              <span className={`text-3xl font-bold ${confColor}`}>
                {confidence.toFixed(0)}%
              </span>
              <span className="text-xs text-slate-500 mt-0.5">confidence</span>
            </div>
            <p className="text-xs text-slate-500 text-center max-w-[112px]">
              Model confidence score
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Precautions card ─────────────────────────────── */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            Health Precautions &amp; Recommendations
          </h2>
          <ol className="space-y-3">
            {precautions.map((p, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600/20 text-brand-400 text-xs font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-sm text-slate-300 leading-relaxed">{p}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Symptoms used + disclaimer ────────────────────── */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            Symptoms Used ({symptoms?.length || 0})
          </h2>

          <div className="flex flex-wrap gap-2 mb-6">
            {(symptoms || []).map((sym) => (
              <span
                key={sym}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-600/15 text-purple-400 border border-purple-500/25"
              >
                {sym.replace(/_/g, ' ')}
              </span>
            ))}
          </div>

          {/* Medical disclaimer */}
          <div className="p-4 rounded-xl bg-white/3 border border-white/8">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-400">⚠️ Medical Disclaimer:</strong>{' '}
              These results are generated by a machine learning model trained on
              symptom-disease patterns. They are for <strong className="text-slate-400">informational purposes only</strong> and
              do not constitute a medical diagnosis. Always consult a qualified
              healthcare professional for any health concerns.
            </p>
          </div>
        </div>
      </div>

      {/* ── Action buttons ─────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row gap-3 mt-6 animate-slide-up"
        style={{ animationDelay: '0.3s' }}
      >
        <button
          id="btn-predict-again"
          onClick={() => navigate('/')}
          className="btn-primary flex-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          New Prediction
        </button>
        <button
          id="btn-download-pdf"
          onClick={downloadPDF}
          className="btn-secondary flex-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Download PDF
        </button>
        <Link
          to="/history"
          id="btn-view-history"
          className="btn-secondary flex-1 text-center"
        >
          <svg className="w-4 h-4 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          View History
        </Link>
      </div>
    </main>
  );
}
