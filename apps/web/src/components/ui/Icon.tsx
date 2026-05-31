import React from 'react';

const icons: Record<string, React.ReactNode> = {
  // ── Navigation & layout ───────────────────────────────────────────────────
  'layout-dashboard': <><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></>,
  menu:               <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  x:                  <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
  'arrow-left':       <><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></>,
  'arrow-right':      <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
  'arrow-up-right':   <><path d="M7 7h10v10"/><path d="M7 17 17 7"/></>,
  'chevron-right':    <path d="m9 18 6-6-6-6"/>,
  'chevron-left':     <path d="m15 18-6-6 6-6"/>,
  'chevron-down':     <path d="m6 9 6 6 6-6"/>,
  home:               <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></>,
  'log-out':          <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></>,

  // ── Actions ───────────────────────────────────────────────────────────────
  plus:               <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  minus:              <path d="M5 12h14"/>,
  check:              <path d="M20 6 9 17l-5-5"/>,
  'check-circle':     <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></>,
  search:             <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  filter:             <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>,
  pencil:             <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></>,
  archive:            <><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/></>,
  repeat:             <><path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,

  // ── People ────────────────────────────────────────────────────────────────
  user:               <><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></>,
  users:              <><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="8" r="3"/><path d="M2 21v-1a7 7 0 0 1 14 0v1M16 21v-1a6 6 0 0 0-4-5.7"/></>,
  'user-check':       <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></>,
  'hard-hat':         <><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10V5a2 2 0 1 1 4 0v5"/><path d="M5 15a6.47 6.47 0 0 1 14 0"/></>,

  // ── Data & charts ─────────────────────────────────────────────────────────
  'bar-chart-2':      <><path d="M3 3v18h18"/><path d="M7 16v-5"/><path d="M11 16V8"/><path d="M15 16v-2"/><path d="M19 16V6"/></>,
  'bar-chart-3':      <><path d="M3 3v18h18"/><path d="M7 16V8M12 16V4M17 16v-6"/></>,
  'trending-up':      <><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></>,
  'trending-down':    <><path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/></>,

  // ── Time & calendar ───────────────────────────────────────────────────────
  calendar:           <><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  'calendar-check':   <><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/></>,
  clock:              <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,

  // ── Commerce ──────────────────────────────────────────────────────────────
  'indian-rupee':     <><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/></>,
  'credit-card':      <><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></>,
  wallet:             <><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1"/><path d="M16 12h6v4h-6a2 2 0 0 1 0-4z"/></>,
  tag:                <><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1.5"/></>,
  briefcase:          <><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,

  activity:           <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,

  // ── UI & misc ─────────────────────────────────────────────────────────────
  settings:           <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></>,
  bell:               <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  sun:                <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>,
  moon:               <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>,
  'help-circle':      <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></>,
  shield:             <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8z"/>,
  sparkles:           <><path d="M9.5 3 8 8 3 9.5 8 11l1.5 5 1.5-5 5-1.5L11 8z"/><path d="M19 13v6M22 16h-6"/></>,
  star:               <path d="M12 2l3.09 6.26 6.91 1-5 4.87 1.18 6.87L12 17.77l-6.18 3.23L7 14.13 2 9.26l6.91-1z"/>,
  'circle-dot':       <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></>,
  'more-horizontal':  <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  image:              <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></>,
  droplet:            <path d="M12 2.69 17.66 8.34a8 8 0 1 1-11.31 0z"/>,
  navigation:         <path d="M3 11l19-9-9 19-2-8-8-2z"/>,
  camera:             <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></>,

  // ── Buildings & places ────────────────────────────────────────────────────
  'building-2':       <><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/></>,
  'list-checks':      <><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></>,

  // ── Transport & service ───────────────────────────────────────────────────
  car:                <><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></>,
  'map-pin':          <><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
  phone:              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>,
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export default function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.5, style }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      {icons[name] ?? <circle cx="12" cy="12" r="2" />}
    </svg>
  );
}
