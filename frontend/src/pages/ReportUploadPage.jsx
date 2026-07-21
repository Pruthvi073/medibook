/**
 * ReportUploadPage
 *
 * Allows users to upload medical reports (PDF or image).
 * The backend extracts text / sends to Gemini for AI analysis.
 * Displays: summary, conditions, key findings, diet plan, specialist recommendation.
 */

import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

// ── Urgency config ─────────────────────────────────────────────
const URGENCY = {
  critical: { label: 'Critical — Seek emergency care',  color: 'text-rose-400',    bg: 'bg-rose-500/15 border-rose-500/30' },
  high:     { label: 'High — See a doctor promptly',    color: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-500/30' },
  medium:   { label: 'Medium — Consult a doctor soon',  color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30' },
  low:      { label: 'Low — Monitor & follow up',       color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
};

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp';

export default function ReportUploadPage() {
  const navigate = useNavigate();

  const [file, setFile]           = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]       = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const inputRef = useRef(null);

  // ── File selection ─────────────────────────────────────────
  const handleFile = useCallback((f) => {
    if (!f) return;
    const allowed = ['application/pdf','image/jpeg','image/jpg','image/png','image/webp'];
    if (!allowed.includes(f.type)) {
      toast.error('Only PDF, JPG, PNG, or WEBP files are allowed.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum is 10 MB.');
      return;
    }
    setFile(f);
    setResult(null);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  // ── Upload & analyse ───────────────────────────────────────
  const handleUpload = async () => {
    if (!file) { toast.error('Please select a file first.'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('report', file);
      const { data } = await api.post('/reports/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setResult(data.data);
      setActiveTab('summary');
      toast.success('Report analysed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => { setFile(null); setResult(null); };

  const urgency = result ? (URGENCY[result.urgencyLevel] || URGENCY.medium) : null;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Medical <span className="gradient-text">Report Analysis</span>
        </h1>
        <p className="text-slate-400 mt-2">
          Upload a medical report (PDF or image) and our AI will summarise your condition,
          suggest a diet plan, and recommend the right specialist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: Upload panel ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Drop zone */}
          <div
            className={`glass-card p-6 text-center transition-all duration-200 cursor-pointer ${
              dragging ? 'border-brand-500/60 bg-brand-600/10' : ''
            }`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !file && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
              id="report-file-input"
            />

            {file ? (
              <div className="space-y-3">
                {/* File icon */}
                <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-600/20 flex items-center justify-center">
                  {file.type === 'application/pdf' ? (
                    <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  )}
                </div>
                <p className="text-sm font-medium text-white truncate px-2">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 flex items-center justify-center animate-float">
                  <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    {dragging ? 'Drop your file here' : 'Drag & drop or click to browse'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG, WEBP · Max 10 MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload button */}
          <button
            id="btn-analyse-report"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary w-full py-3.5 text-base"
          >
            {uploading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Analysing with AI...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                Analyse Report
              </>
            )}
          </button>

          {/* Info card */}
          <div className="glass-card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-300">What our AI does</h3>
            {[
              '📋 Summarises your medical findings in plain language',
              '🦠 Identifies conditions & diseases mentioned',
              '🥗 Creates a personalised diet & nutrition plan',
              '👨‍⚕️ Recommends the right specialist to visit',
              '🔬 Lists follow-up tests if needed',
            ].map((tip) => (
              <p key={tip} className="text-xs text-slate-500">{tip}</p>
            ))}
          </div>

          {/* Navigate to doctors */}
          {result && (
            <button
              onClick={() => navigate('/nearby')}
              className="btn-secondary w-full"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Find Nearby Doctors
            </button>
          )}
        </div>

        {/* ── RIGHT: Analysis result ─────────────────────────── */}
        <div className="lg:col-span-3">
          {!result ? (
            <div className="glass-card p-16 text-center h-full flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-brand-600/10 flex items-center justify-center mb-4 animate-float">
                <svg className="w-10 h-10 text-brand-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <p className="text-slate-500 text-sm">Upload a report to see AI analysis here</p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">

              {/* Urgency banner */}
              <div className={`glass-card p-4 border ${urgency.bg} flex items-center gap-3`}>
                <svg className={`w-5 h-5 flex-shrink-0 ${urgency.color}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className={`text-sm font-semibold ${urgency.color}`}>{urgency.label}</p>
                  {result.urgencyReason && <p className="text-xs text-slate-400 mt-0.5">{result.urgencyReason}</p>}
                </div>
              </div>

              {/* Tabs */}
              <div className="glass-card overflow-hidden">
                <div className="flex border-b border-white/8">
                  {[
                    { id: 'summary',  label: 'Summary'   },
                    { id: 'diet',     label: 'Diet Plan'  },
                    { id: 'findings', label: 'Findings'   },
                    { id: 'doctors',  label: 'Doctors'    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-600/10'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-6">

                  {/* Summary Tab */}
                  {activeTab === 'summary' && (
                    <div className="space-y-5 animate-fade-in">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">AI Summary</p>
                        <p className="text-slate-200 leading-relaxed text-sm">{result.summary}</p>
                      </div>

                      {result.conditions?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Identified Conditions</p>
                          <div className="flex flex-wrap gap-2">
                            {result.conditions.map((c) => (
                              <span key={c} className="px-3 py-1.5 rounded-full text-xs font-medium bg-rose-600/15 text-rose-400 border border-rose-500/25">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.specialistType && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-600/10 border border-brand-500/20">
                          <svg className="w-5 h-5 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          </svg>
                          <div>
                            <p className="text-xs text-slate-500">Recommended Specialist</p>
                            <p className="text-sm font-semibold text-brand-400">{result.specialistType}</p>
                          </div>
                        </div>
                      )}

                      {result.recommendedTests?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recommended Follow-up Tests</p>
                          <ul className="space-y-1.5">
                            {result.recommendedTests.map((t, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600/20 text-purple-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Diet Plan Tab */}
                  {activeTab === 'diet' && (
                    <div className="space-y-5 animate-fade-in">
                      {result.dietPlan?.generalAdvice && (
                        <p className="text-sm text-slate-300 italic border-l-2 border-brand-500 pl-3">
                          {result.dietPlan.generalAdvice}
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Foods to eat */}
                        <div>
                          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span>✅</span> Foods to Eat
                          </p>
                          <ul className="space-y-2">
                            {(result.dietPlan?.toEat || []).map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-300 p-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
                                <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">+</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Foods to avoid */}
                        <div>
                          <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span>❌</span> Foods to Avoid
                          </p>
                          <ul className="space-y-2">
                            {(result.dietPlan?.toAvoid || []).map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-300 p-2 rounded-lg bg-rose-500/8 border border-rose-500/15">
                                <span className="text-rose-400 font-bold flex-shrink-0 mt-0.5">–</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Key Findings Tab */}
                  {activeTab === 'findings' && (
                    <div className="space-y-3 animate-fade-in">
                      {(result.keyFindings || []).length === 0 ? (
                        <p className="text-slate-500 text-sm">No specific findings were extracted.</p>
                      ) : (
                        (result.keyFindings || []).map((f, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/8">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                            <p className="text-sm text-slate-300 leading-relaxed">{f}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Doctors & Hospitals Tab */}
                  {activeTab === 'doctors' && (
                    <div className="space-y-6 animate-fade-in">

                      {/* Recommended Doctors */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          </svg>
                          Recommended Doctors
                        </p>
                        {(result.recommendedDoctors || []).length === 0 ? (
                          <p className="text-slate-500 text-sm">Consult a General Practitioner for a referral.</p>
                        ) : (
                          <div className="space-y-3">
                            {(result.recommendedDoctors || []).map((doc, i) => (
                              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-brand-600/10 border border-brand-500/20">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-brand-300">{doc.role}</p>
                                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{doc.reason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Recommended Hospital Types */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                          </svg>
                          Recommended Hospitals / Clinics
                        </p>
                        {(result.hospitalTypes || []).length === 0 ? (
                          <p className="text-slate-500 text-sm">Visit your nearest general hospital OPD.</p>
                        ) : (
                          <div className="space-y-3">
                            {(result.hospitalTypes || []).map((hosp, i) => {
                              const urgencyStyles = {
                                'immediate':       'bg-rose-500/20 text-rose-300 border-rose-500/30',
                                'within a week':   'bg-amber-500/20 text-amber-300 border-amber-500/30',
                                'within a month':  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                              };
                              const urgencyStyle = urgencyStyles[hosp.urgency?.toLowerCase()] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
                              return (
                                <div key={i} className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-2">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <p className="text-sm font-semibold text-white">{hosp.type}</p>
                                    {hosp.urgency && (
                                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider ${urgencyStyle}`}>
                                        {hosp.urgency}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 leading-relaxed">{hosp.description}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Find nearby doctors button */}
                      <button
                        onClick={() => window.location.href = '/nearby'}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        Find Nearby Doctors & Hospitals
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-slate-600 text-center">
                ⚠️ AI analysis is for informational purposes only and is not a substitute for professional medical advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
