interface Props {
  color: string;
  peakColor?: string;
  size?: number;
}

export function NaerturMark({ color, peakColor, size = 22 }: Props) {
  const pc = peakColor ?? color;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M2 20 L9 8 L13 14 L16 10 L22 20 Z" fill={pc} />
        <path
          d="M16 10 L18 12.5"
          stroke={color}
          strokeOpacity="0.25"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          fontFamily: '"Schibsted Grotesk", system-ui',
          fontWeight: 600,
          fontSize: size,
          letterSpacing: -0.5,
          color,
          lineHeight: 1,
        }}
      >
        NærTur
      </span>
    </span>
  );
}
