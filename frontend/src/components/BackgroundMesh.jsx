import { useEffect, useRef } from 'react'

export default function BackgroundMesh() {
  const pulseRef = useRef(null)

  useEffect(() => {
    // One-time pulse animation on mount
    const el = pulseRef.current
    if (el) {
      el.style.opacity = '1'
    }
  }, [])

  return (
    <div className="bg-mesh">
      {/* Subtle ECG waveform line that scrolls across the bottom */}
      <div className="ecg-line-bg" />

      {/* One-time ECG pulse draw animation in center */}
      <div
        ref={pulseRef}
        className="ecg-pulse-line"
        style={{ opacity: 0, transition: 'opacity 0.5s ease' }}
      >
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
          <path d="M0 40 L200 40 L240 40 L260 36 L280 48 L300 8 L320 72 L340 28 L360 40 L500 40 L600 40 L640 40 L660 36 L680 48 L700 8 L720 72 L740 28 L760 40 L900 40 L1000 40 L1040 40 L1060 36 L1080 48 L1100 8 L1120 72 L1140 28 L1160 40 L1200 40" />
        </svg>
      </div>
    </div>
  )
}
