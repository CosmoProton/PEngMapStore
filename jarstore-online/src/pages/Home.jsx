import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, apiFetch } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ToastContainer.jsx';
import { ProgramCard } from '../components/ProgramCard.jsx';
import { Search, RefreshCw, Upload, Package, CheckCircle, Clock, X } from 'lucide-react';

// Popup benvenuto per nuovi utenti
function WelcomePopup({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{textAlign:'center',maxWidth:420}}>
        <div style={{width:60,height:60,borderRadius:'50%',background:'var(--accent-dim)',border:'1px solid rgba(0,210,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
          <CheckCircle size={28} color="var(--accent)"/>
        </div>
        <h2 style={{fontFamily:'var(--font-mono)',fontSize:20,marginBottom:12}}>Account creato! 🎉</h2>
        <p style={{color:'var(--text-secondary)',fontSize:14,lineHeight:1.7,marginBottom:20}}>
          Benvenuto su JarStore!<br/><br/>
          <strong style={{color:'var(--text-primary)'}}>Prima di poter caricare i tuoi progetti</strong>, il tuo account dovrà essere revisionato dall'admin.<br/><br/>
          Riceverai l'approvazione a breve. Nel frattempo puoi sfogliare e scaricare i programmi disponibili.
        </p>
        <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center',padding:'10px 16px',background:'rgba(210,153,34,0.08)',border:'1px solid rgba(210,153,34,0.3)',borderRadius:'var(--radius-md)',marginBottom:20}}>
          <Clock size={15} color="var(--warning)"/>
          <span style={{fontSize:13,color:'var(--warning)'}}>In attesa di approvazione</span>
        </div>
        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={onClose}>
          Inizia a esplorare
        </button>
      </div>
    </div>
  );
}

// Banner per utenti pending
function PendingBanner() {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:'rgba(210,153,34,0.06)',border:'1px solid rgba(210,153,34,0.25)',borderRadius:'var(--radius-md)',marginBottom:20}}>
      <Clock size={16} color="var(--warning)"/>
      <p style={{fontSize:13,color:'var(--text-secondary)'}}>
        <strong style={{color:'var(--warning)'}}>Account in attesa di approvazione.</strong> Potrai caricare i tuoi programmi non appena un admin approverà il tuo account.
      </p>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();
  const [params, setParams] = useSearchParams();
  const [programs, setPrograms] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [query,    setQuery]    = useState('');
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => { if (!loading && !user) navigate('/login'); }, [user, loading]);
  useEffect(() => {
    if (params.get('welcome') === '1') {
      setShowWelcome(true);
      setParams({}, { replace: true });
    }
  }, [params]);

  const fetchPrograms = useCallback(async () => {
    setFetching(true);
    try { setPrograms(await apiFetch('/api/programs')); }
    catch (e) { toast.error(e.message); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => { fetchPrograms(); }, []);

  const filtered = programs.filter(p =>
    !query ||
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description?.toLowerCase().includes(query.toLowerCase()) ||
    p.tags?.toLowerCase().includes(query.toLowerCase())
  );

  const canUpload = user && ['active','whitelisted','admin','superadmin'].includes(user.user_status);

  if (loading) return <Spinner/>;

  return (
    <>
      {showWelcome && <WelcomePopup onClose={()=>setShowWelcome(false)}/>}
      <div className="page-wide">
        {user?.user_status === 'pending' && <PendingBanner/>}

        <div style={S.header} className="fade-up">
          <div>
            <h1 style={S.title}><span style={{color:'var(--accent)'}}>{'//'} </span>Programmi</h1>
            <p style={S.sub}>{programs.length} programm{programs.length===1?'o':'i'} disponibil{programs.length===1?'e':'i'}</p>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button className="btn btn-ghost btn-sm" onClick={fetchPrograms} disabled={fetching}>
              <RefreshCw size={14} style={fetching?{animation:'spin .7s linear infinite'}:{}}/>
            </button>
            {canUpload && (
              <button className="btn btn-primary btn-sm" onClick={()=>navigate('/submit')}>
                <Upload size={14}/>Carica
              </button>
            )}
          </div>
        </div>

        <div style={S.searchWrap} className="fade-up">
          <Search size={15} color="var(--text-muted)" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
          <input className="input" style={{paddingLeft:38}} placeholder="Cerca programmi…" value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>

        {fetching ? (
          <div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}><div className="spinner" style={{width:28,height:28}}/></div>
        ) : filtered.length === 0 ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px 0'}}>
            <Package size={44} color="var(--text-muted)"/>
            <p style={{color:'var(--text-secondary)',marginTop:12,fontFamily:'var(--font-mono)',fontSize:14}}>
              {query ? 'Nessun risultato' : 'Nessun programma ancora'}
            </p>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}} className="programs-grid">
            {filtered.map(p => <ProgramCard key={p.id} program={p} onDownload={fetchPrograms} onDelete={id=>setPrograms(prev=>prev.filter(p=>p.id!==id))} onUpdate={fetchPrograms}/>)}
          </div>
        )}
      </div>
      <ToastContainer toasts={toast.toasts}/>
    </>
  );
}

function Spinner() {
  return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner" style={{width:32,height:32,borderWidth:3}}/></div>;
}

const S = {
  header:     { display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 },
  title:      { fontFamily:'var(--font-mono)', fontSize:26, fontWeight:700 },
  sub:        { color:'var(--text-muted)', fontSize:12, marginTop:3, fontFamily:'var(--font-mono)' },
  searchWrap: { position:'relative', marginBottom:20, maxWidth:440 },
};
