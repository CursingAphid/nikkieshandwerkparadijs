import { useEffect, useMemo, useRef, useState } from 'react'
import towelBase from './assets/towel examples/1.png'
import './App.css'

type FontOption = {
  label: string
  className: string
}

const DEFAULT_FONT = 'font-pacifico'

const COLOR_OPTIONS = [
  '#dc2626', // red-600
  '#16a34a', // green-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#f59e0b', // amber-500
  '#374151', // gray-700
]

// --- Towel and color utilities ---
async function replaceTowel(towelImageUrl: string): Promise<string> {
  // Simply return the selected towel image directly
  return towelImageUrl
}

function rgbToHex(r: number, g: number, b: number): string {
  const to2 = (n: number) => n.toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

function computeHueSaturation(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h, s, v }
}

function isRedPixel(r: number, g: number, b: number): boolean {
  const { h, s, v } = computeHueSaturation(r, g, b)
  // Red hue near 0/360 with reasonable saturation and brightness
  const redHue = h <= 18 || h >= 342
  return redHue && s >= 0.45 && v >= 0.25
}

function isGreenPixel(r: number, g: number, b: number): boolean {
  const { h, s, v } = computeHueSaturation(r, g, b)
  // Broader green hue range to catch more green pixels (90-150 degrees)
  const greenHue = h >= 90 && h <= 150
  // Lower thresholds to catch lighter/smaller green areas
  return greenHue && s >= 0.3 && v >= 0.2
}

type DominantBin = { count: number; r: number; g: number; b: number }

async function getDominantColorFromImage(imgUrl: string): Promise<string> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = imgUrl
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = (e) => reject(e)
  })
  const sampleSize = 64
  const canvas = document.createElement('canvas')
  canvas.width = sampleSize
  canvas.height = sampleSize
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize)
  const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize)
  const bins: Map<string, DominantBin> = new Map()
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 128) continue
    const r = data[i], g = data[i + 1], b = data[i + 2]
    // Skip near-white and near-black pixels
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    if (lum < 16 || lum > 245) continue
    const rq = r >> 4, gq = g >> 4, bq = b >> 4
    const key = `${rq}-${gq}-${bq}`
    const cur: DominantBin = bins.get(key) || { count: 0, r: 0, g: 0, b: 0 }
    cur.count += 1
    cur.r += r
    cur.g += g
    cur.b += b
    bins.set(key, cur)
  }
  
  // Find the bin with the highest count
  let maxCount = 0
  let bestBin: DominantBin = { count: 0, r: 0, g: 0, b: 0 }
  
  bins.forEach((bin) => {
    if (bin.count > maxCount) {
      maxCount = bin.count
      bestBin = bin
    }
  })
  
  if (bestBin.count === 0) return '#c2410c' // fallback amber-ish
  
  const r = Math.round(bestBin.r / bestBin.count)
  const g = Math.round(bestBin.g / bestBin.count)
  const b = Math.round(bestBin.b / bestBin.count)
  return rgbToHex(r, g, b)
}

async function recolorArmsToColor(towelUrl: string, targetHex: string): Promise<string> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = towelUrl
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = (e) => reject(e)
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = image.data
  // target color
  const clean = targetHex.replace('#', '')
  const bigint = parseInt(clean, 16)
  const tr = (bigint >> 16) & 255
  const tg = (bigint >> 8) & 255
  const tb = bigint & 255
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a === 0) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (!isRedPixel(r, g, b)) continue
    // Preserve shading: compute luminance and scale target
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    data[i] = Math.round((tr * lum) / 255)
    data[i + 1] = Math.round((tg * lum) / 255)
    data[i + 2] = Math.round((tb * lum) / 255)
  }
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

async function recolorArmGreenToColor(armUrl: string, targetHex: string): Promise<string> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = armUrl
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = (e) => reject(e)
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = image.data
  // target color
  const clean = targetHex.replace('#', '')
  const bigint = parseInt(clean, 16)
  const tr = (bigint >> 16) & 255
  const tg = (bigint >> 8) & 255
  const tb = bigint & 255
  
  // Compute target HSV for the new color
  const targetHSV = computeHueSaturation(tr, tg, tb)
  
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a === 0) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (!isGreenPixel(r, g, b)) continue
    
    // Get original HSV to preserve value (brightness)
    const { v: originalV } = computeHueSaturation(r, g, b)

    // Use target hue/saturation but preserve more of the original brightness
    // Reduced brightness boost for less bright results
    const h = targetHSV.h
    const s = targetHSV.s
    const v = Math.min(1, originalV * 1.1)
    
    const c = v * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = v - c
    
    let rPrime = 0, gPrime = 0, bPrime = 0
    if (h >= 0 && h < 60) {
      rPrime = c; gPrime = x; bPrime = 0
    } else if (h >= 60 && h < 120) {
      rPrime = x; gPrime = c; bPrime = 0
    } else if (h >= 120 && h < 180) {
      rPrime = 0; gPrime = c; bPrime = x
    } else if (h >= 180 && h < 240) {
      rPrime = 0; gPrime = x; bPrime = c
    } else if (h >= 240 && h < 300) {
      rPrime = x; gPrime = 0; bPrime = c
    } else {
      rPrime = c; gPrime = 0; bPrime = x
    }
    
    data[i] = Math.round((rPrime + m) * 255)
    data[i + 1] = Math.round((gPrime + m) * 255)
    data[i + 2] = Math.round((bPrime + m) * 255)
  }
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

// Head recoloring temporarily disabled

function App() {
  const [babyName, setBabyName] = useState('Nikki')
  const font = DEFAULT_FONT
  const [color, setColor] = useState(COLOR_OPTIONS[3])
  const [pattern, setPattern] = useState<string | null>(null)
  const [processedTowel, setProcessedTowel] = useState<string | null>(null)
  const [, setComputedFontSize] = useState<number>(48)
  const [headSrc, setHeadSrc] = useState<string | null>(null)
  const [processedHead, setProcessedHead] = useState<string | null>(null)

  const textContainerRef = useRef<HTMLDivElement | null>(null)
  const textRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const patterns = useMemo(() => {
    const modules = import.meta.glob('./assets/towel examples/*.{png,jpg,jpeg,webp,svg}', { eager: true }) as Record<string, { default: string }>
    return Object.values(modules).map((m) => m.default)
  }, [])

  // --- Canvas composite preview --- (moved after all related state is declared)

  const headOptions = useMemo(() => {
    const modules = import.meta.glob('./assets/head examples/*.{png,jpg,jpeg,webp,svg}', { eager: true }) as Record<string, { default: string }>
    return Object.values(modules).map((m) => m.default)
  }, [])

  const armOptions = useMemo(() => {
    const modules = import.meta.glob('./assets/arm example.*', { eager: true }) as Record<string, { default: string }>
    return Object.values(modules).map((m) => m.default)
  }, [])

  // Auto-select first towel option when patterns load
  useEffect(() => {
    if (!pattern && patterns.length > 0) {
      setPattern(patterns[0])
    }
  }, [patterns, pattern])

  // Auto-select first head option when head options load
  useEffect(() => {
    if (!headSrc && headOptions.length > 0) {
      setHeadSrc(headOptions[0])
    }
  }, [headOptions, headSrc])

  const [armSrc, setArmSrc] = useState<string | null>(null)
  const [armColor, setArmColor] = useState(COLOR_OPTIONS[0])
  const [processedArm, setProcessedArm] = useState<string | null>(null)
  
  useEffect(() => {
    if (!armSrc && armOptions.length > 0) {
      setArmSrc(armOptions[0])
    }
  }, [armOptions, armSrc])

  // Process arm when source or color changes
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!armSrc) { setProcessedArm(null); return }
      try {
        const recolored = await recolorArmGreenToColor(armSrc, armColor)
        if (!cancelled) setProcessedArm(recolored)
      } catch (e) {
        console.error('Failed to recolor arm:', e)
        if (!cancelled) setProcessedArm(armSrc)
      }
    }
    run()
    return () => { cancelled = true }
  }, [armSrc, armColor])

  // Base towel image is imported for reliable bundling
  
  // Process towel when selection or head changes: use towel as-is without recoloring
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!pattern) { setProcessedTowel(null); return }
      try {
        // Always use towel as-is without any color changes
        const out = await replaceTowel(pattern)
        if (!cancelled) setProcessedTowel(out)
      } catch (e) {
        console.error('Failed to process towel:', e)
        if (!cancelled) setProcessedTowel(pattern)
      }
    }
    run()
    return () => { cancelled = true }
  }, [pattern])

  // Use original head image directly (no recoloring for now)
  useEffect(() => {
    if (!headSrc) { setProcessedHead(null); return }
    setProcessedHead(headSrc)
  }, [headSrc])

  // --- Canvas composite preview ---
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const DESIGN_W = 1200
    const DESIGN_H = 1600
    canvas.width = DESIGN_W
    canvas.height = DESIGN_H

    const towelSrc = processedTowel || pattern || towelBase
    const headOverlay = processedHead || headSrc || null
    const armOverlay = processedArm || armSrc || null

    function loadImage(src: string): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = (e) => reject(e)
        img.src = src
      })
    }

    function getCanvasFontFamily(className: string): string {
      if (className.includes('font-poppins')) return "Poppins, system-ui, sans-serif"
      if (className.includes('font-playfair')) return "'Playfair Display', serif"
      if (className.includes('font-pacifico')) return "Pacifico, cursive"
      return 'system-ui, sans-serif'
    }

    async function draw() {
      // clear
      ctx.clearRect(0, 0, DESIGN_W, DESIGN_H)

      try {
        const toLoad: Promise<HTMLImageElement>[] = []
        toLoad.push(loadImage(towelSrc))
        if (armOverlay) toLoad.push(loadImage(armOverlay))
        if (headOverlay) toLoad.push(loadImage(headOverlay))
        const images = await Promise.all(toLoad)

        // Compute contained placement to avoid stretching
        const baseImg = images[0]
        const imgW = baseImg.naturalWidth || baseImg.width
        const imgH = baseImg.naturalHeight || baseImg.height
        const scale = Math.min(DESIGN_W / imgW, DESIGN_H / imgH)
        const drawW = Math.round(imgW * scale)
        const drawH = Math.round(imgH * scale)
        const dx = Math.round((DESIGN_W - drawW) / 2)
        const dy = Math.round((DESIGN_H - drawH) / 2)

        // Draw towel base (contained, centered)
        ctx.drawImage(baseImg, dx, dy, drawW, drawH)

        // Draw arm (if present)
        let idx = 1
        if (armOverlay) {
          ctx.drawImage(images[idx], dx, dy, drawW, drawH)
          idx += 1
        }
        // Draw head (if present)
        if (headOverlay) {
          ctx.drawImage(images[idx], dx, dy, drawW, drawH)
        }

        // Draw text
        const fontFamily = getCanvasFontFamily(font)
        // Start with proportional size, then shrink to fit safe width
        const SAFE_SIDE = 0.86
        const safeWidth = drawW * SAFE_SIDE
        let size = Math.max(14, Math.floor(drawW * 0.08))
        ctx.font = `${size}px ${fontFamily}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = color

        const text = (babyName || 'Your Text')
        let metrics = ctx.measureText(text)
        if (metrics.width > safeWidth) {
          size = Math.floor(size * (safeWidth / Math.max(1, metrics.width)))
          size = Math.max(14, size)
          ctx.font = `${size}px ${fontFamily}`
          metrics = ctx.measureText(text)
        }

        // Position ~32% from bottom relative to the contained image area (moved up slightly)
        const y = dy + Math.floor(drawH * 0.68)
        const x = Math.floor(DESIGN_W * 0.5)

        // Draw black border first (4px for better visibility)
        ctx.save()
        ctx.lineWidth = 4
        ctx.lineJoin = 'round'
        ctx.miterLimit = 2
        ctx.strokeStyle = '#000000'
        ctx.strokeText(text, x, y)
        ctx.restore()
        
        // Then draw the text with the selected color
        ctx.fillText(text, x, y)
      } catch (e) {
        // If drawing fails, leave canvas blank rather than crashing
        // eslint-disable-next-line no-console
        console.error('Canvas draw failed:', e)
      }
    }

    draw()
  }, [processedTowel, pattern, towelBase, processedHead, headSrc, processedArm, armSrc, babyName, font, color])

  // --- Auto-fit preview text within the image ---
  useEffect(() => {
    function fitText() {
      const container = textContainerRef.current
      const textEl = textRef.current
      if (!container || !textEl) return

      const MIN_FONT = 14
      const H_PADDING = 32 // safe space from edges
      const BASE_RATIO = 0.08 // proportion of container width

      // Start from proportional size relative to image/container width
      const initialSize = Math.max(MIN_FONT, Math.floor(container.clientWidth * BASE_RATIO))
      textEl.style.fontSize = `${initialSize}px`
      textEl.style.whiteSpace = 'nowrap'

      const availableWidth = Math.max(0, container.clientWidth - H_PADDING)
      const measuredWidth = Math.max(1, textEl.scrollWidth)
      // Shrink proportionally if current size overflows
      let nextSize = initialSize
      if (measuredWidth > availableWidth) {
        nextSize = Math.floor(initialSize * (availableWidth / measuredWidth))
        nextSize = Math.max(MIN_FONT, nextSize)
      }

      textEl.style.fontSize = `${nextSize}px`
      // Nudge down if still overflowing
      let guard = 0
      while (guard < 10 && textEl.scrollWidth > availableWidth && nextSize > MIN_FONT) {
        nextSize -= 1
        textEl.style.fontSize = `${nextSize}px`
        guard += 1
      }
      setComputedFontSize(nextSize)
    }

    // Fit when name, font, or towel processing changes
    // Use rAF to ensure DOM has painted with new font before measuring
    const raf = requestAnimationFrame(fitText)
    return () => cancelAnimationFrame(raf)
  }, [babyName, font, processedTowel])

  // Observe container size changes (responsive)
  useEffect(() => {
    const container = textContainerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => {
      // Recompute on container resize
      const textEl = textRef.current
      if (!textEl) return
      const event = new Event('recalculate')
      // Trigger the other effect by transiently updating size directly and then syncing state
      // Call the same logic inline to avoid dependency ping-pong
      const MIN_FONT = 14
      const H_PADDING = 32
      const BASE_RATIO = 0.08
      const initialSize = Math.max(MIN_FONT, Math.floor(container.clientWidth * BASE_RATIO))
      textEl.style.fontSize = `${initialSize}px`
      textEl.style.whiteSpace = 'nowrap'
      const availableWidth = Math.max(0, container.clientWidth - H_PADDING)
      const measuredWidth = Math.max(1, textEl.scrollWidth)
      let nextSize = initialSize
      if (measuredWidth > availableWidth) {
        nextSize = Math.floor(initialSize * (availableWidth / measuredWidth))
        nextSize = Math.max(MIN_FONT, nextSize)
      }
      textEl.style.fontSize = `${nextSize}px`
      let guard = 0
      while (guard < 10 && textEl.scrollWidth > availableWidth && nextSize > MIN_FONT) {
        nextSize -= 1
        textEl.style.fontSize = `${nextSize}px`
        guard += 1
      }
      setComputedFontSize(nextSize)
      // emit no-op event to appease potential listeners
      container.dispatchEvent(event)
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  return (
    <div>
      {/* SVG filters for subtle stitch/displacement */}
      <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="embroideryDisplacement" x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div className="container">
        <h1 className="title">Maak je baby kraamcadeau</h1>
        <p className="subtitle">Dit geeft je een goed idee en inspiratie. Veel meer is mogelijk! Neem contact op voor alle opties.</p>

        <div className="grid" style={{ marginTop: 32 }}>
          {/* Controls */}
          <div className="card">
            {/* Name */}
            <div style={{ marginBottom: 24 }}>
              <label className="label">Naam</label>
              <input
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="Voer naam in"
                className="input"
                maxLength={10}
              />
            </div>

            {/* Color */}
            <div style={{ marginBottom: 24 }}>
              <label className="label">Tekstkleur</label>
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

          {/* Head */}
          <div style={{ marginBottom: 24 }}>
            <label className="label">Hoofd</label>
            <div className="pattern-grid">
              {headOptions.map((h) => (
                <button
                  key={h}
                  onClick={() => setHeadSrc(h)}
                  className={`pattern-btn ${headSrc === h ? 'active' : ''}`}
                >
                  <img src={h} alt="hoofd" className="pattern-img" />
                </button>
              ))}
            </div>
          </div>

          {/* Arm color */}
          <div style={{ marginBottom: 24 }}>
            <label className="label">Armkleur</label>
            <div className="color-row">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setArmColor(c)}
                  style={{ backgroundColor: c }}
                  className={`color-swatch ${armColor === c ? 'active' : ''}`}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

            {/* Towel */}
            <div style={{ marginBottom: 24 }}>
              <label className="label">Handdoek</label>
              <div className="pattern-grid">
                {patterns.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPattern(p)}
                    className={`pattern-btn ${pattern === p ? 'active' : ''}`}
                  >
                    <img src={p} alt="handdoek" className="pattern-img" />
                  </button>
                ))}
              </div>
            </div>

            {/* No head/arms controls for now */}
          </div>

          {/* Preview */}
          <div className="card preview-card">
            <div className="preview-canvas">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
