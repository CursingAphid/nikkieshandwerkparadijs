import { useMemo, useState } from 'react'
import './App.css'

type FontOption = {
  label: string
  className: string
}

const FONT_OPTIONS: FontOption[] = [
  { label: 'Poppins', className: 'font-poppins' },
  { label: 'Playfair Display', className: 'font-playfair' },
  { label: 'Pacifico', className: 'font-pacifico' },
]

const COLOR_OPTIONS = [
  '#1f2937', // gray-800
  '#dc2626', // red-600
  '#16a34a', // green-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
]

function App() {
  const [babyName, setBabyName] = useState('Nikki')
  const [font, setFont] = useState(FONT_OPTIONS[0].className)
  const [color, setColor] = useState(COLOR_OPTIONS[3])
  const [pattern, setPattern] = useState<string | null>(null)

  const patterns = useMemo(() => {
    const count = 7
    return Array.from({ length: count }, (_, i) => `/patterns/${i + 1}.png`)
  }, [])

  return (
    <div>
      <div className="container">
        <h1 className="title">Create your baby maternity gift</h1>
        <p className="subtitle">Type a name, choose a font, color, and pattern.</p>

        <div className="grid" style={{ marginTop: 32 }}>
          {/* Controls */}
          <div className="card">
            {/* Name */}
            <div style={{ marginBottom: 24 }}>
              <label className="label">Name</label>
              <input
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="Enter name"
                className="input"
              />
            </div>

            {/* Font */}
            <div style={{ marginBottom: 24 }}>
              <label className="label">Font</label>
              <div className="font-grid">
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => setFont(f.className)}
                    className={`btn-choice ${font === f.className ? 'active' : ''}`}
                  >
                    <span className={f.className}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div style={{ marginBottom: 24 }}>
              <label className="label">Text color</label>
              <div className="color-row">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`color-swatch ${color === c ? 'active' : ''}`}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            {/* Pattern */}
            <div>
              <label className="label">Pattern</label>
              <div className="pattern-grid">
                {patterns.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPattern(p)}
                    className={`pattern-btn ${pattern === p ? 'active' : ''}`}
                  >
                    <img src={p} alt="pattern" className="pattern-img" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="card preview-card">
            <div className="preview-canvas">
              {/* Background pattern */}
              {pattern ? (
                <img src={pattern} className="preview-pattern" alt="Selected pattern" />
              ) : null}

              {/* Baby wipe overlay panel */}
              <div className="preview-overlay"></div>

              {/* Name text */}
              <div className="preview-text-wrap">
                <div>
                  <div className={`${font} preview-text`} style={{ color }}>{babyName || 'Your Text'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
