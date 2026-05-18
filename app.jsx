import { useState, useEffect, useRef } from 'react'
import { getRegistrations, addRegistration, checkDuplicateEmail } from './supabase'

const C = {
  bg:     '#F5EDE8',
  white:  '#FFFFFF',
  ink:    '#1A1208',
  inkMid: '#3D2E1E',
  muted:  '#8C7B6B',
  neutral:'#5A4A3A',
  border: 'rgba(26,18,8,0.08)',
  terra:  '#C8553D',
  gold:   '#C8912A',
  sage:   '#2A6049',
  lav:    '#7C6FCD',
  teal:   '#06D6A0',
}
const font = {
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'DM Sans', system-ui, sans-serif",
}

const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'workuptown2025'

// ── Your neighborhood photos ──────────────────────────────────────────────
// Upload these to Cloudflare Images and replace URLs
// For now using relative paths — copy photo files to /public/photos/
const PHOTOS = {
  hero:     '/photos/wu-hero-gwb.jpg',
  barge:    '/photos/wu-barge.jpg',
  cloisters:'/photos/wu-cloisters.jpg',
  baseball: '/photos/wu-baseball.jpg',
  cafe:     '/photos/wu-cafe.jpg',
  azaleas:  '/photos/wu-azaleas.jpg',
  palisades:'/photos/wu-palisades.jpg',
}

const CAROUSEL = [
  { src: PHOTOS.hero,      label: 'George Washington Bridge', sub: 'Washington Heights, NYC' },
  { src: PHOTOS.barge,     label: 'Hudson River',             sub: 'Golden hour, WaHi' },
  { src: PHOTOS.baseball,  label: 'Inwood Hill Park',         sub: 'Henry Hudson bridge' },
  { src: PHOTOS.cloisters, label: 'Fort Tryon Park',          sub: 'The Cloisters' },
  { src: PHOTOS.cafe,      label: 'Inwood Farm',              sub: 'One of the faves' },
  { src: PHOTOS.azaleas,   label: 'WaHi in bloom',            sub: 'Spring in the Heights' },
  { src: PHOTOS.palisades, label: 'Hudson River Palisades',   sub: 'View from the Heights' },
]

const EVENTS = {
  '2025-06': { month:'June',   date:'Tue, Jun 17', time:'10AM – 2PM', venue:'Café Buunni',   address:'Inwood', spots:25 },
  '2025-07': { month:'July',   date:'Tue, Jul 15', time:'10AM – 2PM', venue:'TBD',           address:'Washington Heights', spots:25 },
  '2025-08': { month:'August', date:'Tue, Aug 19', time:'10AM – 2PM', venue:'The Bonnefont', address:'Fort Tryon Park', spots:25 },
}
const MONTHS     = Object.keys(EVENTS)
const PROFESSIONS= ['Freelancer / Consultant','Remote Employee','Student','Entrepreneur / Founder','Creative (Design, Art, Music)','Healthcare / Medical','Tech / Engineering','Education','Non-profit / Community','Other']
const HOODS      = ['Washington Heights','Inwood','Hamilton Heights','Harlem','Morningside Heights','Fordham / Bronx','Upper West Side','Other']
const DAYS       = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const INTERESTS  = ['Intro to AI','Vibe Coding','Demo Opportunities']
const PARTNERS   = ['Quelotech','Mami Chula Social Club','Pasaporte NYC','Dyckman Run Club','Latinas in Tech','Baddies in Tech','Corporate Pero Latinos','Techqueria']
const AVG_COLORS = ['#C8553D','#2A6049','#C8912A','#7C6FCD','#2563EB']

function Avatar({ name, size=38 }) {
  const i = (name||'').charCodeAt(0) % AVG_COLORS.length
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:AVG_COLORS[i],
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      color:'#fff', fontFamily:font.sans, fontSize:size*0.34, fontWeight:700 }}>
      {(name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
    </div>
  )
}

export default function App() {
  const [view, setView] = useState(() => {
    const p = window.location.pathname
    if (p==='/apply'||p==='/apply/') return 'apply'
    return 'home'
  })
  const [activeMonth, setActiveMonth] = useState(MONTHS[0])
  const [regs, setRegs]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [adminOk, setAdminOk]         = useState(false)
  const [adminPw, setAdminPw]         = useState('')
  const [adminErr, setAdminErr]       = useState(false)
  const [adminTab, setAdminTab]       = useState('applications')
  const [dayFilter, setDayFilter]     = useState('all')
  const [curated, setCurated]         = useState([])
  const [quickEmail, setQuickEmail]   = useState('')
  const [carouselIdx, setCarouselIdx] = useState(0)

  // Apply form state at App level — Rules of Hooks
  const [form, setForm] = useState({
    firstName:'', lastName:'', email:'', profession:'', neighborhood:'',
    heardFrom:'', whyJoin:'', lifeVision:'', wfhDays:[], inviteCode:'',
    memberInterest:false, interests:[],
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSub]      = useState(false)
  const [submitErr, setSubErr]    = useState('')
  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  useEffect(() => {
    setLoading(true)
    getRegistrations(activeMonth).then(d => { setRegs(d||[]); setLoading(false) })
  }, [activeMonth])

  // Auto advance carousel
  useEffect(() => {
    const t = setInterval(() => setCarouselIdx(p => (p+1) % CAROUSEL.length), 5000)
    return () => clearInterval(t)
  }, [])

  const event     = EVENTS[activeMonth]
  const spotsLeft = Math.max(0, event.spots - regs.length)

  // ── NAV ───────────────────────────────────────────────────────────────
  const Nav = () => (
    <div style={{ padding:'14px 16px 8px', position:'sticky', top:0, zIndex:100 }}>
      <div style={{ background:'rgba(245,237,232,0.92)', backdropFilter:'blur(20px)',
        borderRadius:99, padding:'10px 10px 10px 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        boxShadow:'0 2px 24px rgba(26,18,8,0.08),0 0 0 1px rgba(26,18,8,0.05)' }}>
        <button onClick={()=>setView('home')} style={{ background:'none', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', gap:10, padding:0 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:C.ink, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:font.serif, fontSize:15, fontWeight:700, color:'#fff' }}>W</span>
          </div>
          <span style={{ fontFamily:font.sans, fontSize:16, fontWeight:600, color:C.ink }}>Work Uptown</span>
        </button>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <button onClick={()=>setView('admin')} style={{ background:'none', border:'none',
            fontFamily:font.sans, fontSize:13, color:C.muted, cursor:'pointer', padding:'8px 12px' }}>Admin</button>
          <button onClick={()=>setView('apply')} style={{ background:C.ink, color:'#fff',
            border:'none', borderRadius:99, padding:'11px 22px',
            fontFamily:font.sans, fontSize:14, fontWeight:600, cursor:'pointer' }}>
            Join waitlist
          </button>
        </div>
      </div>
    </div>
  )

  // ── HOME ──────────────────────────────────────────────────────────────
  const HomeView = () => (
    <div>

      {/* ── HERO — Full bleed photo with mega text ── */}
      <div style={{ position:'relative', height:'90vh', minHeight:600, overflow:'hidden' }}>
        {/* Photo */}
        <img src={PHOTOS.hero} alt="Washington Heights"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%',
            objectFit:'cover', objectPosition:'center' }}/>

        {/* Deep gradient overlay */}
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 40%, rgba(8,5,2,0.92) 100%)' }}/>

        {/* Left accent bars */}
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:8, background:C.gold, zIndex:2 }}/>
        <div style={{ position:'absolute', left:8, top:0, bottom:0, width:4, background:C.terra, zIndex:2 }}/>

        {/* Top location pill */}
        <div style={{ position:'absolute', top:20, left:24, right:24,
          background:'rgba(255,255,255,0.12)', backdropFilter:'blur(12px)',
          borderRadius:99, padding:'10px 20px', border:'1px solid rgba(255,255,255,0.2)',
          display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:2 }}>
          <span style={{ fontFamily:font.sans, fontSize:13, color:'rgba(255,255,255,0.9)', fontWeight:500 }}>
            📍 Washington Heights & Inwood, NYC
          </span>
          <span style={{ fontFamily:font.sans, fontSize:13, color:C.gold, fontWeight:600 }}>
            ✨ Free to attend
          </span>
        </div>

        {/* WU Badge */}
        <div style={{ position:'absolute', top:80, right:24, zIndex:2 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(15,10,4,0.9)',
            border:`2px solid ${C.terra}`, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:font.serif, fontSize:20, fontWeight:700,
              fontStyle:'italic', color:C.gold, lineHeight:1 }}>WU</span>
            <span style={{ fontFamily:font.sans, fontSize:7, color:'rgba(255,255,255,0.4)',
              letterSpacing:1.5, marginTop:2 }}>2026</span>
          </div>
        </div>

        {/* MEGA TEXT — bottom, left to right */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 24px 32px', zIndex:2 }}>
          {/* Social proof */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ display:'flex' }}>
              {AVG_COLORS.slice(0,4).map((c,i)=>(
                <div key={i} style={{ width:32, height:32, borderRadius:'50%', background:c,
                  border:'2px solid rgba(255,255,255,0.3)', marginLeft:i>0?-10:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:font.sans, fontSize:11, fontWeight:700, color:'#fff' }}>
                  {['M','J','A','C'][i]}
                </div>
              ))}
            </div>
            <span style={{ fontFamily:font.sans, fontSize:13, color:'rgba(255,255,255,0.7)' }}>
              Founding community forming
            </span>
          </div>

          {/* THE MEGA HEADLINE */}
          <h1 style={{ fontFamily:font.serif, fontSize:'clamp(52px, 12vw, 96px)',
            fontWeight:900, color:'#FFFFFF', lineHeight:1.0,
            letterSpacing:'-3px', margin:0, marginBottom:6,
            textShadow:'0 4px 24px rgba(0,0,0,0.5)' }}>
            Support local.
          </h1>

          {/* Color divider */}
          <div style={{ display:'flex', gap:4, marginBottom:6 }}>
            <div style={{ height:4, width:120, borderRadius:2, background:C.terra }}/>
            <div style={{ height:4, width:80, borderRadius:2, background:C.gold }}/>
            <div style={{ height:4, width:50, borderRadius:2, background:C.teal }}/>
          </div>

          <h1 style={{ fontFamily:font.serif, fontSize:'clamp(52px, 12vw, 96px)',
            fontWeight:900, color:C.gold, lineHeight:1.0,
            letterSpacing:'-3px', margin:0, marginBottom:20,
            fontStyle:'italic', textShadow:'0 4px 24px rgba(0,0,0,0.4)' }}>
            Build together.
          </h1>

          {/* Sub + CTA row */}
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <button onClick={()=>setView('apply')} style={{ background:C.ink, color:'#fff',
              border:'none', borderRadius:99, padding:'14px 32px', flexShrink:0,
              fontFamily:font.sans, fontSize:15, fontWeight:600, cursor:'pointer',
              boxShadow:'0 4px 20px rgba(0,0,0,0.3)', border:`1px solid ${C.terra}` }}>
              Join the waitlist →
            </button>
            <span style={{ fontFamily:font.sans, fontSize:13, color:'rgba(255,255,255,0.55)',
              lineHeight:1.5 }}>
              A curated coworking series · WaHi & Inwood · AI education built in
            </span>
          </div>
        </div>
      </div>

      {/* ── PHOTO CAROUSEL ── */}
      <div style={{ background:C.ink, padding:'32px 0' }}>
        <div style={{ padding:'0 20px', marginBottom:20 }}>
          <div style={{ fontFamily:font.sans, fontSize:11, fontWeight:700, color:C.terra,
            letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>The neighborhood</div>
          <h2 style={{ fontFamily:font.serif, fontSize:28, fontWeight:800, color:'#fff',
            lineHeight:1.1, letterSpacing:-1 }}>
            Brick walls, bridge views,<br/>
            <em style={{ color:C.gold }}>and the people who make it.</em>
          </h2>
        </div>

        {/* Main carousel image */}
        <div style={{ position:'relative', height:320, overflow:'hidden', cursor:'pointer' }}
          onClick={()=>setCarouselIdx(p=>(p+1)%CAROUSEL.length)}>
          {CAROUSEL.map((photo, i) => (
            <img key={i} src={photo.src} alt={photo.label}
              style={{ position:'absolute', inset:0, width:'100%', height:'100%',
                objectFit:'cover', objectPosition:'center',
                opacity: i===carouselIdx ? 1 : 0,
                transition:'opacity 0.8s ease' }}/>
          ))}
          {/* Bottom overlay */}
          <div style={{ position:'absolute', inset:0,
            background:'linear-gradient(to bottom, transparent 50%, rgba(10,6,3,0.7) 100%)' }}/>
          <div style={{ position:'absolute', bottom:16, left:20, right:20,
            display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <div>
              <div style={{ fontFamily:font.serif, fontSize:18, fontWeight:700, color:'#fff' }}>
                {CAROUSEL[carouselIdx].label}
              </div>
              <div style={{ fontFamily:font.sans, fontSize:12, color:'rgba(255,255,255,0.6)' }}>
                {CAROUSEL[carouselIdx].sub}
              </div>
            </div>
            <div style={{ fontFamily:font.sans, fontSize:12, color:'rgba(255,255,255,0.4)' }}>
              Tap for next →
            </div>
          </div>
        </div>

        {/* Dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:16 }}>
          {CAROUSEL.map((_,i)=>(
            <div key={i} onClick={()=>setCarouselIdx(i)} style={{ cursor:'pointer',
              width: i===carouselIdx ? 24 : 8, height:8, borderRadius:4,
              background: i===carouselIdx ? C.terra : 'rgba(255,255,255,0.2)',
              transition:'all 0.3s' }}/>
          ))}
        </div>

        {/* Thumbnail strip */}
        <div style={{ display:'flex', gap:8, padding:'16px 20px 0', overflowX:'auto' }}>
          {CAROUSEL.map((photo, i) => (
            <div key={i} onClick={()=>setCarouselIdx(i)} style={{ flexShrink:0, cursor:'pointer',
              width:80, height:60, borderRadius:10, overflow:'hidden',
              border: i===carouselIdx ? `2px solid ${C.terra}` : '2px solid transparent',
              transition:'border 0.2s', opacity: i===carouselIdx ? 1 : 0.55 }}>
              <img src={photo.src} alt={photo.label}
                style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            </div>
          ))}
        </div>
      </div>

      {/* ── ABOUT ── */}
      <div style={{ padding:'40px 20px 36px', background:C.bg }}>
        <div style={{ fontFamily:font.sans, fontSize:11, fontWeight:700, color:C.terra,
          letterSpacing:2, textTransform:'uppercase', marginBottom:14 }}>Why Work Uptown</div>
        <p style={{ fontFamily:font.serif, fontSize:22, fontStyle:'italic', color:C.ink,
          lineHeight:1.65, marginBottom:16 }}>
          "I grew up in Washington Heights, left, and came back with different eyes — a background in tech, business development, and AI, and one burning question: who is going to help this neighborhood navigate what's coming?"
        </p>
        <p style={{ fontFamily:font.sans, fontSize:15, color:C.muted, lineHeight:1.7 }}>
          Work Uptown is a curated coworking series hosted at local spots in WaHi & Inwood — with AI education built in for the people who actually live here.
        </p>
      </div>

      {/* ── WHAT HAPPENS ── */}
      <div style={{ padding:'0 20px 36px', background:C.bg }}>
        <div style={{ fontFamily:font.sans, fontSize:11, fontWeight:700, color:C.terra,
          letterSpacing:2, textTransform:'uppercase', marginBottom:14 }}>What happens here</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            ['01','💻','Work alongside your neighbors','Remote workers · Freelancers · Founders · Students',C.sage],
            ['02','🧠','Learn AI tooling & building','Intro to AI · Vibe Coding · Demo Opportunities — taught personally',C.lav],
            ['03','☕','Support the neighborhood','Every session at a local WaHi & Inwood spot',C.terra],
          ].map(([num,icon,title,sub,color])=>(
            <div key={num} style={{ background:'rgba(255,255,255,0.7)', borderRadius:18,
              padding:'18px 20px', display:'flex', gap:14, alignItems:'center',
              border:`1px solid ${C.border}` }}>
              <div style={{ width:48, height:48, borderRadius:14, background:color+'18',
                border:`1.5px solid ${color}30`, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:22, flexShrink:0 }}>{icon}</div>
              <div>
                <div style={{ fontFamily:font.serif, fontSize:16, fontWeight:700,
                  color:C.ink, marginBottom:3 }}>{title}</div>
                <div style={{ fontFamily:font.sans, fontSize:13, color:C.muted }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SESSIONS ── */}
      <div style={{ padding:'0 20px 36px', background:C.bg }}>
        <div style={{ fontFamily:font.sans, fontSize:11, fontWeight:700, color:C.terra,
          letterSpacing:2, textTransform:'uppercase', marginBottom:14 }}>Upcoming sessions</div>
        <h2 style={{ fontFamily:font.serif, fontSize:32, fontWeight:900, color:C.ink,
          lineHeight:1.08, letterSpacing:-1, marginBottom:20 }}>
          Three Tuesdays.<br/>One beautiful neighborhood.
        </h2>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {MONTHS.map((mk,i)=>{
            const ev = EVENTS[mk]
            const evSpots = i===0 ? spotsLeft : ev.spots
            const grads = [
              'linear-gradient(160deg,#3D2E1E,#8B4513,#C8553D)',
              'linear-gradient(160deg,#1E3A2F,#2A6049,#C8912A)',
              'linear-gradient(160deg,#1A1208,#3D2E1E,#7C6FCD)',
            ]
            return (
              <div key={mk}>
                <div onClick={()=>setView('apply')} style={{ borderRadius:22, overflow:'hidden',
                  position:'relative', height:220, cursor:'pointer', background:grads[i] }}>
                  <div style={{ position:'absolute', inset:0,
                    background:'linear-gradient(to bottom,rgba(0,0,0,0.05) 30%,rgba(0,0,0,0.65) 100%)' }}/>
                  {i===0&&regs.length>0&&(
                    <div style={{ position:'absolute', top:14, left:14,
                      background:'rgba(255,255,255,0.92)', borderRadius:99, padding:'6px 14px',
                      fontFamily:font.sans, fontSize:13, fontWeight:600, color:C.ink }}>
                      ⚡ Few spots
                    </div>
                  )}
                  <div style={{ position:'absolute', bottom:14, left:16, right:14,
                    display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                    <div style={{ fontFamily:font.serif, fontSize:44, fontWeight:900,
                      color:'#fff', lineHeight:1 }}>{ev.month}</div>
                    <div style={{ background:C.terra, borderRadius:99, padding:'9px 18px',
                      fontFamily:font.sans, fontSize:14, fontWeight:700, color:'#fff' }}>
                      {evSpots} spots
                    </div>
                  </div>
                </div>
                {i===0&&(
                  <div style={{ background:'#fff', borderRadius:18, padding:'18px 20px', marginTop:8,
                    boxShadow:'0 4px 20px rgba(26,18,8,0.07)', border:`1px solid ${C.border}` }}>
                    <div style={{ fontFamily:font.sans, fontSize:16, fontWeight:700,
                      color:C.ink, marginBottom:10 }}>{ev.venue}</div>
                    {[['📅',ev.date],['🕙',ev.time],['📍',ev.address]].map(([ic,val])=>(
                      <div key={val} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
                        <span>{ic}</span>
                        <span style={{ fontFamily:font.sans, fontSize:14, color:C.muted }}>{val}</span>
                      </div>
                    ))}
                    <button onClick={()=>setView('apply')} style={{ marginTop:14, width:'100%',
                      background:C.terra, color:'#fff', border:'none', borderRadius:99,
                      padding:'13px', fontFamily:font.sans, fontSize:15, fontWeight:600,
                      cursor:'pointer' }}>
                      Apply for this session →
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── COMMUNITY PARTNERS ── */}
      <div style={{ padding:'0 20px 36px', background:C.bg }}>
        <div style={{ fontFamily:font.sans, fontSize:11, fontWeight:700, color:C.terra,
          letterSpacing:2, textTransform:'uppercase', marginBottom:14 }}>Community partners</div>
        <div style={{ background:'rgba(255,255,255,0.65)', borderRadius:20, padding:'22px 20px',
          border:`1px solid ${C.border}` }}>
          <p style={{ fontFamily:font.serif, fontSize:19, fontStyle:'italic', color:C.ink,
            lineHeight:1.55, marginBottom:18 }}>
            "Built with the people who already show up for this neighborhood."
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {PARTNERS.map(org=>(
              <div key={org} style={{ background:C.ink, borderRadius:99, padding:'7px 16px',
                fontFamily:font.sans, fontSize:12, fontWeight:500,
                color:'rgba(255,255,255,0.75)' }}>{org}</div>
            ))}
            <div style={{ background:C.terra+'15', borderRadius:99, padding:'7px 16px',
              fontFamily:font.sans, fontSize:12, fontWeight:600, color:C.terra,
              border:`1px solid ${C.terra}25` }}>+ more</div>
          </div>
        </div>
      </div>

      {/* ── FOUNDING CIRCLE ── */}
      <div style={{ padding:'0 20px 36px', background:C.bg }}>
        <div style={{ borderRadius:22, background:C.gold,
          backgroundImage:'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18) 0%, transparent 50%)',
          padding:'30px 24px' }}>
          <div style={{ fontFamily:font.sans, fontSize:11, fontWeight:700,
            color:'rgba(26,18,8,0.5)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>
            ⭐ Founding Circle
          </div>
          <h3 style={{ fontFamily:font.serif, fontSize:30, fontWeight:900, color:C.ink,
            marginBottom:10, lineHeight:1.15 }}>Lock in your spot forever.</h3>
          <p style={{ fontFamily:font.sans, fontSize:14, color:'rgba(26,18,8,0.6)',
            lineHeight:1.65, marginBottom:20 }}>
            A select group shaping what Work Uptown becomes. Apply before the founding circle closes.
          </p>
          <button onClick={()=>setView('apply')} style={{ background:C.ink, color:'#fff',
            border:'none', borderRadius:99, padding:'14px 28px', width:'100%',
            fontFamily:font.sans, fontSize:15, fontWeight:600, cursor:'pointer' }}>
            Apply to founding circle →
          </button>
        </div>
      </div>

      {/* ── WAITLIST CTA ── */}
      <div style={{ padding:'0 20px 60px', background:C.bg }}>
        <div style={{ background:C.ink, borderRadius:26, padding:'38px 26px',
          backgroundImage:'radial-gradient(circle at 85% 15%, rgba(200,85,61,0.25) 0%, transparent 55%)' }}>
          <div style={{ fontFamily:font.sans, fontSize:13, fontWeight:600,
            color:C.terra, marginBottom:14 }}>Join the waitlist</div>
          <h2 style={{ fontFamily:font.serif, fontSize:32, fontWeight:900, color:'#fff',
            lineHeight:1.1, marginBottom:12 }}>
            Save your seat for<br/>the next session.
          </h2>
          <p style={{ fontFamily:font.sans, fontSize:14, color:'rgba(255,255,255,0.45)',
            lineHeight:1.7, marginBottom:26 }}>
            We'll reach out personally. No spam, no upsells, ever.
          </p>
          <div style={{ display:'flex', background:'rgba(255,255,255,0.07)', borderRadius:99,
            padding:'6px 6px 6px 22px', marginBottom:14,
            border:'1px solid rgba(255,255,255,0.08)' }}>
            <input value={quickEmail} onChange={e=>setQuickEmail(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&quickEmail&&setView('apply')}
              placeholder="you@neighbor.nyc" type="email"
              style={{ flex:1, background:'transparent', border:'none', outline:'none',
                fontFamily:font.sans, fontSize:15, color:'#fff' }}/>
            <button onClick={()=>quickEmail&&setView('apply')} style={{ background:C.terra,
              color:'#fff', border:'none', borderRadius:99, padding:'12px 22px',
              fontFamily:font.sans, fontSize:14, fontWeight:600, cursor:'pointer' }}>
              Join →
            </button>
          </div>
          <div style={{ fontFamily:font.sans, fontSize:12, color:'rgba(255,255,255,0.25)',
            textAlign:'center' }}>
            Free to attend · No credit card · Ever
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'20px 20px 40px', borderTop:`1px solid ${C.border}`, background:C.bg,
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:font.serif, fontSize:18, fontWeight:700, color:C.ink }}>
            Work <em style={{ color:C.terra }}>Uptown</em>
          </div>
          <div style={{ fontFamily:font.sans, fontSize:12, color:C.muted, marginTop:2 }}>
            Washington Heights & Inwood, NYC · 2026
          </div>
        </div>
        <div style={{ fontFamily:font.sans, fontSize:12, color:C.muted }}>@workuptown</div>
      </div>
    </div>
  )

  // ── APPLY ─────────────────────────────────────────────────────────────
  const ApplyView = () => {
    const inp = { width:'100%', padding:'12px 16px', borderRadius:12,
      border:`1.5px solid ${C.border}`, fontSize:14, outline:'none',
      fontFamily:font.sans, background:C.white, color:C.ink }

    const submit = async () => {
      if(!form.firstName||!form.lastName||!form.email||!form.profession||
         !form.neighborhood||!form.whyJoin||!form.lifeVision||!form.wfhDays.length){
        setSubErr('Please fill in all required fields.'); return
      }
      setSub(true); setSubErr('')
      try {
        const isDupe = await checkDuplicateEmail(form.email, activeMonth)
        if(isDupe){ setSubErr("You've already applied for this month!"); setSub(false); return }
        const saved = await addRegistration({
          month_key:activeMonth, first_name:form.firstName, last_name:form.lastName,
          email:form.email, profession:form.profession, neighborhood:form.neighborhood,
          heard_from:form.heardFrom, member_interest:form.memberInterest,
          why_join:form.whyJoin, life_vision:form.lifeVision,
          wfh_days:form.wfhDays.join(', '), invite_code:form.inviteCode,
          interests:form.interests.join(', ')
        })
        setRegs(p=>[...p,saved])
        setSubmitted(true)
        setForm({ firstName:'', lastName:'', email:'', profession:'', neighborhood:'',
          heardFrom:'', whyJoin:'', lifeVision:'', wfhDays:[], inviteCode:'',
          memberInterest:false, interests:[] })
      } catch{ setSubErr('Something went wrong. Please try again.') }
      setSub(false)
    }

    if(submitted) return (
      <div style={{ padding:'60px 24px', textAlign:'center', maxWidth:480, margin:'0 auto' }}>
        <div style={{ fontSize:48, marginBottom:20 }}>📋</div>
        <div style={{ display:'inline-block', background:C.gold+'20', color:C.gold,
          borderRadius:99, padding:'4px 16px', fontFamily:font.sans, fontSize:12,
          fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:16 }}>
          Approval pending
        </div>
        <h1 style={{ fontFamily:font.serif, fontSize:30, fontWeight:900, color:C.ink,
          marginBottom:12, lineHeight:1.15 }}>Application received</h1>
        <p style={{ fontFamily:font.sans, fontSize:15, color:C.muted, lineHeight:1.7,
          marginBottom:10 }}>
          Thanks for applying. We review every application personally.
        </p>
        <p style={{ fontFamily:font.sans, fontSize:14, color:C.muted, lineHeight:1.7,
          marginBottom:32 }}>
          Follow <strong style={{ color:C.ink }}>@workuptown</strong> for updates.
        </p>
        <button onClick={()=>setView('home')} style={{ background:C.ink, color:'#fff',
          border:'none', borderRadius:99, padding:'13px 28px',
          fontFamily:font.sans, fontSize:15, fontWeight:600, cursor:'pointer' }}>
          Back to home
        </button>
      </div>
    )

    const Label = ({ children, req, sub }) => (
      <div style={{ marginBottom:8 }}>
        <div style={{ fontFamily:font.sans, fontSize:11, fontWeight:700,
          letterSpacing:1.5, textTransform:'uppercase', color:C.muted }}>
          {children}{req&&<span style={{ color:C.terra }}> *</span>}
        </div>
        {sub&&<div style={{ fontFamily:font.sans, fontSize:12, color:C.muted, marginTop:3 }}>{sub}</div>}
      </div>
    )

    return (
      <div style={{ padding:'16px 20px 80px', maxWidth:540, margin:'0 auto' }}>
        <button onClick={()=>setView('home')} style={{ background:'none', border:'none',
          fontFamily:font.sans, fontSize:14, color:C.muted, cursor:'pointer',
          marginBottom:24, padding:0 }}>← Back</button>

        <div style={{ fontFamily:font.sans, fontSize:11, fontWeight:700, color:C.terra,
          letterSpacing:2, textTransform:'uppercase', marginBottom:14 }}>Apply to join</div>
        <h1 style={{ fontFamily:font.serif, fontSize:36, fontWeight:900, color:C.ink,
          marginBottom:8, lineHeight:1.1 }}>
          Work Uptown is<br/><em style={{ color:C.terra }}>invite-only</em> for now.
        </h1>
        <p style={{ fontFamily:font.sans, fontSize:14, color:C.muted, marginBottom:28,
          lineHeight:1.65 }}>
          We're building our founding community with intention. We read every answer personally.
        </p>

        <div style={{ background:'#fff', borderRadius:22, padding:'28px 22px',
          border:`1px solid ${C.border}`, boxShadow:'0 4px 24px rgba(26,18,8,0.07)' }}>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            {['firstName','lastName'].map((k,i)=>(
              <div key={k}>
                <Label req>{i===0?'First name':'Last name'}</Label>
                <input value={form[k]} onChange={e=>f(k,e.target.value)} style={inp}/>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:16 }}>
            <Label req>Email address</Label>
            <input type="email" value={form.email} onChange={e=>f('email',e.target.value)} style={inp}/>
          </div>

          <div style={{ marginBottom:16 }}>
            <Label req>What do you do?</Label>
            <select value={form.profession} onChange={e=>f('profession',e.target.value)}
              style={{ ...inp, cursor:'pointer', color:form.profession?C.ink:C.muted }}>
              <option value="">Select…</option>
              {PROFESSIONS.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ marginBottom:16 }}>
            <Label req>Your neighborhood</Label>
            <select value={form.neighborhood} onChange={e=>f('neighborhood',e.target.value)}
              style={{ ...inp, cursor:'pointer', color:form.neighborhood?C.ink:C.muted }}>
              <option value="">Select…</option>
              {HOODS.map(h=><option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div style={{ marginBottom:16 }}>
            <Label>How did you hear about us?</Label>
            <input value={form.heardFrom} onChange={e=>f('heardFrom',e.target.value)}
              placeholder="Instagram, a friend, community partner…" style={inp}/>
          </div>

          <div style={{ marginBottom:20 }}>
            <Label sub="Helps us plan future programming">What are you interested in?</Label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {INTERESTS.map(interest=>{
                const active=form.interests.includes(interest)
                return (
                  <button key={interest} type="button"
                    onClick={()=>f('interests',active?form.interests.filter(i=>i!==interest):[...form.interests,interest])}
                    style={{ padding:'8px 16px', borderRadius:99, fontFamily:font.sans,
                      fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.15s',
                      background:active?C.ink:'transparent', color:active?'#fff':C.ink,
                      border:`1.5px solid ${active?C.ink:C.border}` }}>
                    {active&&'✓ '}{interest}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <Label req sub="Which days do you typically need a workspace?">
              Preferred WFH days
            </Label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {DAYS.map(day=>{
                const active=form.wfhDays.includes(day)
                return (
                  <button key={day} type="button"
                    onClick={()=>f('wfhDays',active?form.wfhDays.filter(d=>d!==day):[...form.wfhDays,day])}
                    style={{ padding:'8px 16px', borderRadius:99, fontFamily:font.sans,
                      fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.15s',
                      background:active?C.sage:'transparent', color:active?'#fff':C.ink,
                      border:`1.5px solid ${active?C.sage:C.border}` }}>
                    {active&&'✓ '}{day}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <Label req>Why do you want to join?</Label>
            <textarea value={form.whyJoin} onChange={e=>f('whyJoin',e.target.value)}
              placeholder="Tell us about yourself and what you're working on…"
              rows={4} style={{ ...inp, resize:'vertical', lineHeight:1.6 }}/>
          </div>

          <div style={{ marginBottom:20 }}>
            <Label req>What do you want your life to look like?</Label>
            <textarea value={form.lifeVision} onChange={e=>f('lifeVision',e.target.value)}
              placeholder="Where are you headed? What are you building toward?"
              rows={4} style={{ ...inp, resize:'vertical', lineHeight:1.6 }}/>
          </div>

          <div style={{ marginBottom:20 }}>
            <Label>Founding Circle invite code</Label>
            <input value={form.inviteCode}
              onChange={e=>f('inviteCode',e.target.value.toUpperCase())}
              placeholder="e.g. QUELOTECH-01"
              style={{ ...inp, fontFamily:'monospace', letterSpacing:1 }}/>
          </div>

          <div style={{ background:C.bg, borderRadius:14, padding:'16px 18px', marginBottom:24,
            display:'flex', gap:14, alignItems:'flex-start', cursor:'pointer',
            border:`1px solid ${C.border}` }}
            onClick={()=>f('memberInterest',!form.memberInterest)}>
            <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, marginTop:1,
              border:`2px solid ${form.memberInterest?C.sage:C.border}`,
              background:form.memberInterest?C.sage:'transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.15s' }}>
              {form.memberInterest&&<span style={{ color:'#fff', fontSize:12 }}>✓</span>}
            </div>
            <div>
              <div style={{ fontFamily:font.sans, fontSize:13, fontWeight:600,
                color:C.ink, marginBottom:3 }}>
                I'm interested in a permanent membership
              </div>
              <div style={{ fontFamily:font.sans, fontSize:12, color:C.muted, lineHeight:1.5 }}>
                When Work Uptown opens a dedicated space, add me to the founding members list.
              </div>
            </div>
          </div>

          {submitErr&&(
            <div style={{ background:'#FEE2E2', borderRadius:10, padding:'10px 14px',
              fontFamily:font.sans, fontSize:13, color:'#DC2626', marginBottom:16 }}>
              {submitErr}
            </div>
          )}

          <button onClick={submit} disabled={submitting} style={{ width:'100%',
            background:C.terra, color:'#fff', border:'none', borderRadius:99, padding:'15px',
            fontFamily:font.sans, fontSize:15, fontWeight:600,
            cursor:submitting?'not-allowed':'pointer', opacity:submitting?0.7:1 }}>
            {submitting?'Submitting…':'Submit application →'}
          </button>
        </div>
      </div>
    )
  }

  // ── ADMIN ─────────────────────────────────────────────────────────────
  const AdminView = () => {
    if(!adminOk) return (
      <div style={{ maxWidth:380, margin:'80px auto', padding:'0 24px', textAlign:'center' }}>
        <h1 style={{ fontFamily:font.serif, fontSize:28, fontWeight:900, color:C.ink, marginBottom:8 }}>
          Admin
        </h1>
        <p style={{ fontFamily:font.sans, fontSize:14, color:C.muted, marginBottom:28, lineHeight:1.6 }}>
          Enter your password to access the dashboard.
        </p>
        <input type="password" value={adminPw} onChange={e=>setAdminPw(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&(adminPw===ADMIN_PASS?(setAdminOk(true),setAdminErr(false)):setAdminErr(true))}
          placeholder="Password" style={{ width:'100%', padding:'12px 16px', borderRadius:12,
            border:`1.5px solid ${adminErr?C.terra:C.border}`, fontSize:15, outline:'none',
            fontFamily:font.sans, marginBottom:12, textAlign:'center' }}/>
        {adminErr&&<div style={{ fontSize:12, color:C.terra, marginBottom:12 }}>Incorrect password</div>}
        <button onClick={()=>adminPw===ADMIN_PASS?(setAdminOk(true),setAdminErr(false)):setAdminErr(true)}
          style={{ width:'100%', background:C.ink, color:'#fff', border:'none', borderRadius:99,
            padding:'13px', fontFamily:font.sans, fontSize:15, fontWeight:600, cursor:'pointer' }}>
          Unlock →
        </button>
      </div>
    )

    const memCount = regs.filter(r=>r.member_interest).length
    const filtered = dayFilter==='all' ? regs : regs.filter(r=>r.wfh_days&&r.wfh_days.includes(dayFilter))
    const csv = ['First,Last,Email,Profession,Neighborhood,WFH Days,Why Join,Life Vision,Invite Code,Interests,Member']
      .concat(regs.map(r=>`${r.first_name},${r.last_name},${r.email},${r.profession},${r.neighborhood},"${r.wfh_days||''}","${r.why_join||''}","${r.life_vision||''}","${r.invite_code||''}","${r.interests||''}",${r.member_interest?'Yes':'No'}`))
      .join('\n')

    return (
      <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <div style={{ fontFamily:font.sans, fontSize:11, fontWeight:700, color:C.terra,
              letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Admin</div>
            <h1 style={{ fontFamily:font.serif, fontSize:28, fontWeight:900, color:C.ink }}>
              Curation Dashboard
            </h1>
          </div>
          <button onClick={()=>{
            const a=document.createElement('a')
            a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
            a.download=`workuptown-${activeMonth}.csv`
            a.click()
          }} style={{ background:C.ink, color:'#fff', border:'none', borderRadius:99,
            padding:'10px 20px', fontFamily:font.sans, fontSize:13, fontWeight:600,
            cursor:'pointer' }}>⬇ Export CSV</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
          {[['Applications',regs.length,C.sage],['Spots left',spotsLeft,C.terra],
            ['Curated',curated.length,C.gold],['Want membership',memCount,C.lav]].map(([label,val,color])=>(
            <div key={label} style={{ background:'#fff', border:`1px solid ${C.border}`,
              borderRadius:14, padding:'16px' }}>
              <div style={{ fontFamily:font.serif, fontSize:28, fontWeight:900, color }}>{loading?'–':val}</div>
              <div style={{ fontFamily:font.sans, fontSize:9, color:C.muted, marginTop:3,
                letterSpacing:1, fontWeight:600 }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          {[['applications','All'],['curate','Curate Session']].map(([t,l])=>(
            <button key={t} onClick={()=>setAdminTab(t)} style={{
              background:adminTab===t?C.ink:'transparent', color:adminTab===t?'#fff':C.muted,
              border:`1.5px solid ${adminTab===t?C.ink:C.border}`, borderRadius:99,
              padding:'7px 18px', fontFamily:font.sans, fontSize:13, fontWeight:500,
              cursor:'pointer' }}>{l}</button>
          ))}
        </div>

        <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontFamily:font.sans, fontSize:11, color:C.muted, fontWeight:600,
            letterSpacing:1 }}>DAY:</span>
          {['all',...DAYS].map(d=>(
            <button key={d} onClick={()=>setDayFilter(d)} style={{
              padding:'5px 14px', borderRadius:99, fontFamily:font.sans, fontSize:12,
              background:dayFilter===d?C.sage:'transparent', color:dayFilter===d?'#fff':C.muted,
              border:`1.5px solid ${dayFilter===d?C.sage:C.border}`, cursor:'pointer' }}>
              {d==='all'?'All':d}
            </button>
          ))}
        </div>

        {curated.length>0&&adminTab==='curate'&&(
          <div style={{ background:C.sage, borderRadius:12, padding:'14px 20px', marginBottom:16,
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:font.sans, fontSize:14, color:'#fff', fontWeight:600 }}>
              {curated.length} member{curated.length>1?'s':''} selected
            </span>
            <button onClick={()=>alert(regs.filter(r=>curated.includes(r.id))
              .map(r=>`${r.first_name} ${r.last_name} — ${r.email}`).join('\n'))}
              style={{ background:'rgba(255,255,255,0.2)', color:'#fff', border:'none',
                borderRadius:99, padding:'8px 18px', fontFamily:font.sans, fontSize:13,
                cursor:'pointer' }}>
              View list →
            </button>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map((r,i)=>{
            const isCurated=curated.includes(r.id)
            return (
              <div key={i} style={{ background:'#fff', border:`2px solid ${isCurated?C.sage:C.border}`,
                borderRadius:16, padding:'18px 20px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:14,
                  alignItems:'flex-start', marginBottom:r.why_join?12:0 }}>
                  <Avatar name={`${r.first_name} ${r.last_name}`} size={40}/>
                  <div>
                    <div style={{ fontFamily:font.serif, fontSize:16, fontWeight:700,
                      color:C.ink }}>{r.first_name} {r.last_name}</div>
                    <div style={{ fontFamily:font.sans, fontSize:12, color:C.muted, marginTop:2 }}>
                      {r.email} · {r.neighborhood}
                    </div>
                    <div style={{ fontFamily:font.sans, fontSize:12, color:C.neutral, marginTop:2 }}>
                      {r.profession}
                    </div>
                    {r.wfh_days&&(
                      <div style={{ marginTop:6, display:'flex', flexWrap:'wrap', gap:4 }}>
                        {r.wfh_days.split(',').map(d=>d.trim()).filter(Boolean).map((d,di)=>(
                          <span key={di} style={{ background:C.sage+'15', color:C.sage,
                            borderRadius:99, padding:'2px 10px',
                            fontFamily:font.sans, fontSize:11, fontWeight:500 }}>{d}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                    {adminTab==='curate'&&(
                      <button onClick={()=>setCurated(p=>p.includes(r.id)?p.filter(x=>x!==r.id):[...p,r.id])}
                        style={{ background:isCurated?C.sage:'transparent', color:isCurated?'#fff':C.sage,
                          border:`2px solid ${C.sage}`, borderRadius:99, padding:'6px 16px',
                          fontFamily:font.sans, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        {isCurated?'✓ Selected':'+ Select'}
                      </button>
                    )}
                    {r.invite_code&&<span style={{ background:C.lav+'18', color:C.lav,
                      borderRadius:99, padding:'2px 10px',
                      fontFamily:'monospace', fontSize:10, fontWeight:600 }}>{r.invite_code}</span>}
                    {r.member_interest&&<span style={{ background:C.sage+'18', color:C.sage,
                      borderRadius:99, padding:'2px 10px',
                      fontFamily:font.sans, fontSize:10, fontWeight:600 }}>MEMBER</span>}
                  </div>
                </div>
                {r.why_join&&(
                  <div style={{ background:'#FFF8F5', borderRadius:10, padding:'10px 14px',
                    marginBottom:8, fontFamily:font.sans, fontSize:12, color:C.neutral,
                    lineHeight:1.6, borderLeft:`3px solid ${C.terra}` }}>
                    <span style={{ fontWeight:700, color:C.muted, fontSize:9, letterSpacing:1,
                      textTransform:'uppercase', display:'block', marginBottom:4 }}>
                      Why they want to join
                    </span>
                    {r.why_join}
                  </div>
                )}
                {r.life_vision&&(
                  <div style={{ background:C.sage+'08', borderRadius:10, padding:'10px 14px',
                    fontFamily:font.sans, fontSize:12, color:C.neutral, lineHeight:1.6,
                    borderLeft:`3px solid ${C.sage}` }}>
                    <span style={{ fontWeight:700, color:C.sage, fontSize:9, letterSpacing:1,
                      textTransform:'uppercase', display:'block', marginBottom:4 }}>
                      What they want their life to look like
                    </span>
                    {r.life_vision}
                  </div>
                )}
              </div>
            )
          })}
          {filtered.length===0&&(
            <div style={{ textAlign:'center', padding:48, color:C.muted,
              fontFamily:font.sans, fontStyle:'italic' }}>
              {loading?'Loading…':'No applications yet'}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:font.sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        button { cursor:pointer; }
        input, select, textarea { font-family:'DM Sans',system-ui,sans-serif; }
        input::placeholder { color:rgba(26,18,8,0.3); }
        ::-webkit-scrollbar { display:none; }
      `}</style>
      {Nav()}
      {view==='home'  && <HomeView/>}
      {view==='apply' && <ApplyView/>}
      {view==='admin' && AdminView()}
    </div>
  )
}
