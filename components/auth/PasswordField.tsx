'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Password input matching the account drawer styling (bottom-border) with a
 * show/hide toggle so users can reveal what they typed.
 */
export default function PasswordField({
  value,
  onChange,
  required,
  autoComplete = 'off',
  placeholder,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  id?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full border-0 border-b border-black text-sm py-2 pr-9 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        tabIndex={-1}
        className="absolute right-0 top-1/2 -translate-y-1/2 text-[#888] hover:text-primary transition-colors p-1"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
