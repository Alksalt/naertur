// Lifted from app-trail.jsx:309-337.

interface Props {
  level: 'easy' | 'medium' | 'hard';
  color: string;
  soft: string;
}

export function DifficultyGlyph({ level, color, soft }: Props) {
  if (level === 'easy') {
    return (
      <svg width="56" height="22" viewBox="0 0 56 22" fill="none" aria-hidden="true">
        <path d="M2 18 Q14 12, 28 12 T54 8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="2" y1="20" x2="54" y2="20" stroke={soft} strokeWidth="0.8" />
      </svg>
    );
  }
  if (level === 'medium') {
    return (
      <svg width="56" height="22" viewBox="0 0 56 22" fill="none" aria-hidden="true">
        <path
          d="M2 18 L18 18 L34 6 L48 12 L54 4"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="2" y1="20" x2="54" y2="20" stroke={soft} strokeWidth="0.8" />
      </svg>
    );
  }
  return (
    <svg width="56" height="22" viewBox="0 0 56 22" fill="none" aria-hidden="true">
      <path
        d="M2 18 L12 18 L18 4 L24 12 L30 2 L42 14 L48 6 L54 18"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="2" y1="20" x2="54" y2="20" stroke={soft} strokeWidth="0.8" />
    </svg>
  );
}
