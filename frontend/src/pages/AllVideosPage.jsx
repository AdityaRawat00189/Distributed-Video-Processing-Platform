import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'

const API = 'http://localhost:5000/api/upload'

const FILTERS = [
  { key: 'all',        label: 'All',        color: '#7C3AED' },
  { key: 'completed',  label: 'Ready',      color: '#10B981' },
  { key: 'processing', label: 'Processing', color: '#F59E0B' },
  { key: 'failed',     label: 'Failed',     color: '#EF4444' },
]

const SORTS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'name',   label: 'Name A–Z' },
]

const STATUS_META = {
  completed:  { label: 'Ready',      color: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)' },
  processing: { label: 'Processing', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  failed:     { label: 'Failed',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)'  },
}

/* ─── Skeleton card ─────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={S.skeletonCard}>
      <div style={S.skeletonThumb} />
      <div style={S.skeletonBody}>
        <div style={{ ...S.skeletonLine, width: '75%', marginBottom: 10 }} />
        <div style={{ ...S.skeletonLine, width: '50%', height: 12 }} />
      </div>
    </div>
  )
}

/* ─── Video card ─────────────────────────────────────────────── */
function VideoCard({ video, view }) {
  const [imgErr, setImgErr] = useState(false)
  const [hov, setHov]       = useState(false)
  const thumbUrl  = `${API}/thumbnail/${video._id}`
  const meta      = STATUS_META[video.status] || { label: video.status || 'Unknown', color: '#475569', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  const fmtSize = (b) => {
    if (!b) return ''
    return b > 1e9 ? `${(b/1e9).toFixed(1)}GB` : b > 1e6 ? `${(b/1e6).toFixed(1)}MB` : `${(b/1e3).toFixed(0)}KB`
  }
  const fmtDur = (s) => {
    if (!s) return ''
    return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`
  }

  if (view === 'list') {
    return (
      <Link to={`/play/${video._id}`} style={{
        ...S.listCard,
        background: hov ? 'rgba(255,255,255,0.04)' : '#111827',
        borderColor: hov ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)',
      }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        <div style={S.listThumb}>
          {imgErr ? (
            <div style={S.listThumbFb}>🎬</div>
          ) : (
            <img src={thumbUrl} alt={video.title} style={S.listThumbImg} onError={() => setImgErr(true)} />
          )}
          {hov && <div style={S.listPlayOverlay}>▶</div>}
        </div>
        <div style={S.listMeta}>
          <p style={S.listTitle}>{video.title || 'Untitled'}</p>
          {video.description && <p style={S.listDesc}>{video.description}</p>}
        </div>
        <div style={S.listRight}>
          <span style={{ ...S.statusBadge, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
            {meta.label}
          </span>
          <span style={S.listDate}>{fmtDate(video.createdAt)}</span>
          {video.size && <span style={S.listSize}>{fmtSize(video.size)}</span>}
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/play/${video._id}`}
      style={{
        ...S.gridCard,
        borderColor: hov ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.15)' : '0 2px 12px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Thumbnail */}
      <div style={S.gridThumb}>
        {imgErr ? (
          <div style={S.gridThumbFb}>
            <span style={{ fontSize: 36 }}>🎬</span>
          </div>
        ) : (
          <img src={thumbUrl} alt={video.title} style={S.gridThumbImg} onError={() => setImgErr(true)} />
        )}

        {/* Overlay */}
        <div style={{ ...S.gridOverlay, opacity: hov ? 1 : 0 }}>
          <div style={S.gridPlayBtn}>▶</div>
        </div>

        {/* Status */}
        <div style={{ ...S.statusBadge, ...S.gridStatusBadge, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
          {video.status === 'processing' && <span style={S.blinkDot} />}
          {meta.label}
        </div>

        {/* Duration */}
        {video.duration && (
          <div style={S.durationBadge}>{fmtDur(video.duration)}</div>
        )}
      </div>

      {/* Body */}
      <div style={S.gridBody}>
        <h3 style={S.gridTitle}>{video.title || 'Untitled'}</h3>
        {video.description && <p style={S.gridDesc}>{video.description}</p>}
        <div style={S.gridFooter}>
          {video.createdAt && <span style={S.gridDate}>{fmtDate(video.createdAt)}</span>}
          {video.size && <span style={S.gridSize}>{fmtSize(video.size)}</span>}
        </div>
      </div>

      {/* Bottom accent */}
      <div style={{
        ...S.gridAccent,
        opacity: hov ? 1 : 0,
        background: `linear-gradient(90deg, ${meta.color}, transparent)`,
      }} />
    </Link>
  )
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function AllVideosPage() {
  const [videos, setVideos]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [sort, setSort]       = useState('newest')
  const [view, setView]       = useState('grid')
  const searchRef             = useRef()

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/all`)
      .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json() })
      .then(data => { setVideos(Array.isArray(data) ? data : data.videos || data.data || []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const counts = {
    all: videos.length,
    completed: videos.filter(v => v.status === 'completed').length,
    processing: videos.filter(v => v.status === 'processing').length,
    failed: videos.filter(v => v.status === 'failed').length,
  }

  const sorted = [...videos].sort((a, b) => {
    if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
    if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
    if (sort === 'name')   return (a.title || '').localeCompare(b.title || '')
    return 0
  })

  const filtered = sorted.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q || (v.title || '').toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q)
    const matchFilter = filter === 'all' || v.status === filter
    return matchSearch && matchFilter
  })

  return (
    <main style={S.main}>
      <div style={S.orb} aria-hidden />

      <div style={S.page}>

        {/* ── PAGE HEADER ── */}
        <div style={S.pageHeader}>
          <div>
            <p style={S.pageEye}>Library</p>
            <h1 style={S.pageTitle}>Video library</h1>
            <p style={S.pageSub}>
              {loading ? 'Loading…' : `${videos.length} video${videos.length !== 1 ? 's' : ''} in the pipeline`}
            </p>
          </div>
          <Link to="/upload" style={S.headerUploadBtn}>
            <span>↑</span> Upload
          </Link>
        </div>

        {/* ── CONTROLS BAR ── */}
        <div style={S.controlsBar}>
          {/* Search */}
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>⌕</span>
            <input
              ref={searchRef}
              style={S.searchInput}
              placeholder="Search videos…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button style={S.searchClear} onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {/* Filters */}
          <div style={S.filterRow}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                style={{
                  ...S.filterBtn,
                  background: filter === f.key ? `${f.color}18` : 'rgba(255,255,255,0.03)',
                  borderColor: filter === f.key ? `${f.color}50` : 'rgba(255,255,255,0.07)',
                  color: filter === f.key ? f.color : '#475569',
                }}
                onClick={() => setFilter(f.key)}
              >
                {filter === f.key && <span style={{ ...S.filterDot, background: f.color }} />}
                {f.label}
                <span style={{
                  ...S.filterCount,
                  background: filter === f.key ? `${f.color}25` : 'rgba(255,255,255,0.06)',
                  color: filter === f.key ? f.color : '#334155',
                }}>
                  {counts[f.key] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div style={S.rightControls}>
            {/* Sort */}
            <select
              style={S.sortSelect}
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>

            {/* View toggle */}
            <div style={S.viewToggle}>
              <button
                style={{ ...S.viewBtn, background: view === 'grid' ? 'rgba(124,58,237,0.2)' : 'transparent', color: view === 'grid' ? '#a78bfa' : '#334155' }}
                onClick={() => setView('grid')}
                title="Grid view"
              >
                ▦
              </button>
              <button
                style={{ ...S.viewBtn, background: view === 'list' ? 'rgba(124,58,237,0.2)' : 'transparent', color: view === 'list' ? '#a78bfa' : '#334155' }}
                onClick={() => setView('list')}
                title="List view"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div style={view === 'grid' ? S.grid : S.listWrap}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <ErrorState msg={error} />
        ) : filtered.length === 0 ? (
          <EmptyState search={search} filter={filter} />
        ) : (
          <>
            <div style={S.resultBar}>
              <span style={S.resultCount}>
                Showing <strong style={{ color: '#E2E8F0' }}>{filtered.length}</strong> of {videos.length} videos
                {search && <span> · matching <em style={{ color: '#7C3AED' }}>"{search}"</em></span>}
              </span>
              {(search || filter !== 'all') && (
                <button style={S.clearFilters} onClick={() => { setSearch(''); setFilter('all') }}>
                  Clear filters
                </button>
              )}
            </div>
            {view === 'grid' ? (
              <div style={S.grid}>
                {filtered.map(v => <VideoCard key={v._id} video={v} view="grid" />)}
              </div>
            ) : (
              <div style={S.listWrap}>
                {filtered.map(v => <VideoCard key={v._id} video={v} view="list" />)}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function ErrorState({ msg }) {
  return (
    <div style={S.emptyWrap}>
      <div style={S.emptyIconWrap}>
        <span style={{ fontSize: 36 }}>⚠</span>
      </div>
      <h3 style={S.emptyTitle}>Could not load videos</h3>
      <p style={S.emptySub}>{msg}</p>
      <code style={S.emptyCode}>GET localhost:5000/api/upload/all</code>
    </div>
  )
}

function EmptyState({ search, filter }) {
  return (
    <div style={S.emptyWrap}>
      <div style={S.emptyIconWrap}>
        <span style={{ fontSize: 36 }}>{search ? '⌕' : '▦'}</span>
      </div>
      <h3 style={S.emptyTitle}>
        {search ? 'No results found' : filter !== 'all' ? `No ${filter} videos` : 'Library is empty'}
      </h3>
      <p style={S.emptySub}>
        {search ? `Nothing matched "${search}".` : 'Upload your first video to get started.'}
      </p>
      {!search && (
        <Link to="/upload" style={S.emptyBtn}>↑ Upload a video</Link>
      )}
    </div>
  )
}

/* ─── Styles ─────────────────────────────────────────────────── */
const S = {
  main: { minHeight: '100vh', paddingTop: 64, background: '#0B0F1A', position: 'relative', overflow: 'hidden' },
  orb: {
    position: 'fixed', width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, #00E5FF 0%, transparent 65%)',
    opacity: 0.05, filter: 'blur(80px)',
    bottom: -200, left: -150, pointerEvents: 'none', zIndex: 0,
  },
  page: { maxWidth: 1280, margin: '0 auto', padding: '48px 32px 80px', position: 'relative', zIndex: 1 },

  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap', gap: 16 },
  pageEye: { fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7C3AED', marginBottom: 8 },
  pageTitle: { fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.025em', color: '#E2E8F0', marginBottom: 6 },
  pageSub: { fontSize: 14, color: '#475569' },
  headerUploadBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'linear-gradient(135deg, #7C3AED, #6d28d9)',
    color: '#fff', fontSize: 14, fontWeight: 600,
    padding: '11px 20px', borderRadius: 12,
    textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
  },

  controlsBar: {
    display: 'flex', gap: 12, alignItems: 'center',
    marginBottom: 28, flexWrap: 'wrap',
  },
  searchWrap: {
    position: 'relative',
    flex: '1 1 240px', minWidth: 200,
  },
  searchIcon: {
    position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
    fontSize: 18, color: '#334155', pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '11px 40px 11px 40px',
    fontSize: 14, color: '#E2E8F0',
    fontFamily: 'var(--font-ui)', outline: 'none',
    transition: 'border-color 0.2s',
  },
  searchClear: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#334155',
    cursor: 'pointer', fontSize: 12, padding: 4,
  },

  filterRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 600,
    padding: '8px 12px', borderRadius: 10, border: '1px solid',
    cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.02em',
  },
  filterDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  filterCount: {
    fontSize: 10, fontWeight: 700,
    padding: '2px 6px', borderRadius: 6, lineHeight: 1.4,
  },

  rightControls: { display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' },
  sortSelect: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '9px 12px',
    fontSize: 12, color: '#64748B',
    fontFamily: 'var(--font-ui)', outline: 'none', cursor: 'pointer',
  },
  viewToggle: {
    display: 'flex',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, overflow: 'hidden',
  },
  viewBtn: {
    background: 'none', border: 'none',
    padding: '8px 12px', cursor: 'pointer', fontSize: 16,
    transition: 'background 0.15s, color 0.15s',
  },

  resultBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  resultCount: { fontSize: 13, color: '#475569' },
  clearFilters: {
    background: 'none', border: 'none',
    color: '#7C3AED', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },

  /* Grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 18,
  },
  gridCard: {
    position: 'relative',
    background: '#111827',
    border: '1px solid',
    borderRadius: 18,
    overflow: 'hidden',
    display: 'block',
    textDecoration: 'none',
    transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
  },
  gridThumb: {
    position: 'relative',
    aspectRatio: '16/9',
    overflow: 'hidden',
    background: '#0d1117',
  },
  gridThumbImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' },
  gridThumbFb: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)',
  },
  gridOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.2s',
  },
  gridPlayBtn: {
    width: 52, height: 52, borderRadius: '50%',
    background: 'linear-gradient(135deg, #7C3AED, #6d28d9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, color: '#fff',
    boxShadow: '0 4px 24px rgba(124,58,237,0.5)',
  },
  gridStatusBadge: {
    position: 'absolute', top: 10, left: 10,
    backdropFilter: 'blur(6px)',
  },
  durationBadge: {
    position: 'absolute', bottom: 10, right: 10,
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
    color: '#E2E8F0', fontSize: 11, fontWeight: 600,
    padding: '3px 7px', borderRadius: 6,
    fontFamily: 'var(--font-mono)',
  },
  gridBody: { padding: '14px 16px 16px' },
  gridTitle: {
    fontSize: 14, fontWeight: 600, color: '#E2E8F0',
    lineHeight: 1.35, marginBottom: 6,
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  gridDesc: {
    fontSize: 12, color: '#475569', lineHeight: 1.55,
    marginBottom: 12,
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  gridFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  gridDate: { fontSize: 11, color: '#334155' },
  gridSize: { fontSize: 11, color: '#334155', fontFamily: 'var(--font-mono)' },
  gridAccent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2, transition: 'opacity 0.2s',
  },

  /* List */
  listWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
  listCard: {
    display: 'flex', alignItems: 'center', gap: 16,
    border: '1px solid',
    borderRadius: 14, padding: '12px 16px',
    textDecoration: 'none',
    transition: 'background 0.15s, border-color 0.15s',
  },
  listThumb: {
    position: 'relative',
    width: 120, flexShrink: 0,
    aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden',
    background: '#0d1117',
  },
  listThumbImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  listThumbFb: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 },
  listPlayOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff', fontSize: 18,
  },
  listMeta: { flex: 1, minWidth: 0 },
  listTitle: { fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  listDesc: { fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  listRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  listDate: { fontSize: 11, color: '#334155' },
  listSize: { fontSize: 11, color: '#334155', fontFamily: 'var(--font-mono)' },

  /* Shared */
  statusBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
    padding: '4px 8px', borderRadius: 6,
  },
  blinkDot: {
    width: 5, height: 5, borderRadius: '50%',
    background: 'currentColor', display: 'inline-block',
    animation: 'glow 1s ease-in-out infinite alternate',
  },

  /* Skeletons */
  skeletonCard: {
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 18, overflow: 'hidden',
  },
  skeletonThumb: {
    aspectRatio: '16/9',
    background: 'linear-gradient(90deg, #1a2235 25%, #1f2d44 50%, #1a2235 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
  skeletonBody: { padding: '14px 16px 18px' },
  skeletonLine: {
    height: 14, background: '#1a2235', borderRadius: 6,
    animation: 'shimmer 1.5s infinite',
  },

  /* Empty/Error */
  emptyWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', textAlign: 'center',
    padding: '80px 24px', gap: 14,
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: '50%',
    background: 'rgba(124,58,237,0.08)',
    border: '1px solid rgba(124,58,237,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: '#E2E8F0' },
  emptySub: { fontSize: 14, color: '#475569', maxWidth: 360 },
  emptyCode: {
    fontSize: 12, color: '#00E5FF',
    background: 'rgba(0,229,255,0.06)',
    border: '1px solid rgba(0,229,255,0.15)',
    padding: '8px 16px', borderRadius: 8,
    fontFamily: 'var(--font-mono)',
  },
  emptyBtn: {
    marginTop: 8,
    background: 'linear-gradient(135deg, #7C3AED, #6d28d9)',
    color: '#fff', fontSize: 14, fontWeight: 600,
    padding: '12px 24px', borderRadius: 12, textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
    display: 'inline-block',
  },
}