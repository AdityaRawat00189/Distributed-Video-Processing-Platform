import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000/api/upload'

const FORMATS = ['MP4', 'MOV', 'AVI', 'MKV', 'WebM', 'HEVC']

/* Pipeline steps shown during upload */
const PIPELINE_STEPS = [
  { id: 'upload',    label: 'Uploading file',         icon: '↑' },
  { id: 'enqueue',   label: 'Enqueuing to RabbitMQ',  icon: '⇄' },
  { id: 'transcode', label: 'FFmpeg workers pick up',  icon: '⚙' },
  { id: 'store',     label: 'Storing to MinIO',        icon: '◈' },
]

export default function UploadPage() {
  const [file, setFile]           = useState(null)
  const [preview, setPreview]     = useState(null)
  const [title, setTitle]         = useState('')
  const [desc, setDesc]           = useState('')
  const [dragging, setDragging]   = useState(false)
  const [progress, setProgress]   = useState(0)
  const [status, setStatus]       = useState('idle')
  const [errMsg, setErrMsg]       = useState('')
  const [uploadedId, setUploadedId] = useState(null)
  const [focusField, setFocusField] = useState(null)
  const fileRef  = useRef()
  const navigate = useNavigate()

  const pickFile = (f) => {
    if (!f || !f.type.startsWith('video/')) {
      setErrMsg('Please select a valid video file.')
      return
    }
    setFile(f)
    setErrMsg('')
    setPreview(URL.createObjectURL(f))
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    pickFile(e.dataTransfer.files[0])
  }, [])

  const handleSubmit = async () => {
    if (!file)         return setErrMsg('Please select a video file.')
    if (!title.trim()) return setErrMsg('Title is required.')
    
    setStatus('uploading')
    setErrMsg('')
    setProgress(0) 

    const form = new FormData()
    form.append('video', file)
    form.append('title', title.trim())
    form.append('description', desc.trim())

    try {
      const response = await fetch(`${API}/upload`, {
        method: 'POST',
        body: form,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText || response.status}`)
      }

      try {
        const r = await response.json()
        setUploadedId(r._id || r.id || r.data?._id)
      } catch (err) {
        setErrMsg(err.message);
      }

      setStatus('success')
      setProgress(100) 

    } catch (error) {
      setStatus('error')
      if (error.message === 'Failed to fetch') {
        setErrMsg('Network error. Is the server running on port 5000?')
      } else {
        setErrMsg(error.message)
      }
    }
  }

  const reset = () => {
    setFile(null); setPreview(null); setTitle(''); setDesc('')
    setProgress(0); setStatus('idle'); setErrMsg(''); setUploadedId(null)
  }

  const activeStep = progress < 100 ? 0 : progress === 100 && status === 'uploading' ? 1 : -1

  return (
    <main style={S.main}>
      {/* Background orbs */}
      <div style={S.orb1} aria-hidden />
      <div style={S.orb2} aria-hidden />

      <div style={S.page}>

        {/* ── LEFT PANEL ── */}
        <div style={S.leftPanel}>
          <div style={S.sectionEye}>Upload</div>
          <h1 style={S.heading}>
            Add to the<br />
            <span style={S.headingGrad}>pipeline.</span>
          </h1>
          <p style={S.headingSub}>
            Your video enters the RabbitMQ exchange the moment it lands —
            no waiting, no manual steps.
          </p>

          {/* Pipeline preview */}
          <div style={S.pipeCard}>
            <p style={S.pipeCardTitle}>What happens next</p>
            {PIPELINE_STEPS.map((step, i) => {
              const done    = status === 'success'
              const active  = status === 'uploading' && i === activeStep
              const queued  = status !== 'success' && i > activeStep
              return (
                <div key={step.id} style={S.pipeStep}>
                  <div style={{
                    ...S.pipeStepIcon,
                    background: done || (status === 'uploading' && i < activeStep)
                      ? 'rgba(16,185,129,0.15)'
                      : active ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                    borderColor: done || (status === 'uploading' && i < activeStep)
                      ? 'rgba(16,185,129,0.4)'
                      : active ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)',
                    color: done || (status === 'uploading' && i < activeStep)
                      ? '#10B981' : active ? '#a78bfa' : '#334155',
                  }}>
                    {step.icon}
                  </div>
                  <div style={S.pipeStepBody}>
                    <span style={{
                      ...S.pipeStepLabel,
                      color: done ? '#10B981' : active ? '#E2E8F0' : '#475569',
                    }}>
                      {step.label}
                    </span>
                    {active && <span style={S.pipeStepLive}>live</span>}
                    {done && <span style={S.pipeStepDone}>✓</span>}
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div style={{
                      ...S.pipeConnector,
                      background: done ? '#10B981' : 'rgba(255,255,255,0.06)',
                    }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Format badges */}
          <div style={S.formats}>
            {FORMATS.map(f => (
              <span key={f} style={S.formatChip}>{f}</span>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={S.rightPanel}>
          {status === 'success' ? (
            <SuccessCard id={uploadedId} onAnother={reset} onPlay={() => uploadedId && navigate(`/play/${uploadedId}`)} />
          ) : (
            <div style={S.form}>

              {/* Drop zone */}
              <div
                style={{
                  ...S.dropzone,
                  borderColor: dragging
                    ? '#7C3AED'
                    : file ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.08)',
                  background: dragging
                    ? 'rgba(124,58,237,0.06)'
                    : file ? 'rgba(0,229,255,0.03)' : 'rgba(255,255,255,0.02)',
                  boxShadow: dragging ? '0 0 0 4px rgba(124,58,237,0.12), inset 0 0 32px rgba(124,58,237,0.04)' : 'none',
                }}
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onClick={() => !file && fileRef.current.click()}
              >
                <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }}
                  onChange={e => pickFile(e.target.files[0])} />

                {file ? (
                  <div style={S.fileLoaded}>
                    {preview && (
                      <div style={S.previewWrap}>
                        <video src={preview} style={S.videoPreview} muted playsInline controls />
                        <div style={S.previewOverlayBadge}>Preview</div>
                      </div>
                    )}
                    <div style={S.fileMeta}>
                      <div style={S.fileMetaLeft}>
                        <div style={S.fileIcon}>🎬</div>
                        <div>
                          <p style={S.fileName}>{file.name}</p>
                          <p style={S.fileDetail}>
                            <span style={S.fileSize}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                            <span style={S.fileDot}>·</span>
                            <span style={S.fileType}>{file.type.split('/')[1].toUpperCase()}</span>
                          </p>
                        </div>
                      </div>
                      <button style={S.changeBtn} onClick={e => { e.stopPropagation(); fileRef.current.click() }}>
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={S.dropPrompt}>
                    <div style={S.dropIconWrap}>
                      <span style={S.dropIconInner}>↑</span>
                    </div>
                    <p style={S.dropTitle}>Drop your video here</p>
                    <p style={S.dropSub}>
                      or <span style={{ color: '#7C3AED', cursor: 'pointer', fontWeight: 600 }}>browse files</span>
                    </p>
                    <p style={S.dropHint}>MP4 · MOV · MKV · WebM · AVI · HEVC</p>
                  </div>
                )}
              </div>

              {/* Fields */}
              <div style={S.fields}>
                <InputField
                  label="Title"
                  required
                  value={title}
                  onChange={setTitle}
                  placeholder="Give your video a descriptive name"
                  maxLength={120}
                  focused={focusField === 'title'}
                  onFocus={() => setFocusField('title')}
                  onBlur={() => setFocusField(null)}
                />
                <TextareaField
                  label="Description"
                  value={desc}
                  onChange={setDesc}
                  placeholder="What's this video about? Tags, context, use case… (optional)"
                  maxLength={1000}
                  focused={focusField === 'desc'}
                  onFocus={() => setFocusField('desc')}
                  onBlur={() => setFocusField(null)}
                />
              </div>

              {/* Error */}
              {errMsg && (
                <div style={S.errBanner}>
                  <span style={S.errIcon}>⚠</span>
                  <span>{errMsg}</span>
                </div>
              )}

              {/* Upload progress */}
              {status === 'uploading' && (
                <div style={S.progressCard}>
                  <div style={S.progressTop}>
                    <div style={S.progressInfo}>
                      <span style={S.progressLabel}>
                        {progress < 100 ? 'Transferring…' : 'Enqueuing to RabbitMQ…'}
                      </span>
                      <span style={S.progressFile}>{file?.name}</span>
                    </div>
                    <span style={S.progressPct}>{progress}%</span>
                  </div>
                  <div style={S.progressTrack}>
                    <div style={{ ...S.progressFill, width: `${progress}%` }}>
                      <div style={S.progressShimmer} />
                    </div>
                  </div>
                  <div style={S.progressSteps}>
                    {PIPELINE_STEPS.slice(0, 2).map((step, i) => (
                      <span key={step.id} style={{
                        ...S.progressStep,
                        color: i === 0 && progress < 100 ? '#7C3AED'
                          : i === 1 && progress === 100 ? '#7C3AED' : '#334155',
                      }}>
                        {step.icon} {step.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                style={{
                  ...S.submitBtn,
                  opacity: status === 'uploading' ? 0.7 : 1,
                  cursor: status === 'uploading' ? 'not-allowed' : 'pointer',
                }}
                onClick={handleSubmit}
                disabled={status === 'uploading'}
              >
                {status === 'uploading' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                    <span style={S.spinner} />
                    Uploading {progress}%…
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span>↑</span> Upload & Enqueue
                  </span>
                )}
              </button>
              <p style={S.submitHint}>
                Video is dispatched to a RabbitMQ exchange immediately on receipt.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

/* ─── Sub-components ─────────────────────────────────────────── */

function InputField({ label, required, value, onChange, placeholder, maxLength, focused, onFocus, onBlur }) {
  return (
    <div style={S.field}>
      <div style={S.fieldLabelRow}>
        <label style={S.fieldLabel}>
          {label}
          {required && <span style={{ color: '#7C3AED', marginLeft: 3 }}>*</span>}
        </label>
        <span style={S.charCount}>{value.length}/{maxLength}</span>
      </div>
      <input
        style={{
          ...S.input,
          borderColor: focused ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.07)',
          boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
        }}
        type="text"
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder, maxLength, focused, onFocus, onBlur }) {
  return (
    <div style={S.field}>
      <div style={S.fieldLabelRow}>
        <label style={S.fieldLabel}>{label}</label>
        <span style={S.charCount}>{value.length}/{maxLength}</span>
      </div>
      <textarea
        style={{
          ...S.textarea,
          borderColor: focused ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.07)',
          boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
        }}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        rows={4}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  )
}

function SuccessCard({ id, onAnother, onPlay }) {
  return (
    <div style={S.successCard}>
      <div style={S.successOrb} />
      <div style={S.successIconWrap}>
        <span style={S.successIcon}>✓</span>
      </div>
      <h2 style={S.successTitle}>Enqueued successfully</h2>
      <p style={S.successSub}>
        Your video has been dispatched to the RabbitMQ exchange.
        FFmpeg workers are picking it up now.
      </p>
      {id && (
        <div style={S.successJobId}>
          <span style={S.successJobLabel}>Job ID</span>
          <code style={S.successJobCode}>{id}</code>
        </div>
      )}
      <div style={S.successBtns}>
        {id && (
          <button style={S.successBtnPrimary} onClick={onPlay}>
            ▶ Play now
          </button>
        )}
        <button style={S.successBtnGhost} onClick={onAnother}>
          Upload another
        </button>
      </div>
    </div>
  )
}

/* ─── Styles ─────────────────────────────────────────────────── */
const S = {
  main: {
    minHeight: '100vh',
    paddingTop: 64,
    position: 'relative',
    overflow: 'hidden',
    background: '#0B0F1A',
  },
  orb1: {
    position: 'fixed', width: 700, height: 700, borderRadius: '50%',
    background: 'radial-gradient(circle, #7C3AED 0%, transparent 65%)',
    opacity: 0.08, filter: 'blur(60px)',
    top: -300, left: -200,
    pointerEvents: 'none', zIndex: 0,
  },
  orb2: {
    position: 'fixed', width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, #00E5FF 0%, transparent 65%)',
    opacity: 0.05, filter: 'blur(60px)',
    bottom: -200, right: -100,
    pointerEvents: 'none', zIndex: 0,
  },
  page: {
    position: 'relative', zIndex: 1,
    maxWidth: 1200, margin: '0 auto',
    padding: '56px 32px 80px',
    display: 'grid',
    gridTemplateColumns: '360px 1fr',
    gap: 64,
    alignItems: 'start',
  },

  /* Left panel */
  leftPanel: { position: 'sticky', top: 88 },
  sectionEye: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: '#7C3AED',
    marginBottom: 14,
  },
  heading: {
    fontSize: 'clamp(32px, 3.5vw, 48px)',
    fontWeight: 700, letterSpacing: '-0.03em',
    color: '#E2E8F0', lineHeight: 1.1,
    marginBottom: 16,
  },
  headingGrad: {
    background: 'linear-gradient(120deg, #7C3AED, #00E5FF)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  headingSub: { fontSize: 14, color: '#64748B', lineHeight: 1.7, marginBottom: 36 },

  pipeCard: {
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '20px',
    marginBottom: 24,
  },
  pipeCardTitle: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#334155', textTransform: 'uppercase', marginBottom: 16 },
  pipeStep: { position: 'relative', display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 20 },
  pipeStepIcon: {
    width: 32, height: 32, borderRadius: 8, border: '1px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 600, flexShrink: 0,
    transition: 'all 0.3s',
  },
  pipeStepBody: { display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
  pipeStepLabel: { fontSize: 13, fontWeight: 500, transition: 'color 0.3s' },
  pipeStepLive: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
    background: 'rgba(124,58,237,0.2)', color: '#a78bfa',
    border: '1px solid rgba(124,58,237,0.3)',
    padding: '2px 6px', borderRadius: 4,
    animation: 'fadeSlideUp 0.3s ease both',
  },
  pipeStepDone: { color: '#10B981', fontSize: 14, fontWeight: 700 },
  pipeConnector: {
    position: 'absolute', left: 15, top: 36,
    width: 1.5, height: 16,
    transition: 'background 0.3s',
  },

  formats: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  formatChip: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    padding: '4px 8px', borderRadius: 6,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: '#475569',
  },

  /* Right panel / form */
  rightPanel: {},
  form: { display: 'flex', flexDirection: 'column', gap: 20 },

  dropzone: {
    border: '1.5px dashed',
    borderRadius: 20,
    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
    cursor: 'pointer',
    minHeight: 220,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  dropPrompt: { textAlign: 'center', padding: '40px 24px' },
  dropIconWrap: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'rgba(124,58,237,0.1)',
    border: '1.5px solid rgba(124,58,237,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
    boxShadow: '0 0 24px rgba(124,58,237,0.15)',
  },
  dropIconInner: { fontSize: 26, color: '#7C3AED' },
  dropTitle: { fontSize: 17, fontWeight: 600, color: '#E2E8F0', marginBottom: 6 },
  dropSub: { fontSize: 14, color: '#475569', marginBottom: 14 },
  dropHint: { fontSize: 11, color: '#334155', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' },

  fileLoaded: { width: '100%' },
  previewWrap: { position: 'relative' },
  videoPreview: {
    width: '100%', borderRadius: '16px 16px 0 0',
    maxHeight: 260, background: '#000', display: 'block',
  },
  previewOverlayBadge: {
    position: 'absolute', top: 12, right: 12,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    color: '#94A3B8', fontSize: 11, fontWeight: 600,
    padding: '4px 10px', borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  fileMeta: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '0 0 16px 16px',
    border: '1px solid rgba(255,255,255,0.06)',
    borderTop: 'none',
  },
  fileMetaLeft: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 },
  fileIcon: { fontSize: 24, flexShrink: 0 },
  fileName: { fontSize: 13, fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 },
  fileDetail: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 },
  fileSize: { fontSize: 11, color: '#00E5FF', fontFamily: 'var(--font-mono)', background: 'rgba(0,229,255,0.08)', padding: '2px 6px', borderRadius: 4 },
  fileDot: { color: '#334155' },
  fileType: { fontSize: 11, color: '#475569', fontFamily: 'var(--font-mono)' },
  changeBtn: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#64748B', fontSize: 12, fontWeight: 500,
    padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
    flexShrink: 0, transition: 'all 0.15s',
  },

  fields: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  fieldLabelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' },
  charCount: { fontSize: 11, color: '#334155', fontFamily: 'var(--font-mono)' },
  input: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid',
    borderRadius: 12, padding: '13px 16px',
    fontSize: 15, color: '#E2E8F0',
    fontFamily: 'var(--font-ui)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  textarea: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid',
    borderRadius: 12, padding: '13px 16px',
    fontSize: 14, color: '#E2E8F0',
    fontFamily: 'var(--font-ui)',
    outline: 'none', resize: 'vertical',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    lineHeight: 1.65,
  },

  errBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#fca5a5',
    borderRadius: 12, padding: '13px 16px', fontSize: 13,
  },
  errIcon: { fontSize: 16, flexShrink: 0 },

  progressCard: {
    background: 'rgba(124,58,237,0.06)',
    border: '1px solid rgba(124,58,237,0.2)',
    borderRadius: 16, padding: '20px 22px',
  },
  progressTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  progressInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
  progressLabel: { fontSize: 14, fontWeight: 600, color: '#E2E8F0' },
  progressFile: { fontSize: 11, color: '#475569', fontFamily: 'var(--font-mono)' },
  progressPct: { fontSize: 22, fontWeight: 700, color: '#7C3AED', fontFamily: 'var(--font-mono)', lineHeight: 1 },
  progressTrack: {
    height: 6, background: 'rgba(255,255,255,0.06)',
    borderRadius: 3, overflow: 'hidden', marginBottom: 14,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #7C3AED, #00E5FF)',
    borderRadius: 3,
    transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
    position: 'relative', overflow: 'hidden',
  },
  progressShimmer: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
    animation: 'shimmer 1.5s infinite',
  },
  progressSteps: { display: 'flex', gap: 20 },
  progressStep: { fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-mono)', transition: 'color 0.3s' },

  submitBtn: {
    background: 'linear-gradient(135deg, #7C3AED 0%, #6d28d9 100%)',
    color: '#fff', fontSize: 15, fontWeight: 700,
    padding: '15px 28px', borderRadius: 14, border: 'none',
    boxShadow: '0 4px 32px rgba(124,58,237,0.35)',
    transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
    letterSpacing: '0.02em',
    width: '100%',
  },
  submitHint: { fontSize: 12, color: '#334155', textAlign: 'center', lineHeight: 1.5, fontFamily: 'var(--font-mono)' },
  spinner: {
    display: 'inline-block',
    width: 16, height: 16, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    animation: 'spin 0.6s linear infinite',
  },

  /* Success */
  successCard: {
    position: 'relative',
    background: '#111827',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: 24, padding: '56px 40px',
    textAlign: 'center', overflow: 'hidden',
  },
  successOrb: {
    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 65%)',
    top: -200, left: '50%', transform: 'translateX(-50%)',
    pointerEvents: 'none',
  },
  successIconWrap: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'rgba(16,185,129,0.12)',
    border: '1.5px solid rgba(16,185,129,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 0 32px rgba(16,185,129,0.2)',
  },
  successIcon: { fontSize: 30, color: '#10B981' },
  successTitle: { fontSize: 26, fontWeight: 700, color: '#E2E8F0', letterSpacing: '-0.02em', marginBottom: 12 },
  successSub: { fontSize: 14, color: '#64748B', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 28px' },
  successJobId: {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '10px 16px', marginBottom: 28,
  },
  successJobLabel: { fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' },
  successJobCode: { fontSize: 12, color: '#00E5FF', fontFamily: 'var(--font-mono)' },
  successBtns: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  successBtnPrimary: {
    background: 'linear-gradient(135deg, #7C3AED, #6d28d9)',
    color: '#fff', fontSize: 14, fontWeight: 600,
    padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
  },
  successBtnGhost: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#64748B', fontSize: 14, fontWeight: 500,
    padding: '12px 24px', borderRadius: 10, cursor: 'pointer',
  },
}