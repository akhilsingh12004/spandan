import { useRef, useEffect } from 'react'

export default function ECGSignalChart({ signalData }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !signalData || signalData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = { top: 20, right: 20, bottom: 30, left: 40 }
    const plotW = width - padding.left - padding.right
    const plotH = height - padding.top - padding.bottom

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Background
    ctx.fillStyle = 'rgba(10, 14, 26, 0.8)'
    ctx.fillRect(0, 0, width, height)

    // Grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)'
    ctx.lineWidth = 1

    // Vertical grid lines
    const numVLines = 20
    for (let i = 0; i <= numVLines; i++) {
      const x = padding.left + (plotW / numVLines) * i
      ctx.beginPath()
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, height - padding.bottom)
      ctx.stroke()
    }

    // Horizontal grid lines
    const numHLines = 8
    for (let i = 0; i <= numHLines; i++) {
      const y = padding.top + (plotH / numHLines) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    // Center baseline
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'
    ctx.setLineDash([4, 4])
    const baselineY = padding.top + plotH / 2
    ctx.beginPath()
    ctx.moveTo(padding.left, baselineY)
    ctx.lineTo(width - padding.right, baselineY)
    ctx.stroke()
    ctx.setLineDash([])

    // Signal data normalization
    const minVal = Math.min(...signalData)
    const maxVal = Math.max(...signalData)
    const range = maxVal - minVal || 1

    // Draw ECG signal
    const gradient = ctx.createLinearGradient(padding.left, 0, width - padding.right, 0)
    gradient.addColorStop(0, '#06d6a0')
    gradient.addColorStop(0.5, '#3b82f6')
    gradient.addColorStop(1, '#8b5cf6')

    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()

    for (let i = 0; i < signalData.length; i++) {
      const x = padding.left + (i / (signalData.length - 1)) * plotW
      const normalized = (signalData[i] - minVal) / range
      const y = padding.top + plotH - normalized * plotH

      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Glow effect
    ctx.strokeStyle = gradient
    ctx.lineWidth = 4
    ctx.globalAlpha = 0.15
    ctx.beginPath()
    for (let i = 0; i < signalData.length; i++) {
      const x = padding.left + (i / (signalData.length - 1)) * plotW
      const normalized = (signalData[i] - minVal) / range
      const y = padding.top + plotH - normalized * plotH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1

    // Axis labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
    ctx.font = '11px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Time (s)', width / 2, height - 5)

    ctx.save()
    ctx.translate(12, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Amplitude (mV)', 0, 0)
    ctx.restore()

  }, [signalData])

  return (
    <div className="ecg-signal-container" id="ecg-signal-chart">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Digitized ECG Signal
        </h4>
        <span className="status-badge status-badge-success">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></span>
          Extracted
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="ecg-signal-canvas"
        style={{ width: '100%', height: '200px' }}
      />
    </div>
  )
}
