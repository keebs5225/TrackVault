// frontend/src/components/LightDarkToggle.tsx
import React, { useEffect, useState } from 'react';

export default function LightDarkToggle() {
  const [dark, setDark] = useState<boolean>(false);
  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);
  return (
    <button
      className="dark-mode-toggle"
      onClick={() => setDark(prev => !prev)}
      aria-label="Toggle dark mode"
    >
      {dark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}