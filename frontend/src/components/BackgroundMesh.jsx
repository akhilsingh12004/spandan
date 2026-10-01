import { useMemo } from 'react'

export default function BackgroundMesh() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${2 + Math.random() * 4}px`,
      duration: `${8 + Math.random() * 15}s`,
      delay: `${Math.random() * 10}s`,
      opacity: 0.1 + Math.random() * 0.25,
    }))
  }, [])

  return (
    <div className="bg-mesh">
      <div className="hero-particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: p.duration,
              animationDelay: p.delay,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>
    </div>
  )
}
