'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    initSendOTP?: (config: object) => void;
    sendOtp?:     (id: string, onSuccess?: (d: any) => void, onError?: (e: any) => void) => void;
    retryOtp?:    (channel: string | null, onSuccess?: (d: any) => void, onError?: (e: any) => void) => void;
    verifyOtp?:   (otp: string, onSuccess?: (d: any) => void, onError?: (e: any) => void) => void;
  }
}

const WIDGET_ID  = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID    ?? '';
const TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN ?? '';

const SDK_URLS = [
  'https://verify.msg91.com/otp-provider.js',
  'https://verify.phone91.com/otp-provider.js',
];

// Module-level flag so the script is only injected once per page
let scriptLoaded = false;

export function useMsg91() {
  const [ready, setReady] = useState(
    () => typeof window !== 'undefined' && typeof window.sendOtp === 'function',
  );
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current || !WIDGET_ID) return;
    initRef.current = true;

    // Already initialised in this browser session
    if (typeof window.sendOtp === 'function') { setReady(true); return; }

    const config = {
      widgetId:      WIDGET_ID,
      tokenAuth:     TOKEN_AUTH,
      exposeMethods: true,
      success:       () => {},
      failure:       (err: unknown) => console.warn('[MSG91 widget]', err),
    };

    function init() {
      window.initSendOTP?.(config);
      setReady(true);
    }

    if (scriptLoaded) { init(); return; }

    let idx = 0;
    function attempt() {
      const s   = document.createElement('script');
      s.src     = SDK_URLS[idx];
      s.async   = true;
      s.onload  = () => { scriptLoaded = true; init(); };
      s.onerror = () => { if (++idx < SDK_URLS.length) attempt(); };
      document.head.appendChild(s);
    }
    attempt();
  }, []);

  return { ready };
}
