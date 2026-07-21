/**
 * EmergencySOSButton
 *
 * Fixed floating button at bottom-right that expands to show
 * emergency contact numbers and quick actions.
 */

import React, { useState } from 'react';

const EMERGENCY_CONTACTS = [
  { label: 'Ambulance (India)',    number: '108',      color: 'text-rose-400'   },
  { label: 'Emergency (All)',      number: '112',      color: 'text-rose-400'   },
  { label: 'Police',               number: '100',      color: 'text-blue-400'   },
  { label: 'Fire Brigade',         number: '101',      color: 'text-orange-400' },
  { label: 'Disaster Management',  number: '1078',     color: 'text-amber-400'  },
  { label: 'Mental Health (NIMHANS)', number: '080-46110007', color: 'text-purple-400' },
];

export default function EmergencySOSButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded contacts panel */}
      {open && (
        <div
          className="glass-card p-4 w-64 animate-slide-up shadow-2xl"
          style={{ border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(15,23,42,0.95)' }}
        >
          <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">
            🚨 Emergency Contacts
          </p>
          <div className="space-y-2">
            {EMERGENCY_CONTACTS.map((c) => (
              <a
                key={c.label}
                href={`tel:${c.number}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <span className="text-xs text-slate-400 group-hover:text-slate-200">{c.label}</span>
                <span className={`text-sm font-bold ${c.color}`}>{c.number}</span>
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3 text-center">
            Tap a number to call
          </p>
        </div>
      )}

      {/* SOS button */}
      <button
        id="btn-emergency-sos"
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-95"
        style={{
          background: open
            ? 'linear-gradient(135deg, #7f1d1d, #991b1b)'
            : 'linear-gradient(135deg, #dc2626, #f43f5e)',
          boxShadow: '0 0 24px rgba(244,63,94,0.5)',
        }}
        title="Emergency SOS"
        aria-label="Emergency SOS contacts"
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        ) : (
          <span className="text-white font-bold text-sm tracking-tight">SOS</span>
        )}
      </button>
    </div>
  );
}
