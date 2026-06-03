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

let scriptLoaded = false;

export function useMsg91() {
  const configured = WIDGET_ID !== '';

  const [ready,     setReady]     = useState(
    () => typeof window !== 'undefined' && typeof window.sendOtp === 'function',
  );
  const [loadError, setLoadError] = useState(!configured);
  const initRef = useRef(false);

  useEffect(() => {
    // Missing env vars — surface the error immediately
    if (!configured) {
      console.error(
        '[MSG91] NEXT_PUBLIC_MSG91_WIDGET_ID is not set. ' +
        'Add it (and NEXT_PUBLIC_MSG91_WIDGET_TOKEN) to .env.local.',
      );
      return;
    }

    if (initRef.current) return;
    initRef.current = true;

    if (typeof window.sendOtp === 'function') { setReady(true); return; }

    const config = {
      widgetId:      WIDGET_ID,
      tokenAuth:     TOKEN_AUTH,
      exposeMethods: true,
      success:       () => {},
      failure:       (err: unknown) => console.warn('[MSG91 widget]', err),
    };

    function init() {
      // Mount an off-screen container so the widget never renders visible UI.
      // Without this, the widget overlays the page with its own OTP form and
      // shows "Something went wrong" when its iframe is blocked by CSP frame-src.
      const containerId = 'msg91-widget-sink';
      if (!document.getElementById(containerId)) {
        const sink = document.createElement('div');
        sink.id = containerId;
        sink.setAttribute('aria-hidden', 'true');
        sink.style.cssText = 'position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;';
        document.body.appendChild(sink);
      }

      window.initSendOTP?.({ ...config, containerId });
      const start = Date.now();
      const poll  = setInterval(() => {
        if (typeof window.sendOtp === 'function') {
          clearInterval(poll);
          setReady(true);
          setLoadError(false);
        } else if (Date.now() - start > 12_000) {
          clearInterval(poll);
          setLoadError(true);
          console.error('[MSG91] sendOtp not available after 12 s — check Widget ID and network.');
        }
      }, 150);
    }

    if (scriptLoaded) { init(); return; }

    let idx = 0;
    function attempt() {
      const s   = document.createElement('script');
      s.src     = SDK_URLS[idx];
      s.async   = true;
      s.onload  = () => { scriptLoaded = true; init(); };
      s.onerror = () => {
        if (++idx < SDK_URLS.length) {
          attempt();
        } else {
          setLoadError(true);
          console.error('[MSG91] All SDK URLs failed to load.');
        }
      };
      document.head.appendChild(s);
    }
    attempt();
  }, [configured]);

  return { ready, configured, loadError };
}
