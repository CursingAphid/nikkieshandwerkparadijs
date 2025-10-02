import { useMemo, useState } from 'react'
import './App.css'

type FontOption = {
  label: string
  className: string
}

const FONT_OPTIONS: FontOption[] = [
  { label: 'Poppins', className: 'font-[\'Poppins\']' },
  { label: 'Playfair Display', className: 'font-[\'Playfair Display\']' },
  { label: 'Pacifico', className: 'font-[\'Pacifico\']' },
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create your baby maternity gift</h1>
        <p className="text-gray-600 mt-1">Type a name, choose a font, color, and pattern.</p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder="Enter name"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Font */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Font</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.label}
                      onClick={() => setFont(f.className)}
                      className={`${font === f.className ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200'} rounded-lg px-3 py-2 bg-gray-50 hover:bg-gray-100`}
                    >
                      <span className={f.className}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Text color</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-black' : 'border-white'} shadow`}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>

              {/* Pattern */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Pattern</label>
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {patterns.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPattern(p)}
                      className={`relative rounded-lg overflow-hidden ring-2 ${pattern === p ? 'ring-blue-500' : 'ring-transparent'} hover:ring-gray-300`}
                    >
                      <img src={p} alt="pattern" className="h-16 w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-[4/3] rounded-xl overflow-hidden border border-gray-200">
              {/* Background pattern */}
              {pattern ? (
                <img src={pattern} className="absolute inset-0 h-full w-full object-cover" alt="Selected pattern" />
              ) : (
                <div className="absolute inset-0 bg-gray-100 grid place-items-center text-gray-500">
                  Select a pattern to preview
                </div>
              )}

              {/* Baby wipe overlay panel */}
              <div className="absolute inset-6 bg-white/85 backdrop-blur rounded-xl border border-gray-200 shadow-inner"></div>

              {/* Name text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`${font} text-3xl sm:text-4xl`} style={{ color }}>{babyName || 'Your Text'}</div>
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
