// @ts-nocheck
import React from 'react';

function mask(s) {
  if (!s) return '';
  return s.length > 20 ? s.slice(0, 10) + '…' + s.slice(-8) : s;
}

export default function DevAuth() {
  const [value, setValue] = React.useState(() => localStorage.getItem('b44-session-token') || '');
  const [copied, setCopied] = React.useState(false);

  const save = () => {
    if (value.trim()) {
      localStorage.setItem('b44-session-token', value.trim());
      alert("Saved token to localStorage as 'b44-session-token'. Your API calls will include it.");
    } else {
      alert('Paste a token first.');
    }
  };

  const clear = () => {
    localStorage.removeItem('b44-session-token');
    setValue('');
    alert('Removed token. Future API calls will be unauthenticated.');
  };

  const test = async () => {
    try {
      const res = await fetch('/api/auth-me', {
        headers: value ? { Authorization: `Bearer ${value.trim()}` } : {},
      });
      const json = await res.json();
      alert('auth-me → ' + JSON.stringify(json, null, 2));
    } catch (e) {
      alert('auth-me failed: ' + e.message);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* no-op: dev auth flow may fail silently */
    }
  };

  return (
    <div className='max-w-xl mx-auto p-4 space-y-4'>
      <h1 className='text-xl font-semibold'>Dev Auth</h1>
      <p className='text-sm text-stone-600'>
        Paste a valid Base44 <b>session</b> or <b>service</b> token. We’ll store it under{' '}
        <code>b44-session-token</code> and automatically send it as{' '}
        <code>Authorization: Bearer &lt;token&gt;</code> on API requests.
      </p>

      <textarea
        className='w-full h-32 p-2 border rounded'
        placeholder='eyJhbGciOi...'
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
      />

      <div className='flex gap-2'>
        <button className='px-3 py-2 bg-stone-900 text-white rounded' onClick={save}>
          Save token
        </button>
        <button className='px-3 py-2 bg-stone-200 rounded' onClick={clear}>
          Remove token
        </button>
        <button className='px-3 py-2 bg-stone-200 rounded' onClick={test}>
          Test /api/auth-me
        </button>
        <button className='px-3 py-2 bg-stone-200 rounded' onClick={copy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className='text-xs text-stone-500'>Current (masked): {mask(value)}</div>
    </div>
  );
}
