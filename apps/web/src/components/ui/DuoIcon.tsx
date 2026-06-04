import type { CSSProperties, ReactNode } from 'react';

const ICONS: Record<string, ReactNode> = {
  pin:         <><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></>,
  navigation:  <path d="M3 11l18-8-8 18-2.2-7.8L3 11Z"/>,
  search:      <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></>,
  bell:        <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10.5 20a1.8 1.8 0 0 0 3 0"/></>,
  user:        <><circle cx="12" cy="8" r="3.6"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></>,
  car:         <><path d="M5 17H3.6A1.6 1.6 0 0 1 2 15.4v-3.1c0-.45.1-.9.32-1.3l1.7-3.1A2 2 0 0 1 5.78 6.8h8.74a2 2 0 0 1 1.66.88l2.06 3.06c.2.3.5.52.85.62l1.36.4A1.7 1.7 0 0 1 22 13.6v1.8A1.6 1.6 0 0 1 20.4 17H19"/><path d="M9.5 17h5"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></>,
  package:     <><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"/><path d="m4 7 8 4 8-4M12 11v10"/><path d="m8 5 8 4"/></>,
  truck:       <><rect x="2" y="6.5" width="12" height="9" rx="1.4"/><path d="M14 9.4h3.3a1 1 0 0 1 .8.4l1.9 2.6c.13.18.2.4.2.62v2.48H14z"/><circle cx="6.5" cy="17.6" r="1.8"/><circle cx="17" cy="17.6" r="1.8"/></>,
  wrench:      <path d="M14.6 6.3a4 4 0 0 0-5.27 5.27L4 17l3 3 5.43-5.33A4 4 0 0 0 17.7 9.4l-2.45 2.45-2.1-.55-.55-2.1L14.6 6.3Z"/>,
  bolt:        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>,
  roller:      <><rect x="3" y="4.5" width="11.5" height="5.5" rx="1.6"/><path d="M14.5 7.2h3a1.2 1.2 0 0 1 1.2 1.2v2.1a1.2 1.2 0 0 1-1.2 1.2h-4.6a1.4 1.4 0 0 0-1.4 1.4V15"/><rect x="9.5" y="15" width="4" height="5" rx="1.3"/></>,
  flame:       <path d="M12.5 3c.5 2.6 2 3.7 3.3 5.2A5.6 5.6 0 1 1 6 12.3c0-1 .3-2 .85-2.8.45.85 1.1 1.35 2 1.45-.45-2.4.45-4.65 3.65-7.95Z"/>,
  key:         <><circle cx="7.8" cy="8.2" r="3.9"/><path d="m10.6 10.9 7.4 7.4"/><path d="m15.2 15.5 1.6-1.6M17.4 17.7l1.7-1.7"/></>,
  wind:        <path d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5M3 12h15a2.5 2.5 0 1 1-2.5 2.5M3 16h9a2 2 0 1 1-2 2"/>,
  hammer:      <><path d="M4.4 9.7 9.7 4.4a1.1 1.1 0 0 1 1.55 0l2.85 2.85a1.1 1.1 0 0 1 0 1.55L8.75 14.1Z"/><path d="m10.7 10.7 7.7 7.7a1.75 1.75 0 0 1-2.48 2.48l-7.7-7.7"/></>,
  leaf:        <><path d="M4.6 19.4C3.4 13 7 5.7 19.4 5.7c0 0 1.5 12.2-6.9 13.3-3.7.5-6.4-.4-7.9-.6Z"/><path d="M5.2 18.8c2.4-5.8 6.3-9.3 10.6-10.4"/></>,
  briefcase:   <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12h18"/></>,
  home:        <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z"/>,
  plane:       <path d="M21 15.5 13 12V5.5a1.5 1.5 0 0 0-3 0V12l-8 3.5V17l8-2v3l-2 1.2V21l3.5-1 3.5 1v-1.3L13 18v-3l8 2Z"/>,
  star:        <path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17l-5.3 2.7 1-5.8-4.2-4.1 5.9-.9Z"/>,
  clock:       <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>,
  chevronRight:<path d="m9 5 7 7-7 7"/>,
  chevronLeft: <path d="m15 5-7 7 7 7"/>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
  phone:       <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"/>,
  message:     <path d="M4 5h16v11H9l-4 3.5V16H4a0 0 0 0 1 0 0Z"/>,
  shield:      <><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="m9 11.5 2 2 4-4"/></>,
  card:        <><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 9.5h18M6.5 14.5h4"/></>,
  cash:        <><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/></>,
  plus:        <path d="M12 5v14M5 12h14"/>,
  arrowRight:  <path d="M5 12h14M13 6l6 6-6 6"/>,
  arrowLeft:   <path d="M19 12H5M11 6l-6 6 6 6"/>,
  activity:    <path d="M3 12h4l2.5 6 5-12L17 12h4"/>,
  wallet:      <><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9h18M16.5 13.5h.5"/></>,
  check:       <path d="m5 12.5 4.5 4.5L19 7"/>,
  x:           <path d="M6 6l12 12M18 6 6 18"/>,
  sliders:     <path d="M4 8h10M18 8h2M4 16h2M10 16h10M14 6v4M6 14v4"/>,
  heart:       <path d="M12 20S4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.5-8 11-8 11Z"/>,
  calendar:    <><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></>,
  dot:         <circle cx="12" cy="12" r="3.5"/>,
  users:       <><circle cx="9" cy="8" r="3.1"/><path d="M3.6 19a5.4 5.4 0 0 1 10.8 0"/><path d="M16.2 5.3a3.1 3.1 0 0 1 0 5.9M17.5 19a5.4 5.4 0 0 0-2.4-4.5"/></>,
  seat:        <path d="M6 4h2.5a2 2 0 0 1 2 1.7L11.5 12H17a2 2 0 0 1 2 2.2l-.4 3.8M6 4v9a2 2 0 0 0 2 2h7M6 20v-2"/>,
  mapPin:      <><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></>,
  zap:         <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>,
  tag:         <><path d="M3 11V4.5A1.5 1.5 0 0 1 4.5 3H11l9 9-7.5 7.5L3 11Z"/><circle cx="7.5" cy="7.5" r="1.3"/></>,
  gift:        <><rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M3.5 13h17M12 9v11M12 9S9 9 8 7s2-3 4 2c2-5 5-4 4-2s-4 2-4 2Z"/></>,
};

// Solid fill shapes rendered under the stroke layer (duotone effect)
const FILLS: Record<string, ReactNode> = {
  car:       <path d="M2 12.3c0-.5.1-.9.3-1.3l1.7-3.1A2 2 0 0 1 5.8 6.8h8.7a2 2 0 0 1 1.7.9l2 3c.2.3.5.5.9.6l1.4.4A1.7 1.7 0 0 1 22 13.6v1.8A1.6 1.6 0 0 1 20.4 17H3.6A1.6 1.6 0 0 1 2 15.4z"/>,
  package:   <path d="M12 2.6 3.4 7v10L12 21.4 20.6 17V7z"/>,
  truck:     <><rect x="2" y="6.5" width="12" height="9" rx="1.4"/><path d="M14 9.4h3.3a1 1 0 0 1 .8.4l1.9 2.6c.13.18.2.4.2.62v2.48H14z"/></>,
  wrench:    <path d="M14.6 6.3a4 4 0 0 0-5.27 5.27L4 17l3 3 5.43-5.33A4 4 0 0 0 17.7 9.4l-2.45 2.45-2.1-.55-.55-2.1z"/>,
  bolt:      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>,
  roller:    <rect x="3" y="4.5" width="11.5" height="5.5" rx="1.6"/>,
  flame:     <path d="M12.5 3c.5 2.6 2 3.7 3.3 5.2A5.6 5.6 0 1 1 6 12.3c0-1 .3-2 .85-2.8.45.85 1.1 1.35 2 1.45-.45-2.4.45-4.65 3.65-7.95Z"/>,
  key:       <circle cx="7.8" cy="8.2" r="3.9"/>,
  hammer:    <path d="M4.4 9.7 9.7 4.4a1.1 1.1 0 0 1 1.55 0l2.85 2.85a1.1 1.1 0 0 1 0 1.55L8.75 14.1Z"/>,
  leaf:      <path d="M4.6 19.4C3.4 13 7 5.7 19.4 5.7c0 0 1.5 12.2-6.9 13.3-3.7.5-6.4-.4-7.9-.6Z"/>,
  briefcase: <rect x="3" y="7" width="18" height="13" rx="2"/>,
  home:      <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z"/>,
  shield:    <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/>,
  gift:      <rect x="3.5" y="9" width="17" height="11" rx="1.5"/>,
  bell:      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/>,
  wallet:    <rect x="3" y="6" width="18" height="13" rx="2.5"/>,
  card:      <rect x="3" y="5.5" width="18" height="13" rx="2.5"/>,
  pin:       <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"/>,
  star:      <path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17l-5.3 2.7 1-5.8-4.2-4.1 5.9-.9Z"/>,
  heart:     <path d="M12 20S4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.5-8 11-8 11Z"/>,
  user:      <circle cx="12" cy="8" r="3.6"/>,
  users:     <circle cx="9" cy="8" r="3.1"/>,
  calendar:  <rect x="3.5" y="5" width="17" height="16" rx="2.5"/>,
  mapPin:    <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"/>,
  tag:       <path d="M3 11V4.5A1.5 1.5 0 0 1 4.5 3H11l9 9-7.5 7.5L3 11Z"/>,
};

export type DuoIconName = keyof typeof ICONS;

interface DuoIconProps {
  name: DuoIconName;
  size?: number;
  stroke?: number;
  fillOpacity?: number;
  className?: string;
  style?: CSSProperties;
}

export function DuoIcon({
  name,
  size = 22,
  stroke = 1.75,
  fillOpacity = 0.18,
  className = '',
  style,
}: DuoIconProps) {
  const lineShape = ICONS[name];
  const fillShape = FILLS[name as keyof typeof FILLS];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
      className={className}
    >
      {fillShape && (
        <g fill="currentColor" stroke="none" opacity={fillOpacity}>
          {fillShape}
        </g>
      )}
      <g fill="none" stroke="currentColor" strokeWidth={stroke}>
        {lineShape ?? ICONS.dot}
      </g>
    </svg>
  );
}

// Chip wrapper: soft = tinted bg + icon in color; filled = solid accent bg + white icon
interface DuoChipProps {
  name: DuoIconName;
  color: string;
  size?: number;
  chipSize?: number;
  chipRadius?: number;
  variant?: 'soft' | 'filled';
}

export function DuoChip({
  name,
  color,
  size = 22,
  chipSize = 46,
  chipRadius = 14,
  variant = 'soft',
}: DuoChipProps) {
  const isFilled = variant === 'filled';
  return (
    <span
      style={{
        width: chipSize,
        height: chipSize,
        borderRadius: chipRadius,
        background: isFilled ? color : `color-mix(in srgb, ${color} 13%, transparent)`,
        color: isFilled ? '#fff' : color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <DuoIcon name={name} size={size} fillOpacity={isFilled ? 0 : 0.18} />
    </span>
  );
}
