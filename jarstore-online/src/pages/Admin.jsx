import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, apiFetch, STATUS_LABELS } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ToastContainer.jsx';
import { CheckCircle, XCircle, Users, Package, Download, Clock, Shield, Ban, Star, StarOff, RefreshCw, HardDrive, AlertTriangle, UserCheck, FileText, Trash2 } from 'lucide-react';

const fmtDate = s => new Date(s).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'});
const accountAge = d => {
  if (!d) return '?';
  const days = Math.floor((Date.now()-new Date(d))/86400000);
  return days>=365 ? `${Math.floor(days/365)}a` : `${days}g`;
};

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();
  const [tab,      setTab]      = useState('queue');
  const [queue,    setQueue]    = useState({ programs:[], pendingUsers:[] });
  const [users,    setUsers]    = useState([]);
  const [stats,    setStats]    = useState(null);
  const [fetching, setFetching] = useState(false);
  const [noteMap,  setNoteMap]  = useState({});
  const [log,      setLog]      = useState([]);

  const isAdmin = ['admin','superadmin'].includes(user?.user_status);
  useEffect(() => { if (!loading && !isAdmin) navigate('/'); }, [user, loading]);

  const fetchQueue = useCallback(async () => {
    setFetching(true);
    try { setQueue(await apiFetch('/api/admin/queue')); }
    catch(e) { toast.error(e.message); }
    finally { setFetching(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setFetching(true);
    try { setUsers(await apiFetch('/api/admin/users')); }
    catch(e) { toast.error(e.message); }
    finally { setFetching(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    setFetching(true);
    try { setStats(await apiFetch('/api/admin/stats')); }
    catch(e) { toast.error(e.message); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => {
    if (tab==='queue') fetchQueue();
    else if (tab==='users') fetchUsers();
    else if (tab==='log') fetchLog();
    else fetchStats();
  }, [tab]);

  const reviewProgram = async (id, action) => {
    try {
      await apiFetch('/api/admin/review', { method:'POST', body:JSON.stringify({ id, action, note:noteMap[id]||'' }) });
      toast.success(action==='approve' ? '✅ Approvato!' : '❌ Rifiutato');
      setQueue(q => ({ ...q, programs: q.programs.filter(p=>p.id!==id) }));
    } catch(e) { toast.error(e.message); }
  };

  const userAction = async (id, action, reason) => {
    try {
      await apiFetch('/api/admin/users', { method:'PATCH', body:JSON.stringify({ id, action, reason }) });
      toast.success('Utente aggiornato');
      if (tab==='queue') fetchQueue();
      else fetchUsers();
    } catch(e) { toast.error(e.message); }
  };

  const fetchLog = useCallback(async () => {
    setFetching(true);
    try { setLog(await apiFetch('/api/admin/log')); }
    catch(e) { toast.error(e.message); }
    finally { setFetching(false); }
  }, []);

  const totalQueueBadge = (queue.programs?.length||0) + (queue.pendingUsers?.length||0);
  if (loading) return null;

  return (
    <>
      <div className="page-wide">
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}} className="fade-up">
          <div>
            <h1 style={{fontFamily:'var(--font-mono)',fontSize:26,fontWeight:700}}>
              <span style={{color:'var(--accent)'}}>{'//'} </span>Admin Panel
            </h1>
            <p style={{color:'var(--text-muted)',fontSize:12,marginTop:4,fontFamily:'var(--font-mono)'}}>
              Revisione · Utenti · Statistiche
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={()=>tab==='queue'?fetchQueue():tab==='users'?fetchUsers():fetchStats()} disabled={fetching}>
            <RefreshCw size={14} style={fetching?{animation:'spin .7s linear infinite'}:{}}/>
          </button>
        </div>

        {/* Tabs */}
        <div style={S.tabs} className="admin-tabs fade-up">
          {[
            { key:'queue', label:'Coda', icon:<Clock size={14}/>, badge:totalQueueBadge||null },
            { key:'users', label:'Utenti', icon:<Users size={14}/> },
            { key:'stats', label:'Stats', icon:<Package size={14}/> },
            { key:'log', label:'Log', icon:<FileText size={14}/> },
          ].map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{...S.tab,...(tab===t.key?S.tabOn:{})}}>
              {t.icon}{t.label}
              {t.badge>0 && <span style={S.tabBadge}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ── CODA ── */}
        {tab==='queue' && (
          <div className="fade-up">
            {/* Utenti pending */}
            {queue.pendingUsers?.length > 0 && (
              <div style={{marginBottom:24}}>
                <h3 style={{fontFamily:'var(--font-mono)',fontSize:13,color:'var(--warning)',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                  <UserCheck size={15}/>NUOVI ACCOUNT DA APPROVARE ({queue.pendingUsers.length})
                </h3>
                {queue.pendingUsers.map(u=>(
                  <div key={u.id} className="card" style={{padding:'14px 16px',marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                      <img src={u.avatar_url||'https://github.com/ghost.png'} style={{width:32,height:32,borderRadius:'50%',border:'2px solid var(--border)',flexShrink:0}} alt=""/>
                      <div style={{flex:1,minWidth:0}}>
                        <span style={{fontFamily:'var(--font-mono)',fontSize:13,fontWeight:700}}>@{u.github_username}</span>
                        <span style={{fontSize:11,color:'var(--text-muted)',marginLeft:10}}>
                          account: {accountAge(u.github_created_at)} · {u.github_public_repos} repo · iscritto {fmtDate(u.created_at)}
                        </span>
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <button className="btn btn-danger btn-sm" onClick={()=>userAction(u.id,'ban','Account non approvato')}>
                          <XCircle size={13}/>Rifiuta
                        </button>
                        <button className="btn btn-success btn-sm" onClick={()=>userAction(u.id,'approve')}>
                          <CheckCircle size={13}/>Approva
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Programmi pending */}
            <h3 style={{fontFamily:'var(--font-mono)',fontSize:13,color:'var(--text-muted)',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
              <Package size={15}/>PROGRAMMI IN ATTESA ({queue.programs?.length||0})
            </h3>
            {queue.programs?.length===0 ? (
              <div style={S.empty}><CheckCircle size={36} color="var(--success)"/><p style={{color:'var(--text-secondary)',marginTop:10,fontSize:14}}>Nessun programma in coda</p></div>
            ) : queue.programs.map(p=>(
              <div key={p.id} className="card" style={{padding:16,marginBottom:10}}>
                <div style={{display:'flex',gap:12,marginBottom:10,alignItems:'flex-start'}}>
                  <div style={S.qIcon}>☕</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <h3 style={{fontFamily:'var(--font-mono)',fontSize:14,fontWeight:700}}>{p.name}</h3>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--accent)'}}>v{p.version}</span>
                      <span style={{fontSize:11,color:'var(--text-muted)'}}>📁 {p.original_name}</span>
                    </div>
                    {p.description && <p style={{fontSize:12,color:'var(--text-secondary)',marginTop:4}}>{p.description}</p>}
                    {p.contributors && <p style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>👥 {p.contributors}</p>}
                    {p.tags && <div style={{display:'flex',gap:5,marginTop:6,flexWrap:'wrap'}}>{p.tags.split(',').map((t,i)=><span key={i} className="badge badge-purple">{t.trim()}</span>)}</div>}
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--bg-elevated)',borderRadius:'var(--radius-sm)',marginBottom:10}}>
                  <img src={p.uploader_avatar||'https://github.com/ghost.png'} style={{width:22,height:22,borderRadius:'50%'}} alt=""/>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:12}}>@{p.uploader}</span>
                  <span style={{fontSize:11,color:'var(--text-muted)',marginLeft:4}}>
                    {accountAge(p.uploader_created)} · {p.uploader_repos} repo
                  </span>
                  <span style={{fontSize:11,color:'var(--text-muted)',marginLeft:'auto'}}>{fmtDate(p.created_at)}</span>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'flex-end',flexWrap:'wrap'}} className="queue-actions">
                  <div style={{flex:1,minWidth:160}}>
                    <input className="input" style={{fontSize:13}} placeholder="Nota admin (opzionale)…"
                      value={noteMap[p.id]||''} onChange={e=>setNoteMap(m=>({...m,[p.id]:e.target.value}))}/>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={()=>reviewProgram(p.id,'reject')}><XCircle size={14}/>Rifiuta</button>
                  <button className="btn btn-success btn-sm" onClick={()=>reviewProgram(p.id,'approve')}><CheckCircle size={14}/>Approva</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── UTENTI ── */}
        {tab==='users' && (
          <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:8}}>
            {users.map(u=>{
              const sl = STATUS_LABELS[u.user_status]||{};
              const isSuperadmin = u.github_username==='CosmoUniverso';
              const isSelf = u.id===user.id;
              return (
                <div key={u.id} className="card" style={{padding:'12px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <img src={u.avatar_url||'https://github.com/ghost.png'} style={{width:34,height:34,borderRadius:'50%',border:'2px solid var(--border)',flexShrink:0}} alt=""/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                        <span style={{fontFamily:'var(--font-mono)',fontSize:13,fontWeight:700}}>@{u.github_username}</span>
                        <span className={`badge ${sl.cls||'badge-gray'}`}>{sl.label||u.user_status}</span>
                      </div>
                      <span style={{fontSize:11,color:'var(--text-muted)'}}>
                        {accountAge(u.github_created_at)} · {u.github_public_repos} repo · iscritto {fmtDate(u.created_at)}
                      </span>
                      {u.user_status==='banned'&&u.ban_reason&&<p style={{fontSize:11,color:'var(--danger)',marginTop:2}}>Ban: {u.ban_reason}</p>}
                    </div>
                    {!isSelf && !isSuperadmin && (
                      <div style={{display:'flex',gap:5,flexWrap:'wrap',flexShrink:0}}>
                        {u.user_status==='pending' && <>
                          <button className="btn btn-danger btn-sm" onClick={()=>userAction(u.id,'ban','Non approvato')}><XCircle size={13}/>Rifiuta</button>
                          <button className="btn btn-success btn-sm" onClick={()=>userAction(u.id,'approve')}><CheckCircle size={13}/>Approva</button>
                        </>}
                        {u.user_status==='active' && <>
                          <button className="btn btn-ghost btn-sm" style={{color:'var(--success)',borderColor:'rgba(63,185,80,0.3)'}} onClick={()=>userAction(u.id,'whitelist')}><Star size={13}/>Verifica</button>
                          {user.user_status==='superadmin' && <button className="btn btn-ghost btn-sm" style={{color:'var(--accent)',borderColor:'rgba(0,210,255,0.3)'}} onClick={()=>{if(confirm('Promuovi ad admin?')) userAction(u.id,'makeadmin')}}><Shield size={13}/>Admin</button>}
                          <BanBtn u={u} onBan={r=>userAction(u.id,'ban',r)}/>
                        </>}
                        {u.user_status==='whitelisted' && <>
                          <button className="btn btn-ghost btn-sm" onClick={()=>userAction(u.id,'unwhitelist')}><StarOff size={13}/>Rimuovi verifica</button>
                          {user.user_status==='superadmin' && <button className="btn btn-ghost btn-sm" style={{color:'var(--accent)',borderColor:'rgba(0,210,255,0.3)'}} onClick={()=>{if(confirm('Promuovi ad admin?')) userAction(u.id,'makeadmin')}}><Shield size={13}/>Admin</button>}
                          <BanBtn u={u} onBan={r=>userAction(u.id,'ban',r)}/>
                        </>}
                        {u.user_status==='admin' && user.user_status==='superadmin' && <>
                          <button className="btn btn-ghost btn-sm" onClick={()=>{if(confirm('Rimuovi admin?')) userAction(u.id,'removeadmin')}}><Shield size={13}/>Rimuovi admin</button>
                          <BanBtn u={u} onBan={r=>userAction(u.id,'ban',r)}/>
                        </>}
                        {u.user_status==='banned' && <button className="btn btn-ghost btn-sm" onClick={()=>userAction(u.id,'unban')}><CheckCircle size={13}/>Riabilita</button>}
                      </div>
                    )}
                    {(isSelf||isSuperadmin) && <span style={{fontSize:11,color:'var(--text-muted)'}}>{isSuperadmin?'⭐ superadmin':'(tu)'}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LOG ── */}
        {tab==='log' && (
          <div className="fade-up">
            <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:16,fontFamily:'var(--font-mono)'}}>
              Storico programmi revisionati — note visibili solo agli admin
            </p>
            {log.length===0 ? (
              <div style={S.empty}><FileText size={36} color="var(--text-muted)"/><p style={{color:'var(--text-secondary)',marginTop:10,fontSize:14}}>Nessun log ancora</p></div>
            ) : log.map(p=>(
              <div key={p.id} className="card" style={{padding:'14px 16px',marginBottom:8}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:13,fontWeight:700}}>{p.name}</span>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--accent)'}}>v{p.version}</span>
                      <span className={`badge ${p.status==='approved'?'badge-green':'badge-red'}`}>{p.status==='approved'?'✅ Approvato':'❌ Rifiutato'}</span>
                    </div>
                    <div style={{display:'flex',gap:10,fontSize:11,color:'var(--text-muted)',flexWrap:'wrap'}}>
                      <span>📁 {p.original_name}</span>
                      <span>👤 @{p.uploader}</span>
                      <span>📅 {fmtDate(p.updated_at)}</span>
                    </div>
                    {p.admin_note && (
                      <div style={{marginTop:8,padding:'8px 10px',background:'var(--bg-elevated)',borderRadius:'var(--radius-sm)',borderLeft:'3px solid var(--warning)'}}>
                        <span style={{fontSize:11,color:'var(--warning)',fontWeight:600,fontFamily:'var(--font-mono)'}}>NOTA ADMIN: </span>
                        <span style={{fontSize:12,color:'var(--text-secondary)'}}>{p.admin_note}</span>
                      </div>
                    )}
                  </div>
                  <button className="btn btn-danger btn-sm" style={{flexShrink:0}}
                    onClick={async()=>{
                      if(!confirm('Eliminare definitivamente?')) return;
                      try {
                        await apiFetch('/api/programs/manage?id='+p.id, {method:'DELETE'});
                        setLog(l=>l.filter(x=>x.id!==p.id));
                        toast.success('Eliminato');
                      } catch(e) { toast.error(e.message); }
                    }}>
                    <Trash2 size={13}/>Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── STATS ── */}
        {tab==='stats' && stats && (
          <div className="fade-up">
            {/* Storage warning */}
            {stats.storagePct >= 80 && (
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:'rgba(248,81,73,0.06)',border:'1px solid rgba(248,81,73,0.3)',borderRadius:'var(--radius-md)',marginBottom:20}}>
                <AlertTriangle size={16} color="var(--danger)"/>
                <span style={{fontSize:13,color:'var(--danger)'}}>
                  <strong>Storage al {stats.storagePct}%!</strong> Usati {stats.storageUsedMB}MB su 1024MB. Libera spazio presto.
                </span>
              </div>
            )}

            {/* Storage bar */}
            <div className="card" style={{padding:16,marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontSize:13,display:'flex',alignItems:'center',gap:6}}><HardDrive size={14}/>Storage Supabase</span>
                <span style={{fontFamily:'var(--font-mono)',fontSize:13,color:stats.storagePct>=80?'var(--danger)':'var(--text-secondary)'}}>{stats.storageUsedMB}MB / 1024MB</span>
              </div>
              <div style={{height:8,background:'var(--bg-elevated)',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.min(stats.storagePct,100)}%`,background:stats.storagePct>=80?'var(--danger)':stats.storagePct>=60?'var(--warning)':'var(--accent)',borderRadius:4,transition:'width .5s'}}/>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:20}} className="stats-grid">
              {[
                {label:'Totale utenti',    value:stats.totalUsers,          color:'var(--accent)'},
                {label:'In attesa',        value:stats.totalPending,        color:'var(--warning)'},
                {label:'Attivi',           value:stats.totalActive,         color:'var(--success)'},
                {label:'Verificati',       value:stats.totalWhitelisted,    color:'#3ecf8e'},
                {label:'Admin',            value:stats.totalAdmins,         color:'#a78bfa'},
                {label:'Bannati',          value:stats.totalBanned,         color:'var(--danger)'},
                {label:'Programmi',        value:stats.totalApproved,       color:'var(--accent)'},
                {label:'In revisione',     value:stats.totalPendingPrograms,color:'var(--warning)'},
              ].map(s=>(
                <div key={s.label} className="card" style={{padding:'12px 14px'}}>
                  <p style={{fontFamily:'var(--font-mono)',fontSize:20,fontWeight:700,color:s.color}}>{s.value??'—'}</p>
                  <p style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{s.label}</p>
                </div>
              ))}
            </div>

            {stats.topDownloads?.length>0 && (
              <div className="card" style={{padding:16}}>
                <h3 style={{fontFamily:'var(--font-mono)',fontSize:13,marginBottom:12}}>Top download</h3>
                {stats.topDownloads.map((p,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
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

function BanBtn({ u, onBan }) {
  const [open, setOpen]     = useState(false);
  const [reason, setReason] = useState('');
  return (
    <>
      <button className="btn btn-danger btn-sm" onClick={()=>setOpen(true)}><Ban size={13}/>Banna</button>
      {open && (
        <div className="modal-overlay" onClick={()=>setOpen(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3 style={{fontFamily:'var(--font-mono)',marginBottom:14}}>Banna @{u.github_username}</h3>
            <input className="input" placeholder="Motivo del ban…" value={reason} onChange={e=>setReason(e.target.value)} autoFocus/>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setOpen(false)}>Annulla</button>
              <button className="btn btn-danger btn-sm" onClick={()=>{onBan(reason);setOpen(false);}}>Conferma</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const S = {
  tabs:    { display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid var(--border)' },
  tab:     { display:'flex', alignItems:'center', gap:6, padding:'10px 14px', background:'transparent', border:'none', borderBottom:'2px solid transparent', color:'var(--text-secondary)', fontSize:13, fontFamily:'var(--font-sans)', fontWeight:500, cursor:'pointer', transition:'all var(--transition)', marginBottom:-1, whiteSpace:'nowrap' },
  tabOn:   { color:'var(--accent)', borderBottomColor:'var(--accent)' },
  tabBadge:{ background:'var(--warning)', color:'#000', borderRadius:10, fontSize:10, fontWeight:700, padding:'1px 6px', marginLeft:3 },
  empty:   { display:'flex', flexDirection:'column', alignItems:'center', padding:'50px 0' },
  qIcon:   { width:38, height:38, borderRadius:8, background:'var(--bg-elevated)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 },
};
