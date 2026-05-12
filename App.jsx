import { useState, useEffect } from 'react'
import { getRegistrations, addRegistration, checkDuplicateEmail } from './supabase'

// ── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  forest:  '#1E3A2F', forestLt: '#2D5243',
  terra:   '#C8553D', terraLt:  '#E07055',
  gold:    '#C8912A',
  cream:   '#F5F0E8', mist: '#EDE8DF', white: '#FDFAF5',
  ink:     '#181512', subtle: '#8A8078',
}

const font = {
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'DM Sans', system-ui, sans-serif",
}

const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'workuptown2025'

// ── Event schedule ────────────────────────────────────────────────────────────
const EVENTS = {
  '2025-06': { month: 'June 2025',   date: 'Tuesday, June 17',    time: '10AM – 2PM', venue: 'TBD', address: 'Washington Heights, NYC', spots: 25 },
  '2025-07': { month: 'July 2025',   date: 'Tuesday, July 15',    time: '10AM – 2PM', venue: 'TBD', address: 'Washington Heights, NYC', spots: 25 },
  '2025-08': { month: 'August 2025', date: 'Tuesday, August 19',  time: '10AM – 2PM', venue: 'TBD', address: 'Washington Heights, NYC', spots: 25 },
}
const MONTHS = Object.keys(EVENTS)

const PROFESSIONS = [
  'Freelancer / Consultant', 'Remote Employee', 'Student',
  'Entrepreneur / Founder', 'Creative (Design, Art, Music)',
  'Healthcare / Medical', 'Tech / Engineering',
  'Education', 'Non-profit / Community', 'Other',
]
const HOODS = [
  'Washington Heights', 'Inwood', 'Hamilton Heights', 'Harlem',
  'Morningside Heights', 'Fordham / Bronx', 'Upper West Side', 'Other',
]
const AVATAR_COLORS = ['#C8553D','#2D4A3E','#C8912A','#8B4A6B','#2B5F7A','#3D6B3A','#7B4F2E']

// ── Helpers ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  const color = AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: font.serif, fontSize: size * 0.35, fontWeight: 700 }}>
      {initials}
    </div>
  )
}

function Logo({ dark = true }) {
  const fg = dark ? C.cream : C.ink
  const cx = 56, cy = 52, r = 46
  return (
    <svg width="210" height="108" viewBox="0 0 210 108" fill="none">
      <circle cx={cx} cy={cy} r={r} fill={dark?'rgba(245,240,232,0.07)':'rgba(26,26,26,0.06)'} stroke={dark?'rgba(245,240,232,0.2)':'rgba(26,26,26,0.15)'} strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={r-7} fill="none" stroke={dark?'rgba(245,240,232,0.1)':'rgba(26,26,26,0.08)'} strokeWidth="0.75" strokeDasharray="2 4"/>
      <defs>
        <path id="topA" d={`M ${cx-r+6},${cy} A ${r-6},${r-6} 0 0,1 ${cx+r-6},${cy}`}/>
        <path id="botA" d={`M ${cx-r+6},${cy} A ${r-6},${r-6} 0 0,0 ${cx+r-6},${cy}`}/>
      </defs>
      <text fontFamily="Arial" fontSize="7" letterSpacing="2" fill={dark?'rgba(245,240,232,0.55)':'rgba(26,26,26,0.45)'}>
        <textPath href="#topA" startOffset="10%">WASHINGTON HTS</textPath>
      </text>
      <text fontFamily="Arial" fontSize="7" letterSpacing="2" fill={dark?'rgba(245,240,232,0.55)':'rgba(26,26,26,0.45)'}>
        <textPath href="#botA" startOffset="25%">· EST. 2025 ·</textPath>
      </text>
      <text x={cx} y={cy+7} fontFamily="Georgia,'Times New Roman',serif" fontWeight="700" fontSize="26" textAnchor="middle" fill={C.terra}>WU</text>
      <polygon points={`${cx},${cy-16} ${cx-6},${cy-9} ${cx+6},${cy-9}`} fill={C.gold}/>
      <text x="118" y="48" fontFamily="Georgia,'Times New Roman',serif" fontWeight="700" fontSize="26" fill={fg}>Work</text>
      <text x="118" y="72" fontFamily="Georgia,'Times New Roman',serif" fontStyle="italic" fontSize="26" fill={C.terra}>Uptown</text>
      <text x="118" y="86" fontFamily="Arial" fontSize="8" letterSpacing="2" fill={dark?'rgba(245,240,232,0.3)':'rgba(26,26,26,0.3)'}>COWORKING SERIES</text>
    </svg>
  )
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', disabled, style = {} }) {
  const base = { border: 'none', borderRadius: 10, padding: '13px 24px', fontFamily: font.serif,
    fontSize: 15, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontWeight: 700, ...style }
  const variants = {
    primary:   { background: disabled ? '#aaa' : C.terra,   color: '#fff' },
    secondary: { background: C.mist,  color: C.ink },
    ghost:     { background: 'rgba(245,240,232,0.1)', color: C.cream, border: '1px solid rgba(245,240,232,0.2)' },
    forest:    { background: C.forest, color: C.cream },
  }
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>{children}</button>
}

function MonthTabs({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: `1px solid ${C.mist}` }}>
      {MONTHS.map(m => (
        <button key={m} onClick={() => onChange(m)} style={{
          background: 'none', border: 'none', borderBottom: `2px solid ${active===m ? C.terra : 'transparent'}`,
          padding: '10px 20px', fontFamily: font.serif, fontSize: 14, cursor: 'pointer',
          color: active===m ? C.terra : C.subtle, fontWeight: active===m ? 700 : 400, transition: 'all 0.15s',
        }}>{EVENTS[m].month}</button>
      ))}
    </div>
  )
}

function InfoCard({ icon, label, value }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.mist}`, borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div>
        <div style={{ fontFamily: font.sans, fontSize: 9, letterSpacing: 2, color: C.subtle, marginBottom: 4, fontWeight: 600 }}>{label.toUpperCase()}</div>
        <div style={{ fontFamily: font.serif, fontSize: 15, color: C.ink, fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]           = useState('home')
  const [activeMonth, setMonth]   = useState(MONTHS[0])
  const [regs, setRegs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [adminOk, setAdminOk]     = useState(false)
  const [adminPw, setAdminPw]     = useState('')
  const [adminErr, setAdminErr]   = useState(false)
  const [form, setForm]           = useState({ firstName:'', lastName:'', email:'', profession:'', neighborhood:'', heardFrom:'', memberInterest: false })
  const [formErr, setFormErr]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState('')

  const event    = EVENTS[activeMonth]
  const spotsLeft = Math.max(0, event.spots - regs.length)

  useEffect(() => {
    setLoading(true)
    getRegistrations(activeMonth).then(data => { setRegs(data); setLoading(false) })
  }, [activeMonth])

  // ── Form ──────────────────────────────────────────────────────────────────
  const f = (name, value) => setForm(p => ({ ...p, [name]: value }))

  const validate = () => {
    const e = {}
    if (!form.firstName.trim())  e.firstName  = 'Required'
    if (!form.lastName.trim())   e.lastName   = 'Required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.profession)        e.profession = 'Required'
    if (!form.neighborhood)      e.neighborhood = 'Required'
    setFormErr(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setSubmitErr('')
    try {
      const isDupe = await checkDuplicateEmail(form.email, activeMonth)
      if (isDupe) { setSubmitErr("You're already registered for this month!"); setSubmitting(false); return }
      const reg = { month_key: activeMonth, first_name: form.firstName, last_name: form.lastName,
        email: form.email, profession: form.profession, neighborhood: form.neighborhood,
        heard_from: form.heardFrom, member_interest: form.memberInterest }
      const saved = await addRegistration(reg)
      setRegs(p => [...p, saved])
      setForm({ firstName:'', lastName:'', email:'', profession:'', neighborhood:'', heardFrom:'', memberInterest: false })
      setView('success')
    } catch (err) {
      setSubmitErr('Something went wrong. Please try again.')
      console.error(err)
    }
    setSubmitting(false)
  }

  // ── Nav ───────────────────────────────────────────────────────────────────
  const Nav = () => (
    <nav style={{ background: C.forest, padding: '0 32px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 2px 24px rgba(0,0,0,0.3)' }}>
      <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <Logo dark={true}/>
      </button>
      <div style={{ display: 'flex', gap: 4 }}>
        {[['home','Events'],['directory','Directory'],['admin','Admin']].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            background: view===v ? 'rgba(245,240,232,0.12)' : 'transparent',
            color: view===v ? C.cream : 'rgba(245,240,232,0.5)',
            border: 'none', borderRadius: 8, padding: '7px 16px',
            fontFamily: font.sans, fontSize: 13, cursor: 'pointer', fontWeight: view===v ? 600 : 400,
          }}>{label}</button>
        ))}
      </div>
    </nav>
  )

  // ── Home ──────────────────────────────────────────────────────────────────
  const HomeView = () => (
    <div>
      <div style={{ background: C.forest, padding: '64px 32px 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -70, right: -70, width: 300, height: 300, borderRadius: '50%', background: C.terra, opacity: 0.07 }}/>
        <div style={{ position: 'absolute', bottom: -20, left: '45%', width: 180, height: 180, borderRadius: '50%', background: C.gold, opacity: 0.06 }}/>
        <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
          <div style={{ fontFamily: font.sans, fontSize: 10, letterSpacing: 3, color: C.gold, marginBottom: 16, fontWeight: 600 }}>COMMUNITY COWORKING SERIES · WASHINGTON HEIGHTS, NYC</div>
          <h1 style={{ fontFamily: font.serif, fontSize: 56, color: C.cream, lineHeight: 1.05, marginBottom: 16, fontWeight: 700 }}>
            Work alongside<br/><em style={{ color: C.gold }}>your neighbors.</em>
          </h1>
          <p style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 16, color: 'rgba(245,240,232,0.65)', lineHeight: 1.7, maxWidth: 500, marginBottom: 36 }}>
            A free monthly coworking session for remote workers, freelancers, and students in Washington Heights. Good WiFi. Great coffee. Real community.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Btn onClick={() => setView('register')}>Reserve your spot →</Btn>
            <Btn onClick={() => setView('directory')} variant="ghost">See who's coming</Btn>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 32px' }}>
        <MonthTabs active={activeMonth} onChange={m => { setMonth(m); }}/>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 40 }}>
          <InfoCard icon="📅" label="Date"  value={event.date}/>
          <InfoCard icon="🕙" label="Time"  value={event.time}/>
          <InfoCard icon="📍" label="Venue" value={event.venue}/>
          <InfoCard icon="🗺" label="Area"  value={event.address}/>
        </div>

        {/* Spots bar */}
        <div style={{ background: C.mist, borderRadius: 14, padding: '24px 28px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center', marginBottom: 40 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: font.serif, fontSize: 52, fontWeight: 700, color: spotsLeft > 5 ? C.forest : C.terra, lineHeight: 1 }}>{loading ? '…' : spotsLeft}</div>
            <div style={{ fontFamily: font.sans, fontSize: 10, letterSpacing: 2, color: C.subtle, marginTop: 4, fontWeight: 600 }}>SPOTS LEFT</div>
          </div>
          <div>
            <div style={{ fontFamily: font.serif, fontSize: 16, color: C.ink, marginBottom: 10 }}>
              {loading ? 'Loading…' : `${regs.length} ${regs.length === 1 ? 'person' : 'people'} registered for ${event.month}`}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {regs.slice(0,10).map((r, i) => (
                <div key={i} style={{ marginRight: -6, zIndex: regs.length - i }}>
                  <Avatar name={`${r.first_name} ${r.last_name}`} size={36}/>
                </div>
              ))}
              {regs.length === 0 && !loading && (
                <div style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 13, color: C.subtle }}>Be the first to register</div>
              )}
            </div>
          </div>
        </div>

        {/* What to expect */}
        <h2 style={{ fontFamily: font.serif, fontSize: 22, color: C.ink, marginBottom: 20, fontWeight: 400 }}>What to expect</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 40 }}>
          {[
            { icon: '☕', title: 'Free coffee', body: 'Courtesy of a rotating local Washington Heights coffee shop sponsor each month' },
            { icon: '💻', title: 'Fast WiFi',   body: 'Dedicated connection for the session — come focused and stay focused' },
            { icon: '🤝', title: 'Real connections', body: 'Meet freelancers, remote workers & students who live right in your neighborhood' },
          ].map((w, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.mist}`, borderRadius: 12, padding: '22px 18px' }}>
              <div style={{ fontSize: 30, marginBottom: 12 }}>{w.icon}</div>
              <div style={{ fontFamily: font.serif, fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{w.title}</div>
              <div style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 12, color: C.subtle, lineHeight: 1.6 }}>{w.body}</div>
            </div>
          ))}
        </div>

        <Btn onClick={() => setView('register')} style={{ width: '100%', textAlign: 'center', borderRadius: 12, padding: '18px', fontSize: 17 }}>
          Reserve my spot for {event.month} →
        </Btn>
        <p style={{ textAlign: 'center', fontFamily: font.serif, fontStyle: 'italic', fontSize: 12, color: C.subtle, marginTop: 10 }}>Free to attend. No credit card. Ever.</p>
      </div>
    </div>
  )

  // ── Register ──────────────────────────────────────────────────────────────
  const FieldWrap = ({ label, name, err, children }) => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontFamily: font.sans, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: C.subtle, marginBottom: 6, fontWeight: 600 }}>
        {label} <span style={{ color: C.terra }}>*</span>
      </label>
      {children}
      {err && <div style={{ fontSize: 11, color: C.terra, marginTop: 4 }}>{err}</div>}
    </div>
  )

  const inputStyle = (hasErr) => ({
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: `1.5px solid ${hasErr ? C.terra : C.mist}`,
    fontSize: 14, outline: 'none', fontFamily: font.serif,
    background: C.white, color: C.ink, transition: 'border 0.2s',
  })

  const RegisterView = () => (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 32px' }}>
      <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: font.serif, fontSize: 13, color: C.subtle, marginBottom: 28, padding: 0 }}>← Back to events</button>
      <div style={{ fontFamily: font.sans, fontSize: 10, letterSpacing: 3, color: C.terra, marginBottom: 10, fontWeight: 600 }}>REGISTER</div>
      <h1 style={{ fontFamily: font.serif, fontSize: 28, color: C.ink, marginBottom: 6, fontWeight: 700 }}>Join us for <em>{event.month}</em></h1>
      <p style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 13, color: C.subtle, marginBottom: 32 }}>{event.date} · {event.time} · {event.venue}</p>

      {spotsLeft <= 0 ? (
        <div style={{ background: C.mist, borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>😔</div>
          <div style={{ fontFamily: font.serif, fontSize: 18, color: C.ink, marginBottom: 8 }}>This session is full</div>
          <p style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 13, color: C.subtle, lineHeight: 1.6 }}>Check next month's event or add yourself to the membership waitlist.</p>
        </div>
      ) : (
        <div style={{ background: C.white, border: `1px solid ${C.mist}`, borderRadius: 14, padding: '32px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FieldWrap label="First name" name="firstName" err={formErr.firstName}>
              <input value={form.firstName} onChange={e => f('firstName', e.target.value)} style={inputStyle(formErr.firstName)}/>
            </FieldWrap>
            <FieldWrap label="Last name" name="lastName" err={formErr.lastName}>
              <input value={form.lastName} onChange={e => f('lastName', e.target.value)} style={inputStyle(formErr.lastName)}/>
            </FieldWrap>
          </div>

          <FieldWrap label="Email address" err={formErr.email}>
            <input type="email" value={form.email} onChange={e => f('email', e.target.value)} style={inputStyle(formErr.email)}/>
          </FieldWrap>

          <FieldWrap label="What do you do?" err={formErr.profession}>
            <select value={form.profession} onChange={e => f('profession', e.target.value)} style={{ ...inputStyle(formErr.profession), cursor: 'pointer', color: form.profession ? C.ink : C.subtle }}>
              <option value="">Select…</option>
              {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </FieldWrap>

          <FieldWrap label="Your neighborhood" err={formErr.neighborhood}>
            <select value={form.neighborhood} onChange={e => f('neighborhood', e.target.value)} style={{ ...inputStyle(formErr.neighborhood), cursor: 'pointer', color: form.neighborhood ? C.ink : C.subtle }}>
              <option value="">Select…</option>
              {HOODS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </FieldWrap>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontFamily: font.sans, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: C.subtle, marginBottom: 6, fontWeight: 600 }}>How did you hear about us?</label>
            <input value={form.heardFrom} onChange={e => f('heardFrom', e.target.value)} placeholder="Instagram, a friend, flyer…" style={inputStyle(false)}/>
          </div>

          <div style={{ background: C.mist, borderRadius: 10, padding: '16px 18px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer' }}
            onClick={() => f('memberInterest', !form.memberInterest)}>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${form.memberInterest ? C.forest : '#CCC6BB'}`, background: form.memberInterest ? C.forest : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' }}>
              {form.memberInterest && <span style={{ color: '#fff', fontSize: 13 }}>✓</span>}
            </div>
            <div>
              <div style={{ fontFamily: font.serif, fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 3 }}>Add me to the founding membership list</div>
              <div style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 12, color: C.subtle, lineHeight: 1.5 }}>When Work Uptown opens a permanent space, I want to hear about it first.</div>
            </div>
          </div>

          <p style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 11, color: C.subtle, marginBottom: 20, lineHeight: 1.6 }}>Your email will never be shown publicly or shared. Ever.</p>

          {submitErr && <div style={{ background: '#FEE', border: '1px solid #FCC', borderRadius: 8, padding: '10px 14px', fontFamily: font.sans, fontSize: 13, color: '#C00', marginBottom: 16 }}>{submitErr}</div>}

          <Btn onClick={submit} disabled={submitting} style={{ width: '100%', textAlign: 'center', borderRadius: 10, padding: '15px', fontSize: 16 }}>
            {submitting ? 'Saving your spot…' : `Reserve my spot for ${event.month} →`}
          </Btn>
        </div>
      )}
    </div>
  )

  // ── Success ───────────────────────────────────────────────────────────────
  const SuccessView = () => (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: '0 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>🎉</div>
      <h1 style={{ fontFamily: font.serif, fontSize: 32, color: C.ink, marginBottom: 12, fontWeight: 700 }}>You're in!</h1>
      <p style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 15, color: C.subtle, lineHeight: 1.7, marginBottom: 36, maxWidth: 400, margin: '0 auto 36px' }}>
        See you at {event.venue} on {event.date}.<br/>Bring your laptop — coffee's on us.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Btn onClick={() => setView('directory')} variant="forest">See who else is coming →</Btn>
        <Btn onClick={() => setView('home')} variant="secondary">Back to events</Btn>
      </div>
    </div>
  )

  // ── Directory ─────────────────────────────────────────────────────────────
  const DirectoryView = () => (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 32px' }}>
      <div style={{ fontFamily: font.sans, fontSize: 10, letterSpacing: 3, color: C.terra, marginBottom: 10, fontWeight: 600 }}>MEMBER DIRECTORY</div>
      <h1 style={{ fontFamily: font.serif, fontSize: 28, color: C.ink, marginBottom: 6, fontWeight: 700 }}>Who's coming</h1>
      <p style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 13, color: C.subtle, marginBottom: 32 }}>The community forming around Work Uptown.</p>
      <MonthTabs active={activeMonth} onChange={setMonth}/>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.subtle, fontFamily: font.serif, fontStyle: 'italic' }}>Loading registrations…</div>
      ) : regs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>👋</div>
          <div style={{ fontFamily: font.serif, fontSize: 20, color: C.ink, marginBottom: 10 }}>No one registered yet for {event.month}</div>
          <Btn onClick={() => setView('register')} style={{ marginTop: 8 }}>Be the first →</Btn>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: font.serif, fontSize: 14, color: C.subtle }}><strong style={{ color: C.ink }}>{regs.length}</strong> registered · {spotsLeft} spots left</div>
            <Btn onClick={() => setView('register')} style={{ padding: '9px 20px', fontSize: 13 }}>Join them →</Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {regs.map((r, i) => (
              <div key={i} style={{ background: C.white, border: `1px solid ${C.mist}`, borderRadius: 12, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
                <Avatar name={`${r.first_name} ${r.last_name}`}/>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontFamily: font.serif, fontSize: 15, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.first_name} {r.last_name[0]}.
                  </div>
                  <div style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 12, color: C.terra, marginTop: 2 }}>{r.profession}</div>
                  <div style={{ fontFamily: font.sans, fontSize: 10, color: C.subtle, marginTop: 3, letterSpacing: 0.5 }}>{r.neighborhood}</div>
                </div>
                {r.member_interest && (
                  <div style={{ background: C.forest, color: C.cream, borderRadius: 20, padding: '3px 10px', fontSize: 9, fontFamily: font.sans, letterSpacing: 1, fontWeight: 600, flexShrink: 0 }}>MEMBER</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )

  // ── Admin ─────────────────────────────────────────────────────────────────
  const AdminView = () => {
    if (!adminOk) return (
      <div style={{ maxWidth: 360, margin: '80px auto', padding: '0 32px', textAlign: 'center' }}>
        <div style={{ fontFamily: font.serif, fontSize: 26, color: C.ink, marginBottom: 8 }}>Admin access</div>
        <p style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 13, color: C.subtle, marginBottom: 28, lineHeight: 1.6 }}>Enter your password to view full registrations and export data.</p>
        <input type="password" value={adminPw} onChange={e => setAdminPw(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') adminPw === ADMIN_PASS ? (setAdminOk(true), setAdminErr(false)) : setAdminErr(true) }}
          placeholder="Password" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1.5px solid ${adminErr ? C.terra : C.mist}`, fontSize: 15, outline: 'none', fontFamily: font.serif, marginBottom: 12, textAlign: 'center' }}/>
        {adminErr && <div style={{ fontSize: 12, color: C.terra, marginBottom: 12 }}>Incorrect password</div>}
        <Btn variant="forest" onClick={() => adminPw === ADMIN_PASS ? (setAdminOk(true), setAdminErr(false)) : setAdminErr(true)} style={{ width: '100%', textAlign: 'center', borderRadius: 8 }}>Unlock →</Btn>
      </div>
    )

    const memCount = regs.filter(r => r.member_interest).length
    const csv = ['First,Last,Email,Profession,Neighborhood,Member Interest,Heard From,Registered']
      .concat(regs.map(r => `${r.first_name},${r.last_name},${r.email},${r.profession},${r.neighborhood},${r.member_interest?'Yes':'No'},"${r.heard_from||''}",${new Date(r.registered_at).toLocaleDateString()}`))
      .join('\n')
    const downloadCSV = () => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      a.download = `workuptown-${activeMonth}.csv`
      a.click()
    }

    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: font.sans, fontSize: 10, letterSpacing: 3, color: C.terra, marginBottom: 8, fontWeight: 600 }}>ADMIN · FULL REGISTRATIONS</div>
            <h1 style={{ fontFamily: font.serif, fontSize: 26, color: C.ink, fontWeight: 700 }}>Registration dashboard</h1>
          </div>
          <Btn onClick={downloadCSV} variant="forest" style={{ fontSize: 13, padding: '10px 20px', borderRadius: 8 }}>⬇ Export CSV</Btn>
        </div>

        <MonthTabs active={activeMonth} onChange={setMonth}/>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Registered',       val: regs.length,  color: C.forest },
            { label: 'Spots left',        val: spotsLeft,    color: spotsLeft < 5 ? C.terra : C.forest },
            { label: 'Want membership',   val: memCount,     color: C.gold },
            { label: 'Membership rate',   val: regs.length ? Math.round(memCount/regs.length*100)+'%' : '0%', color: C.terra },
          ].map((s, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.mist}`, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontFamily: font.serif, fontSize: 30, fontWeight: 700, color: s.color }}>{loading ? '…' : s.val}</div>
              <div style={{ fontFamily: font.sans, fontSize: 9, color: C.subtle, marginTop: 4, letterSpacing: 1, fontWeight: 600 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: C.subtle, fontFamily: font.serif, fontStyle: 'italic' }}>Loading…</div>
        ) : regs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: C.subtle, fontFamily: font.serif, fontStyle: 'italic' }}>No registrations yet for {event.month}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {regs.map((r, i) => (
              <div key={i} style={{ background: C.white, border: `1px solid ${C.mist}`, borderRadius: 10, padding: '14px 18px', display: 'grid', gridTemplateColumns: 'auto 1.4fr 1fr 1fr auto', gap: 16, alignItems: 'center' }}>
                <Avatar name={`${r.first_name} ${r.last_name}`} size={34}/>
                <div>
                  <div style={{ fontFamily: font.serif, fontSize: 14, fontWeight: 700 }}>{r.first_name} {r.last_name}</div>
                  <div style={{ fontFamily: font.sans, fontSize: 11, color: C.subtle, marginTop: 2 }}>{r.email}</div>
                </div>
                <div style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 12, color: C.terra }}>{r.profession}</div>
                <div style={{ fontFamily: font.sans, fontSize: 11, color: C.subtle }}>{r.neighborhood}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  {r.member_interest && <div style={{ background: C.forest, color: C.cream, borderRadius: 20, padding: '2px 10px', fontSize: 9, fontFamily: font.sans, letterSpacing: 1, fontWeight: 600, whiteSpace: 'nowrap' }}>MEMBER INT.</div>}
                  <div style={{ fontFamily: font.sans, fontSize: 9, color: C.subtle }}>{new Date(r.registered_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: C.cream, minHeight: '100vh' }}>
      <Nav/>
      {view === 'home'      && <HomeView/>}
      {view === 'register'  && <RegisterView/>}
      {view === 'success'   && <SuccessView/>}
      {view === 'directory' && <DirectoryView/>}
      {view === 'admin'     && <AdminView/>}
      <footer style={{ background: C.forest, padding: '28px 32px', textAlign: 'center', marginTop: 60 }}>
        <p style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 12, color: 'rgba(245,240,232,0.3)' }}>
          Work Uptown · Washington Heights, NYC · Free community coworking series
        </p>
      </footer>
    </div>
  )
}
