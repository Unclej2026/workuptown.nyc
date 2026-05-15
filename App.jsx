import { useState, useEffect } from 'react'
import { getRegistrations, addRegistration, checkDuplicateEmail, supabase } from './supabase'

const C = {
  bg:      '#F7F6F3',
  white:   '#FFFFFF',
  ink:     '#0D0D0D',
  inkLt:   '#1A1A1A',
  muted:   '#6B6B6B',
  neutral: '#4A4A4A',
  border:  '#E8E5E0',
  terra:   '#C8553D',
  terraDk: '#A8402A',
  gold:    '#C8912A',
  sage:    '#2A6049',
  sageLt:  '#3D8A68',
  lavender:'#7C6FCD',
};

const font = {
  display: "'Syne', system-ui, sans-serif",
  body:    "'DM Sans', system-ui, sans-serif",
};

const EVENTS = {
  '2025-06': { month: 'June 2025',   date: 'Tuesday, June 17',   time: '10AM – 2PM', venue: 'TBD', address: 'Washington Heights, NYC', spots: 25 },
  '2025-07': { month: 'July 2025',   date: 'Tuesday, July 15',   time: '10AM – 2PM', venue: 'TBD', address: 'Washington Heights, NYC', spots: 25 },
  '2025-08': { month: 'August 2025', date: 'Tuesday, August 19', time: '10AM – 2PM', venue: 'TBD', address: 'Washington Heights, NYC', spots: 25 },
};
const MONTHS = Object.keys(EVENTS);

const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'workuptown2025'

const PROFESSIONS = ['Freelancer / Consultant','Remote Employee','Student','Entrepreneur / Founder','Creative (Design, Art, Music)','Healthcare / Medical','Tech / Engineering','Education','Non-profit / Community','Other'];
const HOODS = ['Washington Heights','Inwood','Hamilton Heights','Harlem','Morningside Heights','Fordham / Bronx','Upper West Side','Other'];
const AVATAR_BG = ['#C8553D','#2A6049','#C8912A','#7C6FCD','#2563EB','#16A34A','#A8402A'];

function Avatar({ name, size = 40 }) {
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const bg = AVATAR_BG[(name||'').charCodeAt(0) % AVATAR_BG.length];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:bg, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontFamily:font.body, fontSize:size*0.34, fontWeight:600 }}>
      {initials}
    </div>
  );
}

function Pill({ children, color=C.terra, style={} }) {
  return (
    <span style={{ display:'inline-block', padding:'3px 12px', borderRadius:99,
      background:color+'18', color, fontFamily:font.body,
      fontSize:11, fontWeight:600, letterSpacing:0.3, ...style }}>
      {children}
    </span>
  );
}

function Btn({ children, onClick, variant='primary', disabled, full, style={} }) {
  const base = { border:'none', borderRadius:99, fontFamily:font.body, fontSize:14,
    fontWeight:600, cursor:disabled?'not-allowed':'pointer', transition:'all 0.15s',
    padding:'12px 28px', width:full?'100%':'auto', textAlign:'center',
    opacity:disabled?0.5:1, display:'inline-block', letterSpacing:0.2, ...style };
  const v = {
    primary:   { background:C.terra,   color:'#fff' },
    secondary: { background:C.border,  color:C.ink },
    ghost:     { background:'transparent', color:'#fff', border:'1.5px solid rgba(255,255,255,0.25)' },
    dark:      { background:C.ink,     color:'#fff' },
    sage:      { background:C.sage,    color:'#fff' },
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant]}}>{children}</button>;
}

function Logo({ dark=true }) {
  const fg = dark ? '#fff' : C.ink;
  const ringStroke = dark ? 'rgba(245,240,232,0.25)' : 'rgba(26,26,26,0.18)';
  const ringDash = dark ? 'rgba(245,240,232,0.12)' : 'rgba(26,26,26,0.1)';
  const arcText = dark ? 'rgba(245,240,232,0.65)' : 'rgba(26,26,26,0.55)';
  const bgFill = dark ? 'rgba(245,240,232,0.06)' : 'rgba(26,26,26,0.04)';
  // Fixed dimensions - no scaling that causes skew
  const S = 52; // seal size
  const cx = S/2, cy = S/2, r = S/2 - 2;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} fill="none" style={{ flexShrink:0 }}>
        <defs>
          <path id="tArc" d={`M ${cx-r+4},${cy} A ${r-4},${r-4} 0 0,1 ${cx+r-4},${cy}`}/>
          <path id="bArc" d={`M ${cx-r+4},${cy} A ${r-4},${r-4} 0 0,0 ${cx+r-4},${cy}`}/>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={bgFill} stroke={ringStroke} strokeWidth="1.5"/>
        <circle cx={cx} cy={cy} r={r-5} fill="none" stroke={ringDash} strokeWidth="0.75" strokeDasharray="2 3"/>
        <text fontFamily="Arial" fontSize="5" fontWeight="700" letterSpacing="1.2" fill={arcText} textAnchor="middle">
          <textPath href="#tArc" startOffset="50%">WASHINGTON HTS</textPath>
        </text>
        <text fontFamily="Arial" fontSize="4.5" fontWeight="600" letterSpacing="1" fill={arcText} textAnchor="middle">
          <textPath href="#bArc" startOffset="50%">· EST. 2026 ·</textPath>
        </text>
        <polygon points={`${cx},${cy-11} ${cx-3.5},${cy-6.5} ${cx+3.5},${cy-6.5}`} fill="#C8912A"/>
        <text x={cx} y={cy+6} fontFamily="Georgia,'Times New Roman',serif" fontWeight="700"
          fontSize="12" textAnchor="middle" fill="#C8553D" letterSpacing="-0.5">WU</text>
        <line x1={cx-8} y1={cy+8} x2={cx+8} y2={cy+8} stroke="rgba(200,85,61,0.3)" strokeWidth="0.75"/>
      </svg>
      <div>
        <div style={{ fontFamily:font.display, fontSize:18, fontWeight:800, color:fg, lineHeight:1.1, letterSpacing:-0.5 }}>
          Work <span style={{ color:'#C8553D' }}>Uptown</span>
        </div>
        <div style={{ fontFamily:font.body, fontSize:9, color:dark?'rgba(255,255,255,0.4)':C.muted, letterSpacing:2, marginTop:2 }}>
          COWORKING SERIES
        </div>
      </div>
    </div>
  );
}

function MonthTabs({ active, onChange }) {
  return (
    <div style={{ display:'flex', gap:6, marginBottom:32 }}>
      {MONTHS.map(m => (
        <button key={m} onClick={()=>onChange(m)} style={{
          background: active===m ? C.ink : 'transparent',
          color: active===m ? '#fff' : C.muted,
          border: `1.5px solid ${active===m ? C.ink : C.border}`,
          borderRadius:99, padding:'7px 18px',
          fontFamily:font.body, fontSize:13, fontWeight:active===m?600:400,
          cursor:'pointer', transition:'all 0.15s',
        }}>{EVENTS[m].month}</button>
      ))}
    </div>
  );
}

export default function App() {
  const [view, setView]         = useState(() => {
    const path = window.location.pathname;
    if (path === '/apply' || path === '/apply/') return 'register';
    return 'home';
  })
  const [activeMonth, setMonth] = useState(MONTHS[0])
  const [regs, setRegs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [adminOk, setAdminOk]   = useState(false)
  const [adminPw, setAdminPw]   = useState('')
  const [adminErr, setAdminErr] = useState(false)
  const [form, setForm]         = useState({ firstName:'', lastName:'', email:'', profession:'', neighborhood:'', heardFrom:'', whyJoin:'', lifeVision:'', wfhDays:[], inviteCode:'', memberInterest:false, interests:[] })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSub]    = useState(false)
  const [submitErr, setSubErr]  = useState('')

  useEffect(() => {
    setLoading(true)
    getRegistrations(activeMonth).then(d => { setRegs(d); setLoading(false) })
  }, [activeMonth])

  const event     = EVENTS[activeMonth]
const AdminView = () => {
    if (!adminOk) return (
      <div style={{ maxWidth:380, margin:'80px auto', padding:'0 40px', textAlign:'center' }}>
        <div style={{ fontFamily:font.display, fontSize:28, color:C.ink, marginBottom:8, fontWeight:800 }}>Admin</div>
        <p style={{ fontFamily:font.body, fontSize:13, color:C.muted, marginBottom:28, lineHeight:1.6 }}>Enter your password to view applications.</p>
        <input type="password" value={adminPw} onChange={e=>setAdminPw(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&(adminPw===ADMIN_PASS?(setAdminOk(true),setAdminErr(false)):setAdminErr(true))}
          placeholder="Password" style={{ width:'100%', padding:'12px 16px', borderRadius:10,
            border:`1.5px solid ${adminErr?C.terra:C.border}`, fontSize:15, outline:'none',
            fontFamily:font.body, marginBottom:12, textAlign:'center' }}/>
        {adminErr && <div style={{ fontSize:12, color:C.terra, marginBottom:12 }}>Incorrect password</div>}
        <Btn variant="dark" onClick={()=>adminPw===ADMIN_PASS?(setAdminOk(true),setAdminErr(false)):setAdminErr(true)}
          full style={{ borderRadius:10 }}>Unlock →</Btn>
      </div>
    );
    const memCount = regs.filter(r=>r.member_interest).length;
    const csv = ['First,Last,Email,Profession,Neighborhood,WFH Days,Why Join,Life Vision,Invite Code,Interests,Member Interest,Registered']
      .concat(regs.map(r=>`${r.first_name},${r.last_name},${r.email},${r.profession},${r.neighborhood},"${r.wfh_days||''}","${r.why_join||''}","${r.life_vision||''}","${r.invite_code||''}","${r.interests||''}",${r.member_interest?'Yes':'No'},${new Date(r.registered_at).toLocaleDateString()}`))
      .join('\n');

    const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const partners = [...new Set(regs.map(r=>r.invite_code?.split('-')[0]).filter(Boolean))];

    const filtered = regs.filter(r => {
      const dayMatch = dayFilter === 'all' || (r.wfh_days && r.wfh_days.includes(dayFilter));
      const partnerMatch = partnerFilter === 'all' || (r.invite_code && r.invite_code.startsWith(partnerFilter));
      return dayMatch && partnerMatch;
    });

    return (
      <div style={{ maxWidth:900, margin:'0 auto', padding:'40px 32px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <Pill color={C.terra} style={{ marginBottom:10 }}>Admin</Pill>
            <h1 style={{ fontFamily:font.display, fontSize:28, color:C.ink, fontWeight:800 }}>Curation Dashboard</h1>
          </div>
          <Btn variant="dark" onClick={()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`workuptown-${activeMonth}.csv`;a.click()}}
            style={{ fontSize:13, padding:'10px 20px' }}>⬇ Export CSV</Btn>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:24 }}>
          {[
            {label:'Applications', val:regs.length, color:C.sage},
            {label:'Spots left', val:Math.max(0,EVENTS[activeMonth].spots-regs.length), color:C.terra},
            {label:'Curated', val:curated.length, color:C.gold},
            {label:'With invite code', val:regs.filter(r=>r.invite_code).length, color:C.lavender},
            {label:'Want membership', val:memCount, color:C.sage},
          ].map((s,i)=>(
            <div key={i} style={{ background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:12, padding:'16px' }}>
              <div style={{ fontFamily:font.display, fontSize:28, fontWeight:800, color:s.color }}>{loading?'–':s.val}</div>
              <div style={{ fontFamily:font.body, fontSize:9, color:C.muted, marginTop:3, letterSpacing:1, fontWeight:600 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {[['applications','All Applications'],['curate','Curate Session']].map(([t,l])=>(
            <button key={t} onClick={()=>setAdminTab(t)} style={{
              background: adminTab===t ? C.ink : 'transparent',
              color: adminTab===t ? '#fff' : C.muted,
              border:`1.5px solid ${adminTab===t?C.ink:C.border}`,
              borderRadius:99, padding:'7px 18px', fontFamily:font.body,
              fontSize:13, fontWeight:500, cursor:'pointer',
            }}>{l}</button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontFamily:font.body, fontSize:11, color:C.muted, fontWeight:600, letterSpacing:1 }}>FILTER BY DAY:</span>
          {['all',...DAYS].map(d=>(
            <button key={d} onClick={()=>setDayFilter(d)} style={{
              padding:'5px 14px', borderRadius:99, fontFamily:font.body, fontSize:12,
              background: dayFilter===d ? C.sage : 'transparent',
              color: dayFilter===d ? '#fff' : C.muted,
              border:`1.5px solid ${dayFilter===d?C.sage:C.border}`,
              cursor:'pointer', transition:'all 0.15s',
            }}>{d==='all'?'All days':d}</button>
          ))}
        </div>

        {partners.length > 0 && (
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontFamily:font.body, fontSize:11, color:C.muted, fontWeight:600, letterSpacing:1 }}>FILTER BY PARTNER:</span>
            {['all',...partners].map(p=>(
              <button key={p} onClick={()=>setPartnerFilter(p)} style={{
                padding:'5px 14px', borderRadius:99, fontFamily:font.body, fontSize:12,
                background: partnerFilter===p ? C.lavender : 'transparent',
                color: partnerFilter===p ? '#fff' : C.muted,
                border:`1.5px solid ${partnerFilter===p?C.lavender:C.border}`,
                cursor:'pointer',
              }}>{p==='all'?'All partners':p}</button>
            ))}
          </div>
        )}

        {curated.length > 0 && adminTab === 'curate' && (
          <div style={{ background:C.sage, borderRadius:12, padding:'14px 20px', marginBottom:20,
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:font.body, fontSize:14, color:'#fff', fontWeight:600 }}>
              {curated.length} member{curated.length>1?'s':''} curated for this session
            </span>
            <Btn variant="ghost" style={{ padding:'8px 20px', fontSize:13, border:'1.5px solid rgba(255,255,255,0.3)' }}
              onClick={()=>alert(`Ready to invite:\n${regs.filter(r=>curated.includes(r.id)).map(r=>`${r.first_name} ${r.last_name} — ${r.email}`).join('\n')}`)}>
              View invite list →
            </Btn>
          </div>
        )}

        {/* Applications */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:48, color:C.muted, fontFamily:font.body, fontStyle:'italic' }}>
              No applications match this filter
            </div>
          )}
          {filtered.map((r,i)=>{
            const isCurated = curated.includes(r.id);
            return (
              <div key={i} style={{ background:'#fff',
                border:`2px solid ${isCurated?C.sage:C.border}`,
                borderRadius:14, padding:'18px 20px', transition:'all 0.15s' }}>

                {/* Top row */}
                <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:14, alignItems:'flex-start', marginBottom:12 }}>
                  <Avatar name={`${r.first_name} ${r.last_name}`} size={40}/>
                  <div>
                    <div style={{ fontFamily:font.display, fontSize:16, fontWeight:700, color:C.ink }}>{r.first_name} {r.last_name}</div>
                    <div style={{ fontFamily:font.body, fontSize:12, color:C.muted, marginTop:2 }}>{r.email} · {r.neighborhood}</div>
                    <div style={{ fontFamily:font.body, fontSize:12, color:C.neutral, marginTop:2 }}>{r.profession}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                    {adminTab==='curate' && (
                      <button onClick={()=>toggleCurate(r.id)} style={{
                        background: isCurated ? C.sage : 'transparent',
                        color: isCurated ? '#fff' : C.sage,
                        border:`2px solid ${C.sage}`, borderRadius:99,
                        padding:'6px 16px', fontFamily:font.body,
                        fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                      }}>{isCurated ? '✓ Selected' : '+ Select'}</button>
                    )}
                    {r.invite_code && <Pill color={C.lavender} style={{ fontSize:9 }}>{r.invite_code}</Pill>}
                    {r.member_interest && <Pill color={C.sage} style={{ fontSize:9 }}>MEMBER</Pill>}
                  </div>
                </div>

                {/* WFH Days */}
                {r.wfh_days && (
                  <div style={{ marginBottom:10 }}>
                    <span style={{ fontFamily:font.body, fontSize:9, fontWeight:600, letterSpacing:1.5,
                      textTransform:'uppercase', color:C.muted, marginRight:8 }}>WFH DAYS</span>
                    {r.wfh_days.split(',').map(d=>d.trim()).filter(Boolean).map((d,di)=>(
                      <span key={di} style={{ display:'inline-block', padding:'2px 10px', borderRadius:99,
                        background: d===dayFilter && dayFilter!=='all' ? C.sage+'20' : C.bg,
                        color: d===dayFilter && dayFilter!=='all' ? C.sage : C.neutral,
                        fontFamily:font.body, fontSize:11, fontWeight:500, marginRight:4 }}>{d}</span>
                    ))}
                  </div>
                )}

                {/* Interests */}
                {r.interests && (
                  <div style={{ marginBottom:10, display:'flex', gap:6, flexWrap:'wrap' }}>
                    {r.interests.split(',').map(i=>i.trim()).filter(Boolean).map((int,ii)=>(
                      <Pill key={ii} color={C.lavender} style={{ fontSize:10 }}>{int}</Pill>
                    ))}
                  </div>
                )}

                {/* Why join */}
                {r.why_join && (
                  <div style={{ background:C.bg, borderRadius:8, padding:'10px 14px', marginBottom:8,
                    fontFamily:font.body, fontSize:12, color:C.neutral, lineHeight:1.6,
                    borderLeft:`3px solid ${C.terra}` }}>
                    <span style={{ fontWeight:600, color:C.muted, fontSize:9, letterSpacing:1,
                      textTransform:'uppercase', display:'block', marginBottom:4 }}>Why they want to join</span>
                    {r.why_join}
                  </div>
                )}

                {/* Life vision */}
                {r.life_vision && (
                  <div style={{ background:`${C.sage}08`, borderRadius:8, padding:'10px 14px',
                    fontFamily:font.body, fontSize:12, color:C.neutral, lineHeight:1.6,
                    borderLeft:`3px solid ${C.sage}` }}>
                    <span style={{ fontWeight:600, color:C.sage, fontSize:9, letterSpacing:1,
                      textTransform:'uppercase', display:'block', marginBottom:4 }}>What they want their life to look like</span>
                    {r.life_vision}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  const spotsLeft = Math.max(0, event.spots - regs.length);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  const Nav = () => (
    <nav style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)',
      borderBottom:`1px solid ${C.border}`, padding:'0 40px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      height:64, position:'sticky', top:0, zIndex:100 }}>
      <button onClick={()=>setView('home')} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
        <Logo dark={false}/>
      </button>
      <div style={{ display:'flex', gap:4 }}>
        {[['home','Events'],['directory','Community'],['admin','Admin']].map(([v,label])=>(

          <button key={v} onClick={()=>setView(v)} style={{
            background: view===v ? C.ink : 'transparent',
            color: view===v ? '#fff' : C.muted,
            border:'none', borderRadius:99, padding:'7px 16px',
            fontFamily:font.body, fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.15s',
          }}>{label}</button>
        ))}
      </div>
    </nav>
  );

  const HomeView = () => (
    <div>
      {/* Hero */}
      <div style={{ background:C.ink, padding:'60px 40px 56px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:400, height:400,
          borderRadius:'50%', border:'1px solid rgba(200,85,61,0.15)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:-40, right:-40, width:300, height:300,
          borderRadius:'50%', border:'1px solid rgba(200,85,61,0.08)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:20, left:'35%', width:120, height:120,
          borderRadius:'50%', background:C.gold, opacity:0.06, pointerEvents:'none' }}/>
        <div style={{ maxWidth:780, margin:'0 auto', position:'relative' }}>
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            <Pill color={C.terra}>Washington Heights · NYC</Pill>
            <Pill color={C.gold}>Free to attend</Pill>
            <Pill color={C.sage} style={{ animation:'pulse 2s infinite' }}>⚡ Few spots remain</Pill>
          </div>
          <h1 style={{ fontFamily:font.display, fontSize:46, fontWeight:800, color:'#fff',
            lineHeight:1.1, letterSpacing:-1, marginBottom:10 }}>
            Support local.<br/>
            <span style={{ color:C.terra }}>Build together.</span>
          </h1>
          <p style={{ fontFamily:font.body, fontSize:14, color:'rgba(255,255,255,0.45)',
            lineHeight:1.7, maxWidth:480, marginBottom:32 }}>
            A community coworking series hosted at local spots in Washington Heights.
            Work alongside your neighbors.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Btn onClick={()=>setView('register')}>Join the waitlist →</Btn>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:780, margin:'0 auto', padding:'56px 40px' }}>
        <MonthTabs active={activeMonth} onChange={setMonth}/>

        {/* Event info */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:40 }}>
          {[
            { icon:'📅', label:'Date',  val:event.date },
            { icon:'🕙', label:'Time',  val:event.time },
            { icon:'📍', label:'Venue', val:event.venue },
            { icon:'🗺',  label:'Area',  val:event.address },
          ].map((d,i)=>(
            <div key={i} style={{ background:'#fff', border:`1.5px solid ${C.border}`,
              borderRadius:14, padding:'20px 22px', display:'flex', gap:14, alignItems:'center' }}>
              <span style={{ fontSize:22 }}>{d.icon}</span>
              <div>
                <div style={{ fontFamily:font.body, fontSize:10, letterSpacing:2,
                  color:C.muted, marginBottom:3, fontWeight:600 }}>{d.label.toUpperCase()}</div>
                <div style={{ fontFamily:font.display, fontSize:15, color:C.ink, fontWeight:700 }}>{d.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Spots */}
        <div style={{ background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:16,
          padding:'28px 32px', display:'grid', gridTemplateColumns:'auto 1fr',
          gap:28, alignItems:'center', marginBottom:48 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:font.display, fontSize:56, fontWeight:800,
              color:spotsLeft>5?C.sage:C.terra, lineHeight:1 }}>{spotsLeft}</div>
            <div style={{ fontFamily:font.body, fontSize:10, letterSpacing:2,
              color:C.muted, marginTop:4, fontWeight:600 }}>SPOTS LEFT</div>
          </div>
          <div>
            <div style={{ fontFamily:font.body, fontSize:15, color:C.ink, marginBottom:12 }}>
              {regs.length} people registered for {event.month}
            </div>
            <div style={{ display:'flex' }}>
              {regs.slice(0,8).map((r,i)=>(
                <div key={i} style={{ marginRight:-6, zIndex:regs.length-i }}>
                  <Avatar name={`${r.first_name} ${r.last_name}`} size={34}/>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What to expect */}
        <h2 style={{ fontFamily:font.display, fontSize:26, color:C.ink, marginBottom:20, fontWeight:700 }}>What to expect</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:48 }}>
          {[
            { icon:'☕', title:'Shop local',       color:C.ink,      body:"Every session is at a local Heights spot. Your cup supports a neighbor's business." },
            { icon:'💻', title:'Fast WiFi',        color:C.sage,     body:'Dedicated connection for the session — come focused and stay focused.' },
            { icon:'🤝', title:'Real connections', color:C.lavender, body:'Meet freelancers, remote workers, and students who live in your neighborhood.' },
          ].map((w,i)=>(
            <div key={i} style={{ background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:14, padding:'24px 20px' }}>
              <div style={{ width:44, height:44, borderRadius:12, background:w.color+'15',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:14 }}>
                {w.icon}
              </div>
              <div style={{ fontFamily:font.display, fontSize:15, fontWeight:700, color:C.ink, marginBottom:6 }}>{w.title}</div>
              <div style={{ fontFamily:font.body, fontSize:12.5, color:C.muted, lineHeight:1.6 }}>{w.body}</div>
            </div>
          ))}
        </div>

        <div style={{ background:C.sage+'12', border:`1px solid ${C.sage}30`, borderRadius:10,
          padding:'10px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14 }}>⚡</span>
          <span style={{ fontFamily:font.body, fontSize:13, color:C.sage, fontWeight:600 }}>
            Few spots remain for {event.month} — applications reviewed in order received.
          </span>
        </div>
        <Btn onClick={()=>setView('register')} full style={{ padding:'16px', fontSize:16, borderRadius:14 }}>
          Join the waitlist →
        </Btn>
        <p style={{ textAlign:'center', fontFamily:font.body, fontSize:12, color:C.muted, marginTop:10 }}>
          Free to attend · No credit card · Ever
        </p>
      </div>
    </div>
  );

  const RegisterView = () => {
    const inp = (err) => ({
      width:'100%', padding:'12px 16px', borderRadius:10,
      border:`1.5px solid ${err?C.terra:C.border}`, fontSize:14,
      outline:'none', fontFamily:font.body, background:'#fff', color:C.ink,
    });
    if (submitted) return (
      <div style={{ maxWidth:520, margin:'80px auto', padding:'0 40px', textAlign:'center' }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:C.gold+'20',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:36, margin:'0 auto 24px' }}>📋</div>
        <Pill color={C.gold} style={{ marginBottom:16 }}>Approval pending</Pill>
        <h1 style={{ fontFamily:font.display, fontSize:30, color:C.ink, marginBottom:12, fontWeight:800 }}>
          Application received
        </h1>
        <p style={{ fontFamily:font.body, fontSize:15, color:C.muted, lineHeight:1.7, marginBottom:12 }}>
          Thanks for applying to Work Uptown. We review every application personally and will be in touch shortly.
        </p>
        <p style={{ fontFamily:font.body, fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:36 }}>
          In the meantime — follow us on Instagram <strong style={{ color:C.ink }}>@workuptown</strong> for updates on the first event.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <Btn onClick={()=>{setView('home');setSubmitted(false)}} variant="secondary">Back to home</Btn>
        </div>
      </div>
    );
    return (
      <div style={{ maxWidth:560, margin:'0 auto', padding:'48px 40px' }}>
        <button onClick={()=>setView('home')} style={{ background:'none', border:'none',
          cursor:'pointer', fontFamily:font.body, fontSize:13, color:C.muted, marginBottom:28, padding:0 }}>← Back</button>
        <Pill color={C.terra} style={{ marginBottom:16 }}>Waitlist</Pill>
        <h1 style={{ fontFamily:font.display, fontSize:30, color:C.ink, marginBottom:6, fontWeight:800 }}>
          Apply to join
        </h1>
        <p style={{ fontFamily:font.body, fontSize:13, color:C.muted, marginBottom:6 }}>
          Work Uptown is currently invite-only as we build our founding community.
        </p>
        <p style={{ fontFamily:font.body, fontSize:13, color:C.muted, marginBottom:32 }}>
          Submit your application — we review every request personally.
        </p>
        <div style={{ background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:16, padding:'32px 28px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {['firstName','lastName'].map((k,i)=>(
              <div key={k} style={{ marginBottom:4 }}>
                <label style={{ display:'block', fontFamily:font.body, fontSize:11,
                  letterSpacing:1.5, textTransform:'uppercase', color:C.muted, marginBottom:6, fontWeight:600 }}>
                  {i===0?'First name':'Last name'} <span style={{ color:C.terra }}>*</span>
                </label>
                <input value={form[k]} onChange={e=>f(k,e.target.value)} style={inp(false)}/>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:16, marginTop:12 }}>
            <label style={{ display:'block', fontFamily:font.body, fontSize:11, letterSpacing:1.5,
              textTransform:'uppercase', color:C.muted, marginBottom:6, fontWeight:600 }}>
              Email <span style={{ color:C.terra }}>*</span>
            </label>
            <input type="email" value={form.email} onChange={e=>f('email',e.target.value)} style={inp(false)}/>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontFamily:font.body, fontSize:11, letterSpacing:1.5,
              textTransform:'uppercase', color:C.muted, marginBottom:6, fontWeight:600 }}>
              What do you do? <span style={{ color:C.terra }}>*</span>
            </label>
            <select value={form.profession} onChange={e=>f('profession',e.target.value)}
              style={{ ...inp(false), cursor:'pointer', color:form.profession?C.ink:C.muted }}>
              <option value="">Select…</option>
              {PROFESSIONS.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontFamily:font.body, fontSize:11, letterSpacing:1.5,
              textTransform:'uppercase', color:C.muted, marginBottom:6, fontWeight:600 }}>
              Neighborhood <span style={{ color:C.terra }}>*</span>
            </label>
            <select value={form.neighborhood} onChange={e=>f('neighborhood',e.target.value)}
              style={{ ...inp(false), cursor:'pointer', color:form.neighborhood?C.ink:C.muted }}>
              <option value="">Select…</option>
              {HOODS.map(h=><option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontFamily:font.body, fontSize:11, letterSpacing:1.5,
              textTransform:'uppercase', color:C.muted, marginBottom:6, fontWeight:600 }}>
              How did you hear about us?
            </label>
            <input value={form.heardFrom} onChange={e=>f('heardFrom',e.target.value)}
              placeholder="Instagram, a friend, flyer…" style={inp(false)}/>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontFamily:font.body, fontSize:11, letterSpacing:1.5,
              textTransform:'uppercase', color:C.muted, marginBottom:10, fontWeight:600 }}>
              What are you interested in?
            </label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {['Intro to AI','Vibe Coding','Demo Opportunities'].map(interest => {
                const active = (form.interests||[]).includes(interest);
                return (
                  <button key={interest} type="button"
                    onClick={() => {
                      const curr = form.interests || [];
                      f('interests', active ? curr.filter(i=>i!==interest) : [...curr, interest]);
                    }}
                    style={{
                      padding:'8px 16px', borderRadius:99, fontFamily:font.body,
                      fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.15s',
                      background: active ? C.ink : 'transparent',
                      color: active ? '#fff' : C.ink,
                      border: `1.5px solid ${active ? C.ink : C.border}`,
                    }}>
                    {active && <span style={{ marginRight:6 }}>✓</span>}
                    {interest}
                  </button>
                );
              })}
            </div>
            <div style={{ fontFamily:font.body, fontSize:11, color:C.muted, marginTop:8 }}>
              Select all that apply — helps us plan future sessions.
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontFamily:font.body, fontSize:11, letterSpacing:1.5,
              textTransform:'uppercase', color:C.muted, marginBottom:6, fontWeight:600 }}>
              Why do you want to join? <span style={{ color:C.terra }}>*</span>
            </label>
            <textarea value={form.whyJoin||''} onChange={e=>f('whyJoin',e.target.value)}
              placeholder="Tell us a little about yourself and what you're working on…"
              rows={4} style={{ ...inp(false), resize:'vertical', lineHeight:1.6 }}/>
            <div style={{ fontFamily:font.body, fontSize:11, color:C.muted, marginTop:5 }}>
              This helps us build the right community. Be yourself.
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontFamily:font.body, fontSize:11, letterSpacing:1.5,
              textTransform:'uppercase', color:C.muted, marginBottom:10, fontWeight:600 }}>
              What does your ideal work week look like? <span style={{ color:C.terra }}>*</span>
            </label>
            <div style={{ fontFamily:font.body, fontSize:12, color:C.muted, marginBottom:10, lineHeight:1.5 }}>
              Which days do you typically work from home or need a space?
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => {
                const active = (form.wfhDays||[]).includes(day);
                return (
                  <button key={day} type="button"
                    onClick={() => {
                      const curr = form.wfhDays || [];
                      f('wfhDays', active ? curr.filter(d=>d!==day) : [...curr, day]);
                    }}
                    style={{
                      padding:'8px 16px', borderRadius:99, fontFamily:font.body,
                      fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.15s',
                      background: active ? C.sage : 'transparent',
                      color: active ? '#fff' : C.ink,
                      border: `1.5px solid ${active ? C.sage : C.border}`,
                    }}>
                    {active && <span style={{ marginRight:6 }}>✓</span>}
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontFamily:font.body, fontSize:11, letterSpacing:1.5,
              textTransform:'uppercase', color:C.muted, marginBottom:6, fontWeight:600 }}>
              What do you want your life to look like? <span style={{ color:C.terra }}>*</span>
            </label>
            <textarea value={form.lifeVision||''} onChange={e=>f('lifeVision',e.target.value)}
              placeholder="Where are you headed? What are you building toward? Dream big."
              rows={4} style={{ ...inp(false), resize:'vertical', lineHeight:1.6 }}/>
            <div style={{ fontFamily:font.body, fontSize:11, color:C.muted, marginTop:5 }}>
              This is how we curate the room. We read every answer.
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontFamily:font.body, fontSize:11, letterSpacing:1.5,
              textTransform:'uppercase', color:C.muted, marginBottom:6, fontWeight:600 }}>
              Founding Circle invite code
            </label>
            <input value={form.inviteCode||''} onChange={e=>f('inviteCode',e.target.value.toUpperCase())}
              placeholder="e.g. QUELOTECH-01" style={{ ...inp(false), fontFamily:'monospace', letterSpacing:1 }}/>
            <div style={{ fontFamily:font.body, fontSize:11, color:C.muted, marginTop:5 }}>
              Have an invite code from a community partner? Enter it here.
            </div>
          </div>
          <div style={{ background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:12,
            padding:'16px 18px', marginBottom:24, display:'flex', gap:14,
            alignItems:'flex-start', cursor:'pointer' }}
            onClick={()=>f('memberInterest',!form.memberInterest)}>
            <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, marginTop:1,
              border:`2px solid ${form.memberInterest?C.sage:C.border}`,
              background:form.memberInterest?C.sage:'transparent',
              display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
              {form.memberInterest && <span style={{ color:'#fff', fontSize:12 }}>✓</span>}
            </div>
            <div>
              <div style={{ fontFamily:font.body, fontSize:13, fontWeight:600, color:C.ink, marginBottom:3 }}>
                I'm interested in a permanent membership
              </div>
              <div style={{ fontFamily:font.body, fontSize:12, color:C.muted, lineHeight:1.5 }}>
                When Work Uptown opens a dedicated space, add me to the founding members list.
              </div>
            </div>
          </div>
          <p style={{ fontFamily:font.body, fontSize:11, color:C.muted, marginBottom:20 }}>
            Your email will never be shared. Ever.
          </p>
          {submitErr && <div style={{ background:'#FEE2E2', borderRadius:8, padding:'10px 14px',
            fontFamily:font.body, fontSize:13, color:'#DC2626', marginBottom:16 }}>{submitErr}</div>}
          <Btn onClick={async()=>{
            if(!form.firstName||!form.lastName||!form.email||!form.profession||!form.neighborhood||!form.whyJoin||!form.lifeVision||!(form.wfhDays||[]).length){setSubErr('Please fill in all required fields.');return;}
            setSub(true);setSubErr('');
            try{
              const isDupe = await checkDuplicateEmail(form.email, activeMonth);
              if(isDupe){setSubErr("You've already applied for this month!");setSub(false);return;}
              const saved = await addRegistration({
                month_key:activeMonth, first_name:form.firstName, last_name:form.lastName,
                email:form.email, profession:form.profession, neighborhood:form.neighborhood,
                heard_from:form.heardFrom, member_interest:form.memberInterest,
                why_join:form.whyJoin, life_vision:form.lifeVision,
                wfh_days:(form.wfhDays||[]).join(', '),
                invite_code:form.inviteCode,
                interests:(form.interests||[]).join(', ')
              });
              setRegs(p=>[...p,saved]);
              setForm({firstName:'',lastName:'',email:'',profession:'',neighborhood:'',heardFrom:'',whyJoin:'',lifeVision:'',wfhDays:[],inviteCode:'',memberInterest:false,interests:[]});
              setSubmitted(true);
            }catch(err){setSubErr('Something went wrong. Please try again.')}
            setSub(false);
          }} disabled={submitting} full style={{ padding:'14px', fontSize:15, borderRadius:12 }}>
            Submit application →
          </Btn>
        </div>
      </div>
    );
  };

  const DirectoryView = () => (
    <div style={{ maxWidth:780, margin:'0 auto', padding:'48px 40px' }}>
      <Pill color={C.sage} style={{ marginBottom:14 }}>Community</Pill>
      <h1 style={{ fontFamily:font.display, fontSize:34, color:C.ink, marginBottom:6, fontWeight:800 }}>Who's coming</h1>
      <p style={{ fontFamily:font.body, fontSize:14, color:C.muted, marginBottom:32 }}>The community forming around Work Uptown.</p>
      <MonthTabs active={activeMonth} onChange={setMonth}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontFamily:font.body, fontSize:14, color:C.muted }}>
          <strong style={{ color:C.ink }}>{regs.length}</strong> registered · {spotsLeft} spots left
        </div>
        <Btn onClick={()=>setView('register')} style={{ padding:'8px 20px', fontSize:13 }}>Join them →</Btn>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {regs.map((r,i)=>(
          <div key={i} style={{ background:'#fff', border:`1.5px solid ${C.border}`,
            borderRadius:14, padding:'16px 18px', display:'flex', gap:14, alignItems:'center' }}>
            <Avatar name={`${r.first_name} ${r.last_name}`}/>
            <div style={{ overflow:'hidden', flex:1 }}>
              <div style={{ fontFamily:font.display, fontSize:15, fontWeight:700, color:C.ink,
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {r.first_name} {r.last_name[0]}.
              </div>
              <div style={{ fontFamily:font.body, fontSize:12, color:C.neutral, marginTop:2 }}>{r.profession}</div>
              <div style={{ fontFamily:font.body, fontSize:11, color:C.muted, marginTop:2 }}>{r.neighborhood}</div>
            </div>
            {r.member_interest && <Pill color={C.sage} style={{ flexShrink:0, fontSize:9 }}>MEMBER</Pill>}
          </div>
        ))}
      </div>
    </div>
  );



  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:font.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        button { cursor:pointer; }
        select, input { font-family:'DM Sans',sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>
      <Nav/>
      {view==='home'      && <HomeView/>}
      {view==='register'  && <RegisterView/>}
      {view==='directory' && <DirectoryView/>}
      {view==='admin'     && <AdminView/>}
      <footer style={{ background:C.ink, padding:'32px 40px', textAlign:'center', marginTop:60 }}>
        <Logo dark={true}/>
        <p style={{ fontFamily:font.body, fontSize:12, color:'rgba(255,255,255,0.25)', marginTop:16 }}>
          Support local. Build together. · Washington Heights, NYC
        </p>
      </footer>
    </div>
  );
}
