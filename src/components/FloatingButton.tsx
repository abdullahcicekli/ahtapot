import React, { useState, memo } from 'react';
import { DetectedIOC } from '@/types/ioc';

interface FloatingButtonProps {
  position: { top: number; left: number };
  iocs: DetectedIOC[];
  onAnalyze: () => void;
  onClose?: () => void;
}

/**
 * Floating Button Component
 * Metin seçildiğinde görünen analiz butonu - Medium gibi hover efekti
 * OPTIMIZED: Memoized to prevent unnecessary re-renders
 */
const FloatingButton: React.FC<FloatingButtonProps> = memo(({
  position,
  iocs,
  onAnalyze,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="ahtapot-floating-button"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <button
        onClick={onAnalyze}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={isHovered ? 'expanded' : ''}
        title={`${iocs.length} IOC tespit edildi`}
        aria-label={`${iocs.length} güvenlik göstergesi tespit edildi. Analiz etmek için tıklayın.`}
      >
        <svg
          className="ahtapot-logo"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            transform="translate(0,100) scale(0.009765625,-0.009765625)"
            d="M6354 9682 c-82 -52 -109 -132 -100 -306 24 -475 17 -634 -39 -851 -46 -177 -83 -275 -151 -404 -223 -418 -445 -646 -1224 -1248 -505 -391 -945 -804 -1224 -1151 -83 -104 -228 -322 -320 -484 -142 -248 -265 -595 -326 -919 -46 -247 -56 -387 -41 -602 38 -575 200 -1084 591 -1867 234 -468 338 -715 394 -940 61 -241 79 -472 52 -655 -19 -119 -35 -210 -42 -237 -5 -17 75 -18 1591 -18 l1596 0 25 57 c65 147 86 356 50 498 -34 133 -86 223 -194 337 -90 94 -100 109 -116 168 -25 92 -119 333 -184 475 -55 119 -55 121 -62 245 -7 118 -10 131 -53 234 -79 188 -132 248 -306 342 -122 66 -137 79 -212 172 -35 42 -108 128 -163 190 -116 129 -151 184 -167 262 -14 69 -63 209 -96 275 -40 80 -70 112 -167 185 -93 69 -120 95 -149 142 -24 38 -83 184 -129 317 l-39 115 11 102 c6 56 13 178 14 270 l3 169 51 152 c86 259 129 325 284 435 90 63 148 139 225 297 96 195 138 240 494 533 166 137 203 178 328 363 45 66 120 165 166 219 47 55 124 158 172 230 220 334 207 309 276 506 74 211 109 360 133 575 37 339 -8 684 -133 1018 -57 151 -77 191 -171 342 -99 158 -142 213 -249 316 -113 109 -191 150 -296 156 -59 4 -78 1 -103 -15z"
            fill="currentColor"
          />
        </svg>
        <span className="button-text">Analiz Et</span>
        {iocs.length > 1 && (
          <span className="ahtapot-ioc-badge" aria-label={`${iocs.length} IOC`}>
            {iocs.length}
          </span>
        )}
      </button>
    </div>
  );
});

FloatingButton.displayName = 'FloatingButton';

export default FloatingButton;
