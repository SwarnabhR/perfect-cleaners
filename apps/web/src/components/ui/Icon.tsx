const icons: Record<string, React.ReactNode> = {
  car:              <><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></>,
  bell:             <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  'map-pin':        <><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
  'chevron-right':  <path d="m9 18 6-6-6-6"/>,
  'chevron-left':   <path d="m15 18-6-6 6-6"/>,
  'chevron-down':   <path d="m6 9 6 6 6-6"/>,
  'arrow-up-right': <><path d="M7 7h10v10"/><path d="M7 17 17 7"/></>,
  'arrow-right':    <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
  plus:             <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  check:            <path d="M20 6 9 17l-5-5"/>,
  x:                <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
  search:           <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  filter:           <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>,
  calendar:         <><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  clock:            <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
  'credit-card':    <><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></>,
  navigation:       <path d="M3 11l19-9-9 19-2-8-8-2z"/>,
  camera:           <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></>,
  user:             <><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></>,
  users:            <><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="8" r="3"/><path d="M2 21v-1a7 7 0 0 1 14 0v1M16 21v-1a6 6 0 0 0-4-5.7"/></>,
  wallet:           <><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1"/><path d="M16 12h6v4h-6a2 2 0 0 1 0-4z"/></>,
  'bar-chart-3':    <><path d="M3 3v18h18"/><path d="M7 16V8M12 16V4M17 16v-6"/></>,
  settings:         <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></>,
  'log-out':        <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></>,
  'help-circle':    <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></>,
  phone:            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>,
  sparkles:         <><path d="M9.5 3 8 8 3 9.5 8 11l1.5 5 1.5-5 5-1.5L11 8z"/><path d="M19 13v6M22 16h-6"/></>,
  shield:           <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8z"/>,
  droplet:          <path d="M12 2.69 17.66 8.34a8 8 0 1 1-11.31 0z"/>,
  home:             <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></>,
  star:             <path d="M12 2l3.09 6.26 6.91 1-5 4.87 1.18 6.87L12 17.77l-6.18 3.23L7 14.13 2 9.26l6.91-1z"/>,
  image:            <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></>,
  menu:             <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  'more-horizontal':<><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  'trending-up':    <><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></>,
  'trending-down':  <><path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/></>,
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
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      {icons[name] ?? null}
    </svg>
  );
}
