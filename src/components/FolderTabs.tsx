import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import './FolderTabs.css';

export interface FolderTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FolderTabsProps {
  items: FolderTabItem[];
  active: string;
  onChange: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}

/* Ported from ahtapot.me: a rounded panel whose top edge rises up and wraps
   the active tab like a folder cap. r1 is half the tab height so the cap
   continues the stadium pills; the concave joints need T + r1 + r2 to equal
   the panel's top offset so the arcs land exactly on both edges. */
function shellPath(
  W: number,
  H: number,
  P: number,
  L: number,
  R: number,
  T: number,
  r1: number,
) {
  const r2 = P - T - r1;
  const flushLeft = L <= 1;
  const flushRight = R >= W - 1;

  const p = [`M ${L + r1} ${T}`, `H ${R - r1}`, `A ${r1} ${r1} 0 0 1 ${R} ${T + r1}`];
  if (flushRight) {
    p.push(`V ${H - r1}`);
  } else {
    p.push(`A ${r2} ${r2} 0 0 0 ${R + r2} ${P}`);
    p.push(`H ${W - r1}`, `A ${r1} ${r1} 0 0 1 ${W} ${P + r1}`, `V ${H - r1}`);
  }
  p.push(`A ${r1} ${r1} 0 0 1 ${W - r1} ${H}`, `H ${r1}`, `A ${r1} ${r1} 0 0 1 0 ${H - r1}`);
  if (flushLeft) {
    p.push(`V ${T + r1}`);
  } else {
    p.push(`V ${P + r1}`, `A ${r1} ${r1} 0 0 1 ${r1} ${P}`);
    p.push(`H ${L - r2}`, `A ${r2} ${r2} 0 0 0 ${L} ${T + r1}`);
  }
  p.push(`A ${r1} ${r1} 0 0 1 ${L + r1} ${T}`, 'Z');
  return p.join(' ');
}

interface Shell {
  d: string;
  w: number;
  h: number;
  l: number;
  r: number;
  t: number;
}

export const FolderTabs: React.FC<FolderTabsProps> = ({
  items,
  active,
  onChange,
  children,
  className,
}) => {
  const [shell, setShell] = useState<Shell | null>(null);
  const base = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const noiseId = `${base}-noise`;
  const glowId = `${base}-glow`;

  const tabId = (id: string) => `${base}-tab-${id}`;
  const panelId = `${base}-panel`;

  const measure = useCallback(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    const btn = refs.current[active];
    if (!root || !panel || !btn) return setShell(null);

    const W = root.clientWidth;
    const H = root.clientHeight;
    const P = panel.offsetTop;
    const T = btn.offsetTop;
    const r1 = btn.offsetHeight / 2;
    if (!W || !H || !P || !r1 || P - T - r1 < 8) return setShell(null);

    const L = btn.offsetLeft;
    const R = L + btn.offsetWidth;
    setShell({ d: shellPath(W, H, P, L, R, T, r1), w: W, h: H, l: L, r: R, t: T });
  }, [active]);

  useLayoutEffect(measure, [measure, items.length]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !rootRef.current) return;
    const observer = new ResizeObserver(measure);
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [measure]);

  function focusTab(id: string) {
    onChange(id);
    refs.current[id]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((i) => i.id === active);
    if (index < 0) return;
    const moves: Record<string, number | 'first' | 'last'> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      Home: 'first',
      End: 'last',
    };
    const move = moves[event.key];
    if (move === undefined) return;
    event.preventDefault();
    if (move === 'first') return focusTab(items[0].id);
    if (move === 'last') return focusTab(items[items.length - 1].id);
    focusTab(items[(index + move + items.length) % items.length].id);
  }

  return (
    <div ref={rootRef} className={`folder-tabs ${className ?? ''}`}>
      {shell && (
        <svg
          aria-hidden="true"
          width={shell.w}
          height={shell.h}
          viewBox={`0 0 ${shell.w} ${shell.h}`}
          className="folder-tabs-shell"
        >
          <defs>
            <radialGradient
              id={glowId}
              gradientUnits="userSpaceOnUse"
              cx={(shell.l + shell.r) / 2}
              cy={shell.t}
              r={shell.w * 0.42}
            >
              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
              <stop offset="35%" stopColor="white" stopOpacity="0.1" />
              <stop offset="70%" stopColor="white" stopOpacity="0.02" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <filter id={noiseId}>
              <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.9" intercept="0" />
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic" />
            </filter>
          </defs>
          <path d={shell.d} fill="var(--bg-secondary)" />
          <path d={shell.d} fill={`url(#${glowId})`} opacity="0.35" />
          <path d={shell.d} fill={`url(#${glowId})`} filter={`url(#${noiseId})`} />
          <path d={shell.d} fill="none" stroke="var(--border-hi)" strokeWidth="1" />
        </svg>
      )}

      <div role="tablist" aria-orientation="horizontal" onKeyDown={onKeyDown} className="folder-tabs-list">
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[item.id] = el;
              }}
              id={tabId(item.id)}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.id)}
              className={`folder-tab ${selected ? (shell ? 'selected' : 'selected-fallback') : ''}`}
            >
              {item.icon && (
                <span aria-hidden="true" className="folder-tab-icon">
                  {item.icon}
                </span>
              )}
              <span className="folder-tab-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div
        ref={panelRef}
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(active)}
        tabIndex={0}
        className={`folder-tabs-panel ${shell ? '' : 'fallback'}`}
      >
        {children}
      </div>
    </div>
  );
};
