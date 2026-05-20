// Lifted from app-trail.jsx:276-308.

interface Props {
  kind: 'len' | 'asc' | 'dur' | 'trv';
  size?: number;
  color: string;
}

export function StatIcon({ kind, size = 14, color }: Props) {
  if (kind === 'len')
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 8 H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 5 V11 M13 5 V11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  if (kind === 'asc')
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <polygon points="2,13 8,3 14,13" fill={color} />
      </svg>
    );
  if (kind === 'dur')
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.4" />
        <path d="M8 4 V8 L11 10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <polygon points="8,2 14,8 8,14 2,8" stroke={color} strokeWidth="1.4" fill="none" />
    </svg>
  );
}
