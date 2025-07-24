// frontend/src/components/SortSelect.tsx
import React from 'react';

export interface SortOption<Key extends string> {
  value: Key;
  label: string;
}

interface Props<Key extends string> {
  value: Key;
  onChange: (v: Key) => void;
  options: SortOption<Key>[];
  className?: string;
}

export default function SortSelect<Key extends string>({
  value, onChange, options, className
}: Props<Key>) {
  return (
    <select
      className={`tv-select ${className ?? ''}`}
      value={value}
      onChange={e => onChange(e.target.value as Key)}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
