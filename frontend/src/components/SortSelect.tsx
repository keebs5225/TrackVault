// frontend/src/components/SortSelect.tsx
import React from 'react';

// ── Sort option type ──────────────────────────────────────
export interface SortOption<Key extends string> {
  value: Key;
  label: string;
}

// ── Props for SortSelect ──────────────────────────────────
interface Props<Key extends string> {
  value: Key;
  onChange: (v: Key) => void;
  options: SortOption<Key>[];
  className?: string;
}

// ── SortSelect component ──────────────────────────────────
export default function SortSelect<Key extends string>({
  value,
  onChange,
  options,
  className,
}: Props<Key>) {
  return (
    // ── Dropdown  ──────────────────────────────────
    <select
      className={`tv-select ${className ?? ''}`}
      value={value}
      onChange={e => onChange(e.target.value as Key)}
    >
      {/* ── List sort options ───────────────────────────── */}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
