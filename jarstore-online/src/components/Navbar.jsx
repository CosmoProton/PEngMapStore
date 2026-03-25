import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, STATUS_LABELS } from '../hooks/useAuth.jsx';
import { Package, Shield, LogOut, Home, Upload, Users } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAdmin = ['admin','superadmin','teacher'].includes(user?.user_status);
  const sl = user ? STATUS_LABELS[user.user_status] : null;

  return (
    <nav style={S.nav} className="glass">
      <div style={S.inner} className="nav-inner">
        
        {/* Riga superiore su mobile: Logo + Utente */}
        <div className="nav-header-row" style={S.headerRow}>
          <Link to="/" style={S.logo}>
            <Package size={24} color="var(--accent)" />
            <span style={S.logoTxt}>JarStore</span>
          </Link>

          {user ? (
            <div style={S.userArea}>
              <div style={S.userInfo} className="hide-mobile">
                <span style={S.uname}>{user.github_username}</span>
                {sl && <span style={{fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)'}}>{sl.label}</span>}
              </div>
              <img src={user.avatar_url} alt="avatar" style={S.avatar}/>
              <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-ghost btn-sm" style={{padding: '6px', borderRadius: '50%'}}>
                <LogOut size={16}/>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Accedi</Link>
          )}
        </div>
        
        {/* Riga inferiore: Link di navigazione */}
        <div style={S.links} className="nav-links">
          {user && (
            <>
              <Link to="/" style={{...S.link, ...(pathname==='/'?S.linkOn:{})}}>
                <Home size={16}/> <span className="hide-mobile-text">Programmi</span>
              </Link>
              {['active','whitelisted','admin','superadmin','teacher'].includes(user.user_status) && (
                <Link to="/submit" style={{...S.link, ...(pathname==='/submit'?S.linkOn:{})}}>
                  <Upload size={16}/> <span className="hide-mobile-text">Carica</span>
                </Link>
              )}
              <Link to="/contributors" style={{...S.link, ...(pathname==='/contributors'?S.linkOn:{})}}>
                <Users size={16}/> <span className="hide-mobile-text">Credits</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" style={{...S.link, ...(pathname==='/admin'?S.linkOn:{})}}>
                  <Shield size={16}/> <span className="hide-mobile-text">Admin</span>
                </Link>
              )}
            </>
          )}
        </div>

      </div>
    </nav>
  );
}

const S = {
  nav:       { position:'fixed', top:0, left:0, right:0, zIndex:100, borderBottom:'none' },
  inner:     { maxWidth:1200, margin:'0 auto', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  headerRow: { display:'flex', alignItems:'center', gap: 16 },
  logo:      { display:'flex', alignItems:'center', gap:10, textDecoration:'none' },
  logoTxt:   { fontFamily:'var(--font-mono)', fontSize:20, fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.5px' },
  links:     { display:'flex', alignItems:'center', gap:8, background:'rgba(0,0,0,0.2)', padding:'6px', borderRadius:'30px', border:'1px solid var(--glass-border)' },
  link:      { display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:'24px', fontSize:14, fontWeight:500, color:'var(--text-secondary)', transition:'all var(--transition)' },
  linkOn:    { color:'var(--text-primary)', background:'var(--glass-highlight)', boxShadow:'0 2px 10px rgba(0,0,0,0.2)' },
  userArea:  { display:'flex', alignItems:'center', gap:12 },
  userInfo:  { display:'flex', flexDirection:'column', alignItems:'flex-end' },
  uname:     { fontSize:14, fontWeight:600, color:'var(--text-primary)' },
  avatar:    { width:38, height:38, borderRadius:'50%', border:'2px solid var(--glass-border)', objectFit:'cover' },
};