/**
 * LoadingSpinner
 *
 * A branded loading indicator with two size modes:
 *   - Inline: rendered in-place (default)
 *   - Full-page overlay: centered over the viewport with a blurred backdrop
 *
 * Props:
 *   size     — 'sm' | 'md' | 'lg'  (default: 'md')
 *   fullPage — boolean              (default: false)
 *   label    — string               (optional caption for full-page mode)
 */

import React from 'react';

const SIZE_MAP = {
  sm: 'w-5 h-5',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

export default function LoadingSpinner({
  size     = 'md',
  fullPage = false,
  label    = 'Analysing symptoms...',
}) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  const spinner = (
    <div className={`relative ${sizeClass}`} role="status" aria-label="Loading">
      {/* Static background ring */}
      <div className={`absolute inset-0 rounded-full border-2 border-brand-500/20`} />
      {/* Spinning foreground arc */}
      <div
        className={`absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin`}
      />
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-surface-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          {label && (
            <p className="text-slate-400 text-sm animate-pulse">{label}</p>
          )}
        </div>
      </div>
    );
  }

  return spinner;
}
