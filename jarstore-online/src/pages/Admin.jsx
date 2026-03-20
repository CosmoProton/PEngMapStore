import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, apiFetch } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ToastContainer.jsx';
import { CheckCircle, XCircle, Users, Package, Download, Clock, Shield, Ban, Star, StarOff, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const fmtDate = s => new Date(s).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'});
const accountAge = d => {
  if (!d) return '?';
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  return days >= 365 ? `${Math.floor(days/365)}a` : `${days}g`;
};

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [tab,     setTab]     = useState('queue'); // 'queue' | 'users' | 'stats'
  const [queue,   setQueue]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [fetching,setFetching]= useState(false);
  const [noteMap, setNoteMap] = useState({});
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => { if (!loading && (!user || !user.is_admin)) navigate('/'); }, [user, loading]);

  const fetchQueue = useCallback(async () => {
    setFetching(true);
    try { setQueue(await apiFetch('/api/admin/queue')); }
    catch (e) { toast.error(e.message); }
    finally { setFetching(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setFetching(true);
    try { setUsers(await apiFetch('/api/admin/users')); }
    catch (e) { toast.error(e.message); }
    finally { setFetching(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    setFetching(true);
    try { setStats(await apiFetch('/api/admin/stats')); }
    catch (e) { toast.error(e.message); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => {
    if (tab === 'queue') fetchQueue();
    else if (tab === 'users') fetchUsers();
    else if (tab === 'stats') fetchStats();
  }, [tab]);

  const review = async (id, action) => {
    try {
      await apiFetch('/api/admin/review', {
        method: 'POST',
        body: JSON.stringify({ id, action, note: noteMap[id] || '' }),
      });
      toast.success(action === 'approve' ? '✅ Approvato!' : '❌ Rifiutato');
      setQueue(q => q.filter(p => p.id !== id));
    } catch (e) { toast.error(e.message); }
  };

  const userAction = async (id, action, reason) => {
    try {
      await apiFetch('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ id, action, reason }),
      });
      toast.success('Utente aggiornato');
      fetchUsers();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return null;

  return (
    <>
      <div className="page-wide">
        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:16}} className="fade-up">
          <div>
            <h1 style={{fontFamily:'var(--font-mono)',fontSize:28,fontWeight:700}}>
              <span style={{color:'var(--accent)'}}>{'//'} </span>Admin Panel
            </h1>
            <p style={{color:'var(--text-muted)',fontSize:13,marginTop:4,fontFamily:'var(--font-mono)'}}>
              Revisione submission · Gestione utenti
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={()=>tab==='queue'?fetchQueue():tab==='users'?fetchUsers():fetchStats()} disabled={fetching}>
            <RefreshCw size={14} style={fetching?{animation:'spin .7s linear infinite'}:{}}/>
          </button>
        </div>

        {/* Tabs */}
        <div style={S.tabs} className="fade-up">
          {[
            { key:'queue', label:'Coda revisione', icon:<Clock size={15}/>, badge: queue.length||null },
            { key:'users', label:'Utenti',          icon:<Users size={15}/> },
            { key:'stats', label:'Statistiche',     icon:<Package size={15}/> },
          ].map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)} style={{...S.tab, ...(tab===t.key?S.tabOn:{})}}>
              {t.icon}{t.label}
              {t.badge > 0 && <span style={S.tabBadge}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ── CODA ── */}
        {tab === 'queue' && (
          <div className="fade-up">
            {queue.length === 0 ? (
              <div style={S.empty}><CheckCircle size={40} color="var(--success)"/><p style={{color:'var(--text-secondary)',marginTop:12,fontFamily:'var(--font-mono)'}}>Nessuna submission in attesa 🎉</p></div>
            ) : queue.map(p => (
              <div key={p.id} className="card" style={S.qCard}>
                {/* Info programma */}
                <div style={S.qHeader}>
                  <div style={S.qIcon}>☕</div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <h3 style={{fontFamily:'var(--font-mono)',fontSize:15,fontWeight:700}}>{p.name}</h3>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--accent)'}}>v{p.version}</span>
                    </div>
                    {p.description && <p style={{fontSize:13,color:'var(--text-secondary)',marginTop:4}}>{p.description}</p>}
                    <div style={{display:'flex',gap:12,marginTop:8,flexWrap:'wrap'}}>
                      <span style={S.meta}>📁 {p.original_name}</span>
                      <span style={S.meta}>📅 {fmtDate(p.created_at)}</span>
                      {p.tags && p.tags.split(',').map((t,i)=><span key={i} className="badge badge-purple">{t.trim()}</span>)}
                    </div>
                  </div>
                </div>

                {/* Info uploader */}
                <div style={S.uploaderBox}>
                  <img src={p.uploader_avatar||'https://github.com/ghost.png'} style={{width:28,height:28,borderRadius:'50%',border:'2px solid var(--border)'}} alt=""/>
                  <div>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:13,fontWeight:700}}>@{p.uploader}</span>
                    <span style={{fontSize:12,color:'var(--text-muted)',marginLeft:10}}>
                      account: {accountAge(p.uploader_created)} · {p.uploader_repos} repo
                    </span>
                  </div>
                  {p.uploader_whitelisted && <span className="badge badge-green" style={{marginLeft:'auto'}}>✓ Verificato</span>}
                </div>

                {/* Note + azioni */}
                <div style={{display:'flex',gap:10,alignItems:'flex-end',marginTop:12}}>
                  <div style={{flex:1}}>
                    <label style={S.label}>Nota admin (opzionale, mostrata se rifiutato)</label>
                    <input
                      className="input"
                      placeholder="Motivo rifiuto o nota…"
                      value={noteMap[p.id]||''}
                      onChange={e=>setNoteMap(m=>({...m,[p.id]:e.target.value}))}
                    />
                  </div>
                  <button className="btn btn-danger btn-sm" style={{height:40}} onClick={()=>review(p.id,'reject')}>
                    <XCircle size={15}/>Rifiuta
                  </button>
                  <button className="btn btn-success btn-sm" style={{height:40}} onClick={()=>review(p.id,'approve')}>
                    <CheckCircle size={15}/>Approva
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── UTENTI ── */}
        {tab === 'users' && (
          <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:8}}>
            {users.map(u => (
              <div key={u.id} className="card" style={{padding:'14px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <img src={u.avatar_url||'https://github.com/ghost.png'} style={{width:36,height:36,borderRadius:'50%',border:'2px solid var(--border)',flexShrink:0}} alt=""/>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:14,fontWeight:700}}>@{u.github_username}</span>
                      {u.is_admin       && <span className="badge badge-cyan">admin</span>}
                      {u.is_whitelisted && <span className="badge badge-green">✓ verificato</span>}
                      {u.is_banned      && <span className="badge badge-red">🚫 bannato</span>}
                    </div>
                    <span style={{fontSize:12,color:'var(--text-muted)'}}>
                      account GitHub: {accountAge(u.github_created_at)} · {u.github_public_repos} repo · iscritto {fmtDate(u.created_at)}
                    </span>
                    {u.is_banned && u.ban_reason && <p style={{fontSize:12,color:'var(--danger)',marginTop:2}}>Motivo ban: {u.ban_reason}</p>}
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    {!u.is_admin && !u.is_banned && (
                      <BanButton u={u} onBan={(reason)=>userAction(u.id,'ban',reason)}/>
                    )}
                    {u.is_banned && (
                      <button className="btn btn-ghost btn-sm" onClick={()=>userAction(u.id,'unban')}>
                        <CheckCircle size={14}/>Riabilita
                      </button>
                    )}
                    {!u.is_admin && !u.is_whitelisted && (
                      <button className="btn btn-ghost btn-sm" style={{color:'var(--success)',borderColor:'rgba(63,185,80,0.3)'}} onClick={()=>userAction(u.id,'whitelist')}>
                        <Star size={14}/>Verifica
                      </button>
                    )}
                    {u.is_whitelisted && !u.is_admin && (
                      <button className="btn btn-ghost btn-sm" onClick={()=>userAction(u.id,'unwhitelist')}>
                        <StarOff size={14}/>Rimuovi verifica
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── STATS ── */}
        {tab === 'stats' && stats && (
          <div className="fade-up">
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:28}}>
              {[
                { label:'Utenti',     value:stats.totalUsers,    color:'var(--accent)',   icon:<Users    size={18}/> },
                { label:'Approvati',  value:stats.totalApproved, color:'var(--success)',  icon:<CheckCircle size={18}/> },
                { label:'In attesa',  value:stats.totalPending,  color:'var(--warning)',  icon:<Clock    size={18}/> },
                { label:'Rifiutati',  value:stats.totalRejected, color:'var(--danger)',   icon:<XCircle  size={18}/> },
                { label:'Download',   value:stats.totalDownloads,color:'#a78bfa',         icon:<Download size={18}/> },
              ].map(s => (
                <div key={s.label} className="card" style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:40,height:40,borderRadius:10,background:s.color+'18',display:'flex',alignItems:'center',justifyContent:'center',color:s.color,flexShrink:0}}>{s.icon}</div>
                  <div>
                    <p style={{fontFamily:'var(--font-mono)',fontSize:22,fontWeight:700}}>{s.value??'—'}</p>
                    <p style={{fontSize:12,color:'var(--text-muted)'}}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
            {stats.topDownloads?.length > 0 && (
              <div className="card" style={{padding:20}}>
                <h3 style={{fontFamily:'var(--font-mono)',fontSize:14,marginBottom:14}}>Top download</h3>
                {stats.topDownloads.map((p,i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:13}}>{p.name}</span>
                    <span style={{fontSize:13,color:'var(--accent)',fontFamily:'var(--font-mono)'}}>{p.download_count} dl</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <ToastContainer toasts={toast.toasts}/>
    </>
  );
}

function BanButton({ u, onBan }) {
  const [open,   setOpen]   = useState(false);
  const [reason, setReason] = useState('');
  return (
    <>
      <button className="btn btn-danger btn-sm" onClick={()=>setOpen(true)}><Ban size={14}/>Banna</button>
      {open && (
        <div className="modal-overlay" onClick={()=>setOpen(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3 style={{fontFamily:'var(--font-mono)',marginBottom:16}}>Banna @{u.github_username}</h3>
            <label style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'.04em'}}>Motivo</label>
            <input className="input" style={{marginTop:6}} placeholder="Inserisci il motivo del ban…" value={reason} onChange={e=>setReason(e.target.value)}/>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setOpen(false)}>Annulla</button>
              <button className="btn btn-danger btn-sm" onClick={()=>{onBan(reason);setOpen(false);}}>Conferma ban</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const S = {
  tabs:       { display:'flex', gap:4, marginBottom:24, borderBottom:'1px solid var(--border)', paddingBottom:0 },
  tab:        { display:'flex', alignItems:'center', gap:7, padding:'10px 16px', background:'transparent', border:'none', borderBottom:'2px solid transparent', color:'var(--text-secondary)', fontSize:14, fontFamily:'var(--font-sans)', fontWeight:500, cursor:'pointer', transition:'all var(--transition)', marginBottom:-1 },
  tabOn:      { color:'var(--accent)', borderBottomColor:'var(--accent)' },
  tabBadge:   { background:'var(--warning)', color:'#000', borderRadius:10, fontSize:11, fontWeight:700, padding:'1px 7px', marginLeft:4 },
  empty:      { display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 0' },
  qCard:      { padding:20, marginBottom:12 },
  qHeader:    { display:'flex', gap:14, marginBottom:12 },
  qIcon:      { width:44, height:44, borderRadius:10, background:'var(--bg-elevated)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 },
  meta:       { fontSize:12, color:'var(--text-muted)' },
  uploaderBox:{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' },
  label:      { fontSize:11, fontWeight:600, color:'var(--text-secondary)', letterSpacing:'.04em', textTransform:'uppercase', display:'block', marginBottom:4 },
};
