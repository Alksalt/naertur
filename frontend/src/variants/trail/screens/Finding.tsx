import { useTrailTheme } from '../theme';
import { useI18n } from '../../../i18n';
import { Icon } from '../components/Icon';
import { TopoMap } from '../components/TopoMap';
import { MONO } from '../styles';
import { MOCK_HIKES } from '../../../api/mock';

interface Props {
  phase: number; // 0..3
}

export function Finding({ phase }: Props) {
  const C = useTrailTheme();
  const { L, lang } = useI18n();
  const heroHike = MOCK_HIKES[0];

  const items = [
    { k: 'loc', label: L.locOk },
    { k: 'season', label: L.seasonOk },
    { k: 'weather', label: L.weatherOk },
    { k: 'pick', label: L.pickingHike },
  ];

  return (
    <div
      className="trail-app"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: C.paper,
        color: C.ink,
        fontFamily: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        <TopoMap palette={C} hike={heroHike} drawOn={false} height="100%" mode="bg" showTrail={false} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, ${C.paper}d4, ${C.paper})`,
          }}
        />
      </div>

      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 140,
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="trail-pulse-ring"
              style={{
                position: 'absolute',
                width: 140,
                height: 140,
                borderRadius: '50%',
                border: `1.5px solid ${C.vermillion}`,
                animation: `trail-ring-pulse 2400ms ${i * 800}ms cubic-bezier(.3,.6,.6,1) infinite`,
              }}
            />
          ))}
          <div
            style={{
              width: 50,
              height: 50,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ position: 'absolute', width: 1, height: 32, background: C.vermillion }} />
            <div style={{ position: 'absolute', width: 32, height: 1, background: C.vermillion }} />
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <polygon
                points="10,2 18,17 2,17"
                fill={C.vermillion}
                stroke={C.paper}
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>

        <div style={{ marginTop: 40, textAlign: 'center', maxWidth: 280 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10.5,
              fontWeight: 600,
              color: C.vermillion,
              letterSpacing: 1.2,
              marginBottom: 10,
            }}
          >
            {L.searchingMono} · {String(Math.min(phase + 1, 4))}/04
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.7, lineHeight: 1.05 }}>
            {L.finding}
            <span style={{ color: C.vermillion }}>.</span>
          </div>
          <div style={{ marginTop: 10, color: C.graphite, fontSize: 14, lineHeight: 1.45 }}>
            {L.findingSub}
          </div>
        </div>

        <div
          style={{
            marginTop: 28,
            width: '100%',
            maxWidth: 320,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {items.map((line, i) => {
            const done = phase > i;
            const active = phase === i;
            return (
              <div
                key={line.k}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: done || active ? C.snow : 'transparent',
                  border: `1px solid ${done || active ? C.hairline : 'transparent'}`,
                  opacity: done ? 1 : active ? 1 : 0.4,
                  transition: 'background 320ms, opacity 320ms, border-color 320ms',
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: done ? C.vermillion : 'transparent',
                    border: done ? 'none' : `1.5px solid ${active ? C.vermillion : C.graphite}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 220ms, border 220ms',
                    position: 'relative',
                  }}
                >
                  {done && <Icon name="check" size={11} color={C.vermillionInk} strokeWidth={2.6} />}
                  {active && !done && (
                    <div
                      className="trail-active-dot"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: C.vermillion,
                        animation: 'trail-fade-in 1s ease-in-out infinite alternate',
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: done ? 500 : 400,
                    color: done ? C.ink : C.graphite,
                  }}
                >
                  {line.label}
                </span>
              </div>
            );
          })}
          {/* Suppress unused-lang warning by referencing lang for a a11y title */}
          <span style={{ display: 'none' }} aria-hidden="true">
            {lang}
          </span>
        </div>
      </div>
    </div>
  );
}
