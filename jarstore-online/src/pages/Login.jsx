import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { BookOpen, AlertCircle, Users } from 'lucide-react';

const ERROR_MSG = {
  banned:      '🚫 Your account has been suspended.',
  full:        '🚫 The repository has reached the limit of 40 users.',
  auth_failed: 'Authentication failed. Please try again.',
  no_code:     'OAuth code missing. Please try again.',
};

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const error = params.get('error');
  useEffect(() => { if (user) navigate('/'); }, [user, navigate]);

  return (
    <div style={S.wrap}>
      <div style={S.blob1}/><div style={S.blob2}/>
      <div className="card fade-up" style={S.card}>
        <div style={{textAlign:'center'}}>
          <div style={S.iconBox}><BookOpen size={28} color="var(--accent)"/></div>
          <h1 style={S.title}>EngMapStore</h1>
          <p style={S.sub}>Mind Map Repository</p>
        </div>
        <div className="glow-line" style={{margin:'24px 0'}}/>
        <h2 style={{fontFamily:'var(--font-mono)',fontSize:18,marginBottom:8}}>Sign In</h2>
        <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:20,lineHeight:1.6}}>
          Browse and download mind maps. Upload your mind maps for review.
        </p>
        {error && (
          <div style={S.errBox}><AlertCircle size={15}/>{ERROR_MSG[error] || 'An error occurred.'}</div>
        )}
        <a href="/api/auth/github" style={S.ghBtn}>
          <GhIcon/> Continue with GitHub
        </a>
        <div style={S.infoBox}>
          <Users size={14} color="var(--text-muted)"/>
          <p style={{fontSize:12,color:'var(--text-muted)',lineHeight:1.6}}>
            New accounts are approved by an admin before uploading projects.<br/>
            Anti-spam: GitHub account &gt;5 days + at least 1 public repo.
          </p>
        </div>
      </div>
    </div>
  );
}

function GhIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

const S = {
  wrap:    { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:16, position:'relative', overflow:'hidden' },
  blob1:   { position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,210,255,0.08) 0%,transparent 70%)', top:'-15%', left:'5%', pointerEvents:'none' },
  blob2:   { position:'absolute', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.06) 0%,transparent 70%)', bottom:'-10%', right:'5%', pointerEvents:'none' },
  card:    { padding:'32px 28px', width:'100%', maxWidth:400, position:'relative' },
  iconBox: { width:56, height:56, borderRadius:14, background:'var(--bg-elevated)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', boxShadow:'0 0 20px rgba(0,210,255,0.12)' },
  title:   { fontFamily:'var(--font-mono)', fontSize:24, fontWeight:700 },
  sub:     { fontSize:12, color:'var(--text-muted)', marginTop:3 },
  errBox:  { display:'flex', alignItems:'flex-start', gap:8, padding:'10px 12px', background:'rgba(248,81,73,0.08)', border:'1px solid rgba(248,81,73,0.3)', borderRadius:'var(--radius-sm)', color:'var(--danger)', fontSize:13, marginBottom:14 },
  ghBtn:   { display:'flex', alignItems:'center', justifyContent:'center', gap:10, width:'100%', padding:'12px 16px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)', fontSize:14, fontWeight:600, cursor:'pointer', textDecoration:'none', transition:'all var(--transition)', marginBottom:16 },
  infoBox: { display:'flex', alignItems:'flex-start', gap:8, padding:'10px 12px', background:'rgba(0,0,0,0.2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' },
};
