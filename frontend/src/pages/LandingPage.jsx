import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

/* ─── Data ─────────────────────────────────────────────────── */

const PIPELINE = [
  { num: '01', title: 'Upload',    tech: 'Express · Multipart',  icon: '↑',  col: '#7C3AED' },
  { num: '02', title: 'Enqueue',   tech: 'RabbitMQ Exchange',    icon: '⇄',  col: '#00E5FF' },
  { num: '03', title: 'Transcode', tech: 'FFmpeg Workers',       icon: '⚙',  col: '#7C3AED' },
  { num: '04', title: 'Store',     tech: 'MinIO · S3',           icon: '◈',  col: '#00E5FF' },
  { num: '05', title: 'Stream',    tech: 'HLS Adaptive',         icon: '▶',  col: '#7C3AED' },
]

const FEATURES = [
  {
    tag: 'Messaging',
    title: 'RabbitMQ Exchange routing',
    body: 'Topic exchanges fan jobs to worker pools. Each worker acks only after FFmpeg exits 0 — no silent failures.',
    accent: '#7C3AED',
    metric: '< 50ms', metricLabel: 'dispatch',
  },
  {
    tag: 'Realtime',
    title: 'Socket.IO progress stream',
    body: 'Workers emit transcode % back through the broker. Your browser knows the second a job completes.',
    accent: '#00E5FF',
    metric: '< 5ms', metricLabel: 'push latency',
  },
  {
    tag: 'Resilience',
    title: 'Dead-letter queue recovery',
    body: 'Failed messages route to a DLQ automatically. Inspect, retry, or discard — zero data loss by default.',
    accent: '#7C3AED',
    metric: '3x', metricLabel: 'retry depth',
  },
  {
    tag: 'Storage',
    title: 'MinIO object store',
    body: 'S3-compatible. Raw uploads, segmented HLS chunks, and thumbnails live in separate buckets.',
    accent: '#00E5FF',
    metric: '∞', metricLabel: 'scalable',
  },
  {
    tag: 'Delivery',
    title: 'HLS adaptive bitrate',
    body: 'FFmpeg outputs 360p / 720p / 1080p segments. Players pick the tier that fits the connection.',
    accent: '#7C3AED',
    metric: '4K', metricLabel: 'max output',
  },
  {
    tag: 'Observability',
    title: 'Prometheus + Grafana',
    body: 'Queue depth, worker throughput, error rates — all scraped at 15s intervals and graphed live.',
    accent: '#00E5FF',
    metric: '15s', metricLabel: 'scrape interval',
  },
]

const STATS = [
  { num: '10×',   sub: 'faster than sequential processing' },
  { num: '99.2%', sub: 'job success rate under load' },
  { num: '< 50ms',sub: 'queue dispatch latency' },
  { num: '4K',    sub: 'maximum output resolution' },
]

const TECH = ['RabbitMQ', 'FFmpeg', 'Node.js', 'Socket.IO', 'MinIO', 'MongoDB', 'Docker', 'Prometheus']

/* ─── Animated counter ─────────────────────────────────────── */
function useCountUp(target, duration = 1400, start = false) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!start) return
    const num = parseFloat(target.replace(/[^0-9.]/g, ''))
    if (!num) return
    let raf, startTime
    const step = (ts) => {
      if (!startTime) startTime = ts
      const pct = Math.min((ts - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - pct, 3)
      setVal(Math.round(ease * num * 10) / 10)
      if (pct < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [start, target, duration])
  return val
}

/* ─── Grid dot canvas background ──────────────────────────── */
function GridCanvas() {
  const canvasRef = useRef()
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 32
    let w, h, animId
    const resize = () => {
      w = canvas.width = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)
    let t = 0
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (let x = size / 2; x < w; x += size) {
        for (let y = size / 2; y < h; y += size) {
          const dist = Math.sqrt((x - w * 0.5) ** 2 + (y - h * 0.4) ** 2)
          const pulse = Math.sin(t * 0.018 - dist * 0.012) * 0.5 + 0.5
          const alpha = 0.04 + pulse * 0.09
          ctx.beginPath()
          ctx.arc(x, y, 1.1, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(124,58,237,${alpha})`
          ctx.fill()
        }
      }
      t++
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={S.gridCanvas} />
}

/* ─── Stat card with count-up ───────────────────────────────── */
function StatCard({ num, sub, visible }) {
  const pureNum = parseFloat(num.replace(/[^0-9.]/g, ''))
  const suffix  = num.replace(/[0-9.]/g, '')
  const counted = useCountUp(num, 1200, visible)
  const display = pureNum
    ? (Number.isInteger(pureNum) ? Math.round(counted) : counted.toFixed(1)) + suffix
    : num
  return (
    <div style={S.statCard}>
      <span style={S.statNum}>{display}</span>
      <span style={S.statSub}>{sub}</span>
    </div>
  )
}

/* ─── Feature card ─────────────────────────────────────────── */
function FeatureCard({ f, index }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        ...S.featureCard,
        borderColor: hov ? f.accent + '55' : 'rgba(255,255,255,0.07)',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? `0 16px 48px ${f.accent}18` : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* top row */}
      <div style={S.fcTop}>
        <span style={{ ...S.fcTag, color: f.accent, background: f.accent + '18', border: `1px solid ${f.accent}30` }}>
          {f.tag}
        </span>
        <span style={{ ...S.fcMetric, color: f.accent }}>
          <span style={S.fcMetricNum}>{f.metric}</span>
          <span style={S.fcMetricLabel}>{f.metricLabel}</span>
        </span>
      </div>
      <h3 style={S.fcTitle}>{f.title}</h3>
      <p style={S.fcBody}>{f.body}</p>
      {/* accent line */}
      <div style={{ ...S.fcLine, background: `linear-gradient(90deg, ${f.accent}, transparent)`, opacity: hov ? 1 : 0.3 }} />
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function LandingPage() {
  const statsRef  = useRef()
  const [statsVisible, setStatsVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true) }, { threshold: 0.3 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <main style={S.main}>

      {/* ── BG LAYERS ── */}
      <GridCanvas />
      <div style={S.orbViolet} aria-hidden />
      <div style={S.orbCyan}   aria-hidden />
      <div style={S.orbBottom} aria-hidden />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section style={S.hero}>
        <div style={S.heroInner}>

          {/* pill badge */}
          <div style={S.badge}>
            <span style={S.badgeDot} />
            <span>Distributed · RabbitMQ · FFmpeg · HLS</span>
          </div>

          {/* headline */}
          <h1 style={S.h1}>
            Video processing<br />
            <span style={S.h1Gradient}>engineered to scale.</span>
          </h1>

          <p style={S.heroSub}>
            Upload once. RabbitMQ fans your job across parallel FFmpeg workers.
            Dead-letter recovery, live Socket.IO progress, adaptive HLS output —
            built for production from day one.
          </p>

          {/* CTAs */}
          <div style={S.heroCtas}>
            <Link to="/upload" style={S.ctaPrimary}>
              <span>Upload a video</span>
              <span style={S.ctaArrow}>→</span>
            </Link>
            <Link to="/videos" style={S.ctaGhost}>Browse library</Link>
          </div>

          {/* Tech chips */}
          <div style={S.techRow}>
            {TECH.map(t => (
              <span key={t} style={S.techChip}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── hero mock terminal ── */}
        <div style={S.terminal}>
          <div style={S.termBar}>
            <span style={{ ...S.termDot, background: '#ff5f57' }} />
            <span style={{ ...S.termDot, background: '#febc2e' }} />
            <span style={{ ...S.termDot, background: '#28c840' }} />
            <span style={S.termTitle}>worker-node-01</span>
          </div>
          <div style={S.termBody}>
            {[
              { t: 0,    col: '#475569', line: '$ node worker.js --queue=transcode' },
              { t: 200,  col: '#10B981', line: '[RabbitMQ] Connected to amqp://broker:5672' },
              { t: 400,  col: '#94A3B8', line: '[Worker]   Waiting for jobs on "transcode" exchange…' },
              { t: 600,  col: '#7C3AED', line: '[Job]      Received job_id=f3a9c · input=raw/f3a9c.mp4' },
              { t: 800,  col: '#00E5FF', line: '[FFmpeg]   Transcoding 720p… 0%' },
              { t: 1000, col: '#00E5FF', line: '[FFmpeg]   Transcoding 720p… 47%' },
              { t: 1200, col: '#00E5FF', line: '[FFmpeg]   Transcoding 720p… 100% ✓' },
              { t: 1400, col: '#10B981', line: '[MinIO]    Uploaded 42 HLS segments → bucket/f3a9c/' },
              { t: 1600, col: '#7C3AED', line: '[RabbitMQ] ACK job_id=f3a9c · queue=0 msgs remaining' },
              { t: 1800, col: '#94A3B8', line: '[Worker]   Waiting for jobs on "transcode" exchange…' },
            ].map((l, i) => (
              <TermLine key={i} col={l.col} line={l.line} delay={l.t} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS
      ══════════════════════════════════════════ */}
      <section ref={statsRef} style={S.statsSection}>
        <div style={S.statsInner}>
          {STATS.map(s => <StatCard key={s.num} num={s.num} sub={s.sub} visible={statsVisible} />)}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PIPELINE
      ══════════════════════════════════════════ */}
      <section style={S.pipeSection}>
        <div style={S.container}>
          <div style={S.secHead}>
            <p style={S.secEye}>Architecture</p>
            <h2 style={S.h2}>Five steps. Zero bottlenecks.</h2>
            <p style={S.secSub}>
              Each stage is decoupled. Workers scale horizontally at step 3.
              Everything else stays stateless.
            </p>
          </div>

          {/* pipeline row */}
          <div style={S.pipeRow}>
            {PIPELINE.map((p, i) => (
              <PipeNode key={p.num} p={p} isLast={i === PIPELINE.length - 1} />
            ))}
          </div>

          {/* connector label below */}
          <p style={S.pipeNote}>
            ← AMQP protocol bridges every stage · Prometheus scrapes each node at 15s
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section style={S.featSection}>
        <div style={S.container}>
          <div style={S.secHead}>
            <p style={S.secEye}>Capabilities</p>
            <h2 style={S.h2}>Built for production, not demos.</h2>
          </div>
          <div style={S.featGrid}>
            {FEATURES.map((f, i) => <FeatureCard key={f.title} f={f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA
      ══════════════════════════════════════════ */}
      <section style={S.ctaSection}>
        <div style={S.ctaBox}>
          {/* glow orb inside box */}
          <div style={S.ctaOrb} aria-hidden />
          <p style={S.ctaEye}>Ready?</p>
          <h2 style={S.ctaH2}>
            The queue is empty.<br />Workers are waiting.
          </h2>
          <p style={S.ctaBody}>
            Drop a video. Watch it fan out across the worker pool in real time.
          </p>
          <div style={S.ctaBtns}>
            <Link to="/upload" style={S.ctaPrimary}>
              <span>Upload your first video</span>
              <span style={S.ctaArrow}>→</span>
            </Link>
            <Link to="/videos" style={S.ctaGhost}>View library</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <div style={S.footerLogo}>
          <span style={{ color: 'var(--accent-violet)', fontSize: 18 }}>⬡</span>
          <span style={S.footerBrand}>VIDEX</span>
        </div>
        <div style={S.footerStack}>
          {TECH.map((t, i) => (
            <span key={t} style={S.footerChip}>{t}</span>
          ))}
        </div>
        <p style={S.footerCopy}>
          Built by Aditya · Distributed Systems Portfolio Project
        </p>
      </footer>

    </main>
  )
}

/* ─── TermLine: types in with delay ──────────────────────────── */
function TermLine({ col, line, delay }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  if (!show) return null
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 5, animation: 'fadeSlideUp 0.25s ease both' }}>
      <span style={{ color: col, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {line}
      </span>
    </div>
  )
}

/* ─── PipeNode ───────────────────────────────────────────────── */
function PipeNode({ p, isLast }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={S.pipeItem}>
      <div
        style={{
          ...S.pipeNode,
          borderColor: hov ? p.col : 'rgba(255,255,255,0.1)',
          boxShadow: hov ? `0 0 28px ${p.col}44` : 'none',
          transform: hov ? 'translateY(-4px)' : 'none',
        }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        <div style={{ ...S.pipeIconWrap, background: p.col + '18', borderColor: p.col + '40' }}>
          <span style={{ ...S.pipeIcon, color: p.col }}>{p.icon}</span>
        </div>
        <span style={{ ...S.pipeNum, color: p.col }}>{p.num}</span>
        <span style={S.pipeTitle}>{p.title}</span>
        <span style={S.pipeTech}>{p.tech}</span>
      </div>
      {!isLast && (
        <div style={S.pipeConnector}>
          <div style={S.pipeConnLine} />
          <span style={S.pipeConnArrow}>›</span>
        </div>
      )}
    </div>
  )
}

/* ─── Styles ─────────────────────────────────────────────────── */
const S = {
  main: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: '100vh',
  },

  /* BG */
  gridCanvas: {
    position: 'fixed', inset: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: 0,
  },
  orbViolet: {
    position: 'fixed',
    width: 700, height: 700, borderRadius: '50%',
    background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)',
    opacity: 0.12, filter: 'blur(60px)',
    top: -250, left: -200,
    pointerEvents: 'none', zIndex: 0,
  },
  orbCyan: {
    position: 'fixed',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, #00E5FF 0%, transparent 70%)',
    opacity: 0.07, filter: 'blur(60px)',
    top: 100, right: -150,
    pointerEvents: 'none', zIndex: 0,
  },
  orbBottom: {
    position: 'fixed',
    width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)',
    opacity: 0.08, filter: 'blur(80px)',
    bottom: -300, right: -100,
    pointerEvents: 'none', zIndex: 0,
  },

  /* HERO */
  hero: {
    position: 'relative', zIndex: 1,
    minHeight: '100vh',
    maxWidth: 1260, margin: '0 auto',
    padding: '100px 32px 80px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 60,
    alignItems: 'center',
  },
  heroInner: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 },

  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
    color: '#00E5FF',
    background: 'rgba(0,229,255,0.06)',
    border: '1px solid rgba(0,229,255,0.18)',
    padding: '6px 14px', borderRadius: 20,
    marginBottom: 28,
  },
  badgeDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#00E5FF',
    boxShadow: '0 0 8px #00E5FF',
    flexShrink: 0,
    animation: 'glow 2s ease-in-out infinite alternate',
  },

  h1: {
    fontSize: 'clamp(36px, 4.5vw, 68px)',
    fontWeight: 700,
    lineHeight: 1.08,
    letterSpacing: '-0.035em',
    color: '#E2E8F0',
    marginBottom: 22,
  },
  h1Gradient: {
    display: 'block',
    background: 'linear-gradient(100deg, #7C3AED 0%, #a855f7 40%, #00E5FF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  heroSub: {
    fontSize: 16, lineHeight: 1.75,
    color: '#94A3B8',
    maxWidth: 480,
    marginBottom: 36,
  },

  heroCtas: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 },
  ctaPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'linear-gradient(135deg, #7C3AED 0%, #6d28d9 100%)',
    color: '#fff',
    fontSize: 15, fontWeight: 600,
    padding: '13px 24px',
    borderRadius: 12,
    boxShadow: '0 4px 32px rgba(124,58,237,0.35)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    letterSpacing: '0.01em',
    textDecoration: 'none',
  },
  ctaArrow: {
    display: 'inline-block',
    transition: 'transform 0.15s',
    fontSize: 18,
  },
  ctaGhost: {
    display: 'inline-flex', alignItems: 'center',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#94A3B8',
    fontSize: 15, fontWeight: 500,
    padding: '13px 24px',
    borderRadius: 12,
    textDecoration: 'none',
    transition: 'border-color 0.15s, color 0.15s',
  },

  techRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  techChip: {
    fontSize: 11, fontWeight: 600,
    padding: '4px 10px', borderRadius: 6,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#475569',
    letterSpacing: '0.03em',
  },

  /* TERMINAL */
  terminal: {
    background: '#0d1117',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.2)',
  },
  termBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 16px',
    background: '#161b22',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  termDot: { width: 12, height: 12, borderRadius: '50%', flexShrink: 0 },
  termTitle: { fontSize: 12, color: '#475569', marginLeft: 8, fontFamily: 'var(--font-mono)' },
  termBody: { padding: '20px', minHeight: 320 },

  /* STATS */
  statsSection: {
    position: 'relative', zIndex: 1,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(26,34,53,0.4)',
    backdropFilter: 'blur(8px)',
    padding: '56px 32px',
  },
  statsInner: {
    maxWidth: 1100, margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 1,
  },
  statCard: {
    display: 'flex', flexDirection: 'column', gap: 8,
    alignItems: 'center', textAlign: 'center',
    padding: '8px 24px',
    borderRight: '1px solid rgba(255,255,255,0.06)',
  },
  statNum: {
    fontSize: 'clamp(28px, 3.5vw, 48px)',
    fontWeight: 700, letterSpacing: '-0.03em',
    background: 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontFamily: 'var(--font-mono)',
  },
  statSub: { fontSize: 13, color: '#475569', lineHeight: 1.4 },

  /* PIPELINE */
  pipeSection: {
    position: 'relative', zIndex: 1,
    padding: '100px 0',
  },
  container: { maxWidth: 1100, margin: '0 auto', padding: '0 32px' },
  secHead: { marginBottom: 56, maxWidth: 580 },
  secEye: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#7C3AED',
    marginBottom: 12,
  },
  h2: {
    fontSize: 'clamp(28px, 3.5vw, 44px)',
    fontWeight: 700, letterSpacing: '-0.025em',
    color: '#E2E8F0',
    lineHeight: 1.15,
    marginBottom: 14,
  },
  secSub: { fontSize: 15, color: '#64748B', lineHeight: 1.7 },

  pipeRow: {
    display: 'flex', alignItems: 'center',
    gap: 0, overflowX: 'auto',
    paddingBottom: 12,
  },
  pipeItem: { display: 'flex', alignItems: 'center', flex: '1 1 0' },
  pipeNode: {
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 6,
    padding: '24px 16px',
    background: '#1A2235',
    border: '1px solid',
    borderRadius: 16,
    cursor: 'default',
    transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
    minWidth: 140,
  },
  pipeIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid',
    marginBottom: 4,
  },
  pipeIcon: { fontSize: 20, lineHeight: 1 },
  pipeNum: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' },
  pipeTitle: { fontSize: 15, fontWeight: 700, color: '#E2E8F0' },
  pipeTech: { fontSize: 11, color: '#475569', textAlign: 'center', lineHeight: 1.4 },
  pipeConnector: {
    display: 'flex', alignItems: 'center',
    padding: '0 8px', flexShrink: 0, position: 'relative',
  },
  pipeConnLine: {
    width: 24, height: 1,
    background: 'linear-gradient(90deg, rgba(124,58,237,0.5), rgba(0,229,255,0.5))',
  },
  pipeConnArrow: { color: '#00E5FF', fontSize: 18, marginLeft: -4 },
  pipeNote: {
    fontSize: 12, color: '#334155',
    textAlign: 'center', marginTop: 28,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.02em',
  },

  /* FEATURES */
  featSection: { position: 'relative', zIndex: 1, padding: '100px 0' },
  featGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  featureCard: {
    position: 'relative',
    background: '#111827',
    border: '1px solid',
    borderRadius: 18,
    padding: '28px 26px 24px',
    cursor: 'default',
    transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
    overflow: 'hidden',
  },
  fcTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  fcTag: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '4px 10px', borderRadius: 20,
  },
  fcMetric: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 },
  fcMetricNum: { fontSize: 18, fontWeight: 700, lineHeight: 1, fontFamily: 'var(--font-mono)' },
  fcMetricLabel: { fontSize: 10, color: '#475569', letterSpacing: '0.04em' },
  fcTitle: { fontSize: 17, fontWeight: 700, color: '#E2E8F0', marginBottom: 10, lineHeight: 1.3, letterSpacing: '-0.01em' },
  fcBody: { fontSize: 13, color: '#64748B', lineHeight: 1.7 },
  fcLine: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 2,
    transition: 'opacity 0.25s',
  },

  /* CTA SECTION */
  ctaSection: {
    position: 'relative', zIndex: 1,
    padding: '100px 32px',
    display: 'flex', justifyContent: 'center',
  },
  ctaBox: {
    position: 'relative',
    maxWidth: 680, width: '100%',
    background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(0,229,255,0.06) 100%)',
    border: '1px solid rgba(124,58,237,0.25)',
    borderRadius: 28,
    padding: '72px 56px',
    textAlign: 'center',
    overflow: 'hidden',
  },
  ctaOrb: {
    position: 'absolute',
    width: 300, height: 300, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
    top: -100, left: '50%',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
  },
  ctaEye: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#7C3AED', marginBottom: 16,
  },
  ctaH2: {
    fontSize: 'clamp(26px, 4vw, 40px)',
    fontWeight: 700, letterSpacing: '-0.025em',
    color: '#E2E8F0', lineHeight: 1.2,
    marginBottom: 16,
  },
  ctaBody: { fontSize: 15, color: '#64748B', marginBottom: 36, lineHeight: 1.65 },
  ctaBtns: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },

  /* FOOTER */
  footer: {
    position: 'relative', zIndex: 1,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '36px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    background: 'rgba(11,15,26,0.8)',
    backdropFilter: 'blur(8px)',
  },
  footerLogo: { display: 'flex', alignItems: 'center', gap: 8 },
  footerBrand: { fontSize: 16, fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.05em' },
  footerStack: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  footerChip: {
    fontSize: 11, fontWeight: 500,
    padding: '3px 10px', borderRadius: 6,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: '#475569',
  },
  footerCopy: { fontSize: 12, color: '#334155' },
}