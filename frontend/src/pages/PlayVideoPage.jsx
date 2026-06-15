import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'

const API = 'http://localhost:5000/api/upload'

const STATUS_META = {
  completed:  { label: 'Ready',      color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
  processing: { label: 'Processing', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  failed:     { label: 'Failed',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)' },
}

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

/* ─── Slim scrubber ─────────────────────────────────────────── */
function Scrubber({ progress, onSeek, buffered }) {
  const trackRef = useRef()
  const [hovPct, setHovPct] = useState(null)
  const [dragging, setDragging] = useState(false)

  const getPct = (e) => {
    const rect = trackRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }
  const handleDown = (e) => { setDragging(true); onSeek(getPct(e)) }
  const handleMove = (e) => {
    if (dragging) onSeek(getPct(e))
    setHovPct(getPct(e))
  }
  const handleUp = () => setDragging(false)

  return (
    <div
      ref={trackRef}
      style={S.scrubTrack}
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseLeave={() => setHovPct(null)}
      onMouseUp={handleUp}
    >
      {/* Buffered */}
      <div style={{ ...S.scrubBuffered, width: `${(buffered || 0) * 100}%` }} />
      {/* Fill */}
      <div style={{ ...S.scrubFill, width: `${progress}%` }} />
      {/* Thumb */}
      <div style={{
        ...S.scrubThumb,
        left: `${progress}%`,
        opacity: hovPct !== null || dragging ? 1 : 0,
        transform: `translateX(-50%) scale(${hovPct !== null || dragging ? 1.2 : 1})`,
      }} />
      {/* Hover time tooltip */}
      {hovPct !== null && (
        <div style={{ ...S.scrubTooltip, left: `${hovPct * 100}%` }}>
          —
        </div>
      )}
    </div>
  )
}

/* ─── Custom player controls ──────────────────────────────────── */
function PlayerControls({ videoEl, playing, progress, duration, volume, muted, buffered, onTogglePlay, onSeek, onVolume, onMute, onFullscreen, fullscreen }) {
  return (
    <div style={S.controls}>
      <Scrubber progress={progress} buffered={buffered} onSeek={pct => { if (videoEl) videoEl.currentTime = pct * (videoEl.duration || 0) }} />
      <div style={S.ctrlRow}>
        {/* Left */}
        <div style={S.ctrlLeft}>
          <button style={S.ctrlBtn} onClick={onTogglePlay} title={playing ? 'Pause' : 'Play'}>
            <span style={S.ctrlBtnIcon}>{playing ? '⏸' : '▶'}</span>
          </button>
          <div style={S.volGroup}>
            <button style={S.ctrlBtn} onClick={onMute} title={muted ? 'Unmute' : 'Mute'}>
              <span style={S.ctrlBtnIcon}>{muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
            </button>
            <input
              type="range" min="0" max="1" step="0.02"
              value={muted ? 0 : volume}
              onChange={e => onVolume(parseFloat(e.target.value))}
              style={S.volSlider}
            />
          </div>
          <span style={S.timeDisplay}>
            {fmtTime(videoEl?.currentTime || 0)}
            <span style={{ color: '#334155', margin: '0 4px' }}>/</span>
            {fmtTime(duration)}
          </span>
        </div>

        {/* Right */}
        <div style={S.ctrlRight}>
          <a href={`${API}/stream/${videoEl?.src?.split('/').pop()}`} download style={{ ...S.ctrlBtn, textDecoration: 'none' }} title="Download">
            <span style={S.ctrlBtnIcon}>⬇</span>
          </a>
          <button style={S.ctrlBtn} onClick={onFullscreen} title="Fullscreen">
            <span style={S.ctrlBtnIcon}>{fullscreen ? '⊡' : '⛶'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Related video card ──────────────────────────────────────── */
function RelatedCard({ video, current }) {
  const [imgErr, setImgErr] = useState(false)
  const [hov, setHov]       = useState(false)
  const thumb = `${API}/thumbnail/${video._id}`
  if (video._id === current) return null
  return (
    <Link
      to={`/play/${video._id}`}
      style={{
        ...S.relCard,
        background: hov ? 'rgba(255,255,255,0.04)' : '#111827',
        borderColor: hov ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={S.relThumb}>
        {imgErr ? (
          <div style={S.relThumbFb}>🎬</div>
        ) : (
          <img src={thumb} alt={video.title} style={S.relThumbImg} onError={() => setImgErr(true)} />
        )}
        {hov && <div style={S.relPlayOverlay}>▶</div>}
      </div>
      <div style={S.relMeta}>
        <p style={S.relTitle}>{video.title || 'Untitled'}</p>
        <p style={S.relSub}>{video.status || 'unknown'}</p>
      </div>
    </Link>
  )
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function PlayVideoPage() {
  const { id }                      = useParams()
  const videoRef                    = useRef()
  const playerWrapRef               = useRef()
  const [video, setVideo]           = useState(null)
  const [allVideos, setAllVideos]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [playing, setPlaying]       = useState(false)
  const [progress, setProgress]     = useState(0)
  const [duration, setDuration]     = useState(0)
  const [volume, setVolume]         = useState(0.85)
  const [muted, setMuted]           = useState(false)
  const [buffered, setBuffered]     = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [copied, setCopied]         = useState(false)
  const [tab, setTab]               = useState('info')
  const controlsTimer               = useRef()

  useEffect(() => {
    setLoading(true); setError('')
    fetch(`${API}/all`)
      .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json() })
      .then(data => {
        const arr = Array.isArray(data) ? data : data.videos || data.data || []
        setAllVideos(arr)
        const cur = arr.find(v => v._id === id)
        if (!cur) throw new Error('Video not found in library')
        setVideo(cur)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [id])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !video) return
    el.src = `${API}/stream/${id}`
    el.volume = volume
    el.load()
  }, [video, id])

  const onTimeUpdate = () => {
    const el = videoRef.current
    if (!el || !el.duration) return
    setProgress((el.currentTime / el.duration) * 100)
    if (el.buffered.length > 0) setBuffered(el.buffered.end(el.buffered.length - 1) / el.duration)
  }

  const togglePlay = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) { el.play(); setPlaying(true) }
    else { el.pause(); setPlaying(false) }
  }, [])

  const setVolHandler = (v) => {
    setVolume(v)
    if (videoRef.current) videoRef.current.volume = v
    if (v > 0) setMuted(false)
  }

  const toggleMute = () => {
    const el = videoRef.current
    if (!el) return
    el.muted = !el.muted
    setMuted(el.muted)
  }

  const toggleFullscreen = () => {
    const el = playerWrapRef.current
    if (!document.fullscreenElement) { el.requestFullscreen?.(); setFullscreen(true) }
    else { document.exitFullscreen?.(); setFullscreen(false) }
  }

  // Auto-hide controls
  const onPlayerMouseMove = () => {
    setShowControls(true)
    clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => { if (playing) setShowControls(false) }, 2500)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  if (loading) return (
    <div style={S.centerScreen}>
      <div style={S.loadSpinner} />
      <p style={{ color: '#475569', fontSize: 14, marginTop: 16 }}>Loading video…</p>
    </div>
  )
  if (error) return (
    <div style={S.centerScreen}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
      <h2 style={{ color: '#E2E8F0', marginBottom: 8 }}>Could not load video</h2>
      <p style={{ color: '#64748B', marginBottom: 24, fontSize: 14 }}>{error}</p>
      <Link to="/videos" style={S.backBtn}>← Back to library</Link>
    </div>
  )

  const related = allVideos.filter(v => v._id !== id).slice(0, 10)
  const meta    = STATUS_META[video.status] || { label: video.status || 'Unknown', color: '#475569', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' }

  return (
    <main style={S.main}>
      <div style={S.orb} aria-hidden />

      <div style={S.layout}>

        {/* ── LEFT: player + info ── */}
        <div style={S.left}>

          {/* Breadcrumb */}
          <div style={S.breadcrumb}>
            <Link to="/videos" style={S.breadLink}>Library</Link>
            <span style={S.breadSep}>›</span>
            <span style={S.breadCurrent}>{video.title || 'Video'}</span>
          </div>

          {/* ── PLAYER ── */}
          <div
            ref={playerWrapRef}
            style={{ ...S.player, cursor: showControls ? 'default' : 'none' }}
            onMouseMove={onPlayerMouseMove}
            onMouseLeave={() => playing && setShowControls(false)}
          >
            <video
              ref={videoRef}
              style={S.video}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onClick={togglePlay}
              playsInline
            />

            {/* Big play button when paused */}
            {!playing && (
              <div style={S.bigPlayWrap} onClick={togglePlay}>
                <div style={S.bigPlayBtn}>▶</div>
              </div>
            )}

            {/* Controls */}
            <div style={{
              ...S.controlsWrap,
              opacity: showControls || !playing ? 1 : 0,
              pointerEvents: showControls || !playing ? 'all' : 'none',
            }}>
              <PlayerControls
                videoEl={videoRef.current}
                playing={playing}
                progress={progress}
                duration={duration}
                volume={volume}
                muted={muted}
                buffered={buffered}
                onTogglePlay={togglePlay}
                onSeek={() => {}}
                onVolume={setVolHandler}
                onMute={toggleMute}
                onFullscreen={toggleFullscreen}
                fullscreen={fullscreen}
              />
            </div>
          </div>

          {/* ── INFO PANEL ── */}
          <div style={S.infoPanel}>
            {/* Title row */}
            <div style={S.titleRow}>
              <div style={S.titleBlock}>
                <h1 style={S.videoTitle}>{video.title || 'Untitled'}</h1>
                <div style={S.metaRow}>
                  {video.createdAt && <span style={S.metaItem}>📅 {fmtDate(video.createdAt)}</span>}
                  {video.duration  && <span style={S.metaItem}>⏱ {fmtTime(video.duration)}</span>}
                  {video.size      && <span style={S.metaItem}>💾 {(video.size/1e6).toFixed(1)} MB</span>}
                  <span style={{ ...S.metaStatus, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                    {meta.label}
                  </span>
                </div>
              </div>
              <button style={{ ...S.shareBtn, background: copied ? 'rgba(16,185,129,0.15)' : undefined, borderColor: copied ? 'rgba(16,185,129,0.3)' : undefined, color: copied ? '#10B981' : undefined }}
                onClick={copyLink}>
                {copied ? '✓ Copied!' : '⎘ Share'}
              </button>
            </div>

            {/* Tabs */}
            <div style={S.tabs}>
              {['info', 'technical'].map(t => (
                <button
                  key={t}
                  style={{
                    ...S.tabBtn,
                    color: tab === t ? '#E2E8F0' : '#475569',
                    borderBottom: tab === t ? '2px solid #7C3AED' : '2px solid transparent',
                  }}
                  onClick={() => setTab(t)}
                >
                  {t === 'info' ? 'Description' : 'Technical'}
                </button>
              ))}
            </div>

            {tab === 'info' ? (
              video.description ? (
                <p style={S.descText}>{video.description}</p>
              ) : (
                <p style={S.descEmpty}>No description provided.</p>
              )
            ) : (
              <div style={S.techGrid}>
                {[
                  { label: 'Stream URL',    val: `${API}/stream/${id}`,       mono: true, accent: '#00E5FF' },
                  { label: 'Thumbnail URL', val: `${API}/thumbnail/${id}`,    mono: true, accent: '#7C3AED' },
                  { label: 'Video ID',      val: id,                          mono: true, accent: '#a78bfa' },
                  { label: 'Status',        val: video.status || 'unknown',   mono: false, accent: meta.color },
                ].map(row => (
                  <div key={row.label} style={S.techRow}>
                    <span style={S.techLabel}>{row.label}</span>
                    <code style={{ ...S.techVal, color: row.accent }}>{row.val}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR: related videos ── */}
        <aside style={S.sidebar}>
          <div style={S.sidebarHeader}>
            <h2 style={S.sidebarTitle}>Up next</h2>
            <span style={S.sidebarCount}>{related.length} videos</span>
          </div>

          {related.length === 0 ? (
            <div style={S.sidebarEmpty}>
              <span style={{ fontSize: 28 }}>📭</span>
              <p style={{ color: '#475569', fontSize: 13, marginTop: 8 }}>No other videos yet</p>
            </div>
          ) : (
            <div style={S.relList}>
              {related.map(v => <RelatedCard key={v._id} video={v} current={id} />)}
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}

/* ─── Styles ─────────────────────────────────────────────────── */
const S = {
  main: { minHeight: '100vh', paddingTop: 64, background: '#0B0F1A', position: 'relative', overflow: 'hidden' },
  orb: {
    position: 'fixed', width: 700, height: 700, borderRadius: '50%',
    background: 'radial-gradient(circle, #7C3AED 0%, transparent 65%)',
    opacity: 0.07, filter: 'blur(80px)',
    top: -300, right: -200, pointerEvents: 'none', zIndex: 0,
  },
  layout: {
    position: 'relative', zIndex: 1,
    maxWidth: 1400, margin: '0 auto',
    padding: '32px 28px 80px',
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: 28, alignItems: 'start',
  },
  left: { minWidth: 0 },

  /* Breadcrumb */
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  breadLink: { fontSize: 13, color: '#475569', textDecoration: 'none' },
  breadSep: { color: '#334155', fontSize: 14 },
  breadCurrent: { fontSize: 13, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 },

  /* Player */
  player: {
    position: 'relative',
    background: '#000',
    borderRadius: 20,
    overflow: 'hidden',
    aspectRatio: '16/9',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.15)',
  },
  video: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
  bigPlayWrap: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.3)',
    cursor: 'pointer',
  },
  bigPlayBtn: {
    width: 68, height: 68, borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(109,40,217,0.9))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, color: '#fff',
    boxShadow: '0 8px 40px rgba(124,58,237,0.5)',
    backdropFilter: 'blur(8px)',
  },
  controlsWrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
    padding: '48px 16px 16px',
    transition: 'opacity 0.25s',
  },

  /* Controls */
  controls: { display: 'flex', flexDirection: 'column', gap: 10 },
  scrubTrack: {
    position: 'relative',
    height: 20,
    display: 'flex', alignItems: 'center',
    cursor: 'pointer',
  },
  scrubBuffered: {
    position: 'absolute',
    height: 3, borderRadius: 2,
    background: 'rgba(255,255,255,0.15)',
    top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none',
    left: 0,
    transition: 'width 0.5s',
  },
  scrubFill: {
    position: 'absolute',
    height: 3, borderRadius: 2,
    background: 'linear-gradient(90deg, #7C3AED, #00E5FF)',
    top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none', left: 0,
    transition: 'width 0.1s',
    boxShadow: '0 0 8px rgba(124,58,237,0.5)',
  },
  scrubThumb: {
    position: 'absolute',
    width: 14, height: 14, borderRadius: '50%',
    background: '#fff',
    top: '50%', transform: 'translateX(-50%) translateY(-50%)',
    transition: 'opacity 0.2s, transform 0.15s',
    pointerEvents: 'none',
    boxShadow: '0 0 0 3px rgba(124,58,237,0.4)',
  },
  scrubTooltip: {
    position: 'absolute',
    bottom: 16,
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.8)',
    color: '#E2E8F0', fontSize: 10, fontWeight: 600,
    padding: '3px 7px', borderRadius: 4,
    pointerEvents: 'none',
    fontFamily: 'var(--font-mono)',
  },
  ctrlRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  ctrlLeft: { display: 'flex', alignItems: 'center', gap: 4 },
  ctrlRight: { display: 'flex', alignItems: 'center', gap: 4 },
  volGroup: { display: 'flex', alignItems: 'center', gap: 4 },
  ctrlBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', cursor: 'pointer',
    width: 34, height: 34, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  ctrlBtnIcon: { fontSize: 14, lineHeight: 1 },
  volSlider: { width: 72, accentColor: '#7C3AED', cursor: 'pointer', height: 3 },
  timeDisplay: {
    color: 'rgba(255,255,255,0.7)', fontSize: 12,
    fontFamily: 'var(--font-mono)', letterSpacing: '0.03em',
    marginLeft: 8,
  },

  /* Info panel */
  infoPanel: {
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18, padding: '24px',
    marginTop: 16,
  },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  titleBlock: { flex: 1, minWidth: 0 },
  videoTitle: { fontSize: 20, fontWeight: 700, color: '#E2E8F0', letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.3 },
  metaRow: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  metaItem: { fontSize: 12, color: '#475569' },
  metaStatus: { fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', padding: '4px 8px', borderRadius: 6, border: '1px solid' },
  shareBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#64748B', fontSize: 12, fontWeight: 600,
    padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
    whiteSpace: 'nowrap', transition: 'all 0.2s',
    flexShrink: 0,
  },
  tabs: { display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 18 },
  tabBtn: {
    background: 'none', border: 'none',
    fontSize: 13, fontWeight: 600,
    padding: '8px 16px 10px', cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
    letterSpacing: '0.02em',
  },
  descText: { fontSize: 14, color: '#64748B', lineHeight: 1.75, borderLeft: '3px solid rgba(124,58,237,0.4)', paddingLeft: 16 },
  descEmpty: { fontSize: 14, color: '#334155', fontStyle: 'italic' },

  techGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  techRow: {
    display: 'grid', gridTemplateColumns: '120px 1fr',
    gap: 12, alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  techLabel: { fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase' },
  techVal: {
    fontSize: 11, fontFamily: 'var(--font-mono)',
    background: 'rgba(255,255,255,0.03)',
    padding: '6px 10px', borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.06)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    display: 'block',
  },

  /* Sidebar */
  sidebar: {
    position: 'sticky', top: 88,
    maxHeight: 'calc(100vh - 110px)',
    overflowY: 'auto',
  },
  sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sidebarTitle: { fontSize: 14, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.02em' },
  sidebarCount: { fontSize: 11, color: '#334155', fontFamily: 'var(--font-mono)' },
  sidebarEmpty: { textAlign: 'center', padding: '40px 0' },
  relList: { display: 'flex', flexDirection: 'column', gap: 8 },
  relCard: {
    display: 'flex', gap: 10,
    border: '1px solid',
    borderRadius: 12, padding: '10px',
    textDecoration: 'none',
    transition: 'background 0.15s, border-color 0.15s',
  },
  relThumb: {
    position: 'relative',
    width: 110, flexShrink: 0,
    aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden',
    background: '#0d1117',
  },
  relThumbImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  relThumbFb: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 },
  relPlayOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.55)',
    color: '#fff', fontSize: 16,
  },
  relMeta: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 },
  relTitle: {
    fontSize: 12, fontWeight: 600, color: '#94A3B8', lineHeight: 1.4,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  relSub: { fontSize: 10, color: '#334155', textTransform: 'capitalize' },

  /* Utility screens */
  centerScreen: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#0B0F1A', paddingTop: 64,
  },
  loadSpinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid rgba(124,58,237,0.2)',
    borderTopColor: '#7C3AED',
    animation: 'spin 0.8s linear infinite',
  },
  backBtn: {
    background: 'linear-gradient(135deg, #7C3AED, #6d28d9)',
    color: '#fff', fontSize: 14, fontWeight: 600,
    padding: '12px 24px', borderRadius: 12,
    textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
    display: 'inline-block',
  },
}