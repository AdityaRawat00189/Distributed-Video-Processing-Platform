import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Home',    to: '/',        icon: '⬡' },
  { label: 'Library', to: '/videos',  icon: '▦' },
  { label: 'Upload',  to: '/upload',  icon: '↑' },
]

export default function Navbar() {
  const { pathname }        = useLocation()
  const [open, setOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hov, setHov]       = useState(null)
  const mobileRef           = useRef()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close mobile menu on route change
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      <nav style={{
        ...S.nav,
        background: scrolled
          ? 'rgba(11,15,26,0.92)'
          : 'rgba(11,15,26,0.6)',
        borderBottomColor: scrolled
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.04)',
        boxShadow: scrolled
          ? '0 4px 32px rgba(0,0,0,0.4)'
          : 'none',
      }}>
        <div style={S.inner}>

          {/* ── Logo ── */}
          <Link to="/" style={S.logo}>
            <div style={S.logoMark}>
              <span style={S.logoHex}>⬡</span>
              <div style={S.logoPulse} />
            </div>
            <div style={S.logoText}>
              <span style={S.logoVid}>VID</span>
              <span style={S.logoEx}>EX</span>
            </div>
            <div style={S.logoBadge}>BETA</div>
          </Link>

          {/* ── Desktop nav ── */}
          <div style={S.links}>
            {NAV_LINKS.map(l => {
              const active = pathname === l.to
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  style={{
                    ...S.link,
                    color: active ? '#E2E8F0' : hov === l.to ? '#cbd5e1' : '#64748B',
                  }}
                  onMouseEnter={() => setHov(l.to)}
                  onMouseLeave={() => setHov(null)}
                >
                  <span style={{
                    ...S.linkIcon,
                    color: active ? '#7C3AED' : hov === l.to ? '#a78bfa' : '#334155',
                  }}>
                    {l.icon}
                  </span>
                  {l.label}
                  {active && <div style={S.linkActiveDot} />}
                </Link>
              )
            })}
          </div>

          {/* ── Right side ── */}
          <div style={S.right}>
            {/* Status pill */}
            <div style={S.statusPill}>
              <span style={S.statusDot} />
              <span style={S.statusText}>Workers live</span>
            </div>

            {/* Upload CTA */}
            <Link to="/upload" style={S.uploadBtn}>
              <span style={S.uploadIcon}>↑</span>
              <span>Upload</span>
            </Link>

            {/* Hamburger */}
            <button
              style={S.hamburger}
              onClick={() => setOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <div style={{
                ...S.hamLine,
                transform: open ? 'rotate(45deg) translate(4px, 5px)' : 'none',
              }} />
              <div style={{
                ...S.hamLine,
                opacity: open ? 0 : 1,
                transform: open ? 'scaleX(0)' : 'none',
              }} />
              <div style={{
                ...S.hamLine,
                transform: open ? 'rotate(-45deg) translate(4px, -5px)' : 'none',
              }} />
            </button>
          </div>
        </div>

        {/* ── Progress line (decorative) ── */}
        <div style={S.progressLine}>
          <div style={{
            ...S.progressFill,
            width: pathname === '/' ? '15%'
              : pathname === '/videos' ? '50%'
              : pathname === '/upload' ? '80%'
              : '100%',
          }} />
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      <div style={{
        ...S.drawer,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        opacity: open ? 1 : 0,
      }}>
        <div style={S.drawerHead}>
          <div style={S.drawerLogo}>
            <span style={{ color: '#7C3AED', fontSize: 20 }}>⬡</span>
            <span style={{ color: '#E2E8F0', fontWeight: 700, fontSize: 16 }}>VID<span style={{ color: '#7C3AED' }}>EX</span></span>
          </div>
          <button style={S.drawerClose} onClick={() => setOpen(false)}>✕</button>
        </div>

        <div style={S.drawerLinks}>
          {NAV_LINKS.map(l => {
            const active = pathname === l.to
            return (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  ...S.drawerLink,
                  background: active ? 'rgba(124,58,237,0.12)' : 'transparent',
                  borderColor: active ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)',
                  color: active ? '#E2E8F0' : '#64748B',
                }}
              >
                <span style={{ color: active ? '#7C3AED' : '#334155', fontSize: 18 }}>{l.icon}</span>
                {l.label}
                {active && <span style={{ marginLeft: 'auto', color: '#7C3AED', fontSize: 12 }}>●</span>}
              </Link>
            )
          })}
        </div>

        <div style={S.drawerFooter}>
          <Link to="/upload" style={S.drawerCta}>
            <span>↑</span> Upload a video
          </Link>
          <div style={S.drawerStatus}>
            <span style={S.statusDot} />
            <span style={{ fontSize: 12, color: '#475569' }}>RabbitMQ workers connected</span>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          style={S.overlay}
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}

const S = {
  nav: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 200,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid',
    transition: 'background 0.3s, box-shadow 0.3s, border-color 0.3s',
  },
  inner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 28px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    gap: 40,
  },

  /* Logo */
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    textDecoration: 'none', marginRight: 'auto', flexShrink: 0,
  },
  logoMark: { position: 'relative', width: 32, height: 32 },
  logoHex: {
    fontSize: 28, color: '#7C3AED',
    lineHeight: 1,
    filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.6))',
  },
  logoPulse: {
    position: 'absolute', inset: -4,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
    animation: 'orbPulse 3s ease-in-out infinite',
  },
  logoText: { display: 'flex', alignItems: 'baseline', gap: 0 },
  logoVid: { fontSize: 17, fontWeight: 700, color: '#E2E8F0', letterSpacing: '-0.01em' },
  logoEx: { fontSize: 17, fontWeight: 700, color: '#7C3AED', letterSpacing: '-0.01em' },
  logoBadge: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
    color: '#475569',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '2px 6px', borderRadius: 4,
    marginLeft: 6, marginBottom: 2,
    alignSelf: 'flex-end',
  },

  /* Desktop links */
  links: { display: 'flex', gap: 4, alignItems: 'center' },
  link: {
    position: 'relative',
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 500,
    padding: '6px 12px', borderRadius: 8,
    textDecoration: 'none',
    transition: 'color 0.15s',
    letterSpacing: '0.01em',
  },
  linkIcon: { fontSize: 12, transition: 'color 0.15s' },
  linkActiveDot: {
    position: 'absolute',
    bottom: -1, left: '50%',
    transform: 'translateX(-50%)',
    width: 4, height: 4, borderRadius: '50%',
    background: '#7C3AED',
    boxShadow: '0 0 6px #7C3AED',
  },

  /* Right side */
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  statusPill: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(16,185,129,0.08)',
    border: '1px solid rgba(16,185,129,0.2)',
    padding: '5px 10px', borderRadius: 20,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#10B981',
    boxShadow: '0 0 6px #10B981',
    flexShrink: 0,
    animation: 'glow 2s ease-in-out infinite alternate',
  },
  statusText: { fontSize: 11, fontWeight: 600, color: '#10B981', letterSpacing: '0.03em' },

  uploadBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'linear-gradient(135deg, #7C3AED, #6d28d9)',
    color: '#fff',
    fontSize: 13, fontWeight: 600,
    padding: '8px 16px', borderRadius: 10,
    textDecoration: 'none',
    boxShadow: '0 2px 16px rgba(124,58,237,0.3)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    letterSpacing: '0.01em',
  },
  uploadIcon: { fontSize: 14 },

  hamburger: {
    display: 'none',
    flexDirection: 'column', gap: 5,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: '8px 10px',
    cursor: 'pointer',
    width: 40, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  hamLine: {
    width: 18, height: 1.5,
    background: '#94A3B8', borderRadius: 2,
    transition: 'transform 0.2s, opacity 0.2s',
  },

  /* Progress line */
  progressLine: {
    height: 2,
    background: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #7C3AED, #00E5FF)',
    transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: '0 0 8px rgba(124,58,237,0.6)',
  },

  /* Mobile drawer */
  drawer: {
    position: 'fixed',
    top: 0, right: 0, bottom: 0,
    width: 300,
    zIndex: 300,
    background: '#0d1117',
    borderLeft: '1px solid rgba(255,255,255,0.07)',
    display: 'flex', flexDirection: 'column',
    transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
    backdropFilter: 'blur(20px)',
  },
  drawerHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  drawerLogo: { display: 'flex', alignItems: 'center', gap: 8 },
  drawerClose: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#94A3B8',
    fontSize: 14, cursor: 'pointer',
    width: 32, height: 32, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  drawerLinks: { display: 'flex', flexDirection: 'column', gap: 6, padding: '24px 16px' },
  drawerLink: {
    display: 'flex', alignItems: 'center', gap: 12,
    fontSize: 14, fontWeight: 500,
    padding: '12px 16px', borderRadius: 10,
    textDecoration: 'none',
    border: '1px solid',
    transition: 'all 0.15s',
  },
  drawerFooter: {
    marginTop: 'auto',
    padding: '24px 16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  drawerCta: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'linear-gradient(135deg, #7C3AED, #6d28d9)',
    color: '#fff', fontSize: 14, fontWeight: 600,
    padding: '13px', borderRadius: 12,
    textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
  },
  drawerStatus: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 250,
    backdropFilter: 'blur(4px)',
  },
}

