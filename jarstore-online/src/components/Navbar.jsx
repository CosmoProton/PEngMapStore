import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, STATUS_LABELS } from '../hooks/useAuth.jsx';
import { Package, Shield, LogOut, Home, Upload, Info } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAdmin = ['admin','superadmin','teacher'].includes(user?.user_status);
  const sl = user ? STATUS_LABELS[user.user_status] : null;

  return (
    <nav style={S.nav} className="glass">
      <div style={S.inner}>
        
        {/* LATO SINISTRO: Logo + Profilo Utente */}
        <div style={S.leftSide}>
          <Link to="/" style={S.logo}>
            <Package size={24} color="var(--accent)" />
            <span style={S.logoTxt} className="hide-mobile-text">JarStore</span>
          </Link>

          {user && (
            <>
              <div style={S.divider} className="hide-mobile" />
              <div style={S.userArea}>
                <img src={user.avatar_url} alt="avatar" style={S.avatar}/>
                <div style={S.userInfo} className="hide-mobile-text">
                  <span style={S.uname}>{user.github_username}</span>
                  {sl && <span style={{fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)'}}>{sl.label}</span>}
                </div>
                <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-ghost btn-sm" style={{padding: '6px', borderRadius: '50%', marginLeft: '4px'}} title="Logout">
                  <LogOut size={16} color="var(--danger)"/>
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* LATO DESTRO: Link Navigazione / Tasto Accedi */}
        <div style={S.rightSide} className="nav-links-container">
          {user ? (
            <div style={S.links} className="nav-links">
              <Link to="/" style={{...S.link, ...(pathname==='/'?S.linkOn:{})}}>
                <Home size={16}/> <span className="hide-mobile-text">Programmi</span>
              </Link>
              {['active','whitelisted','admin','superadmin','teacher'].includes(user.user_status) && (
                <Link to="/submit" style={{...S.link, ...(pathname==='/submit'?S.linkOn:{})}}>
                  <Upload size={16}/> <span className="hide-mobile-text">Carica</span>
                </Link>
              )}
              <Link to="/contributors" style={{...S.link, ...(pathname==='/contributors'?S.linkOn:{})}}>
                <Info size={16}/> <span className="hide-mobile-text">Info</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" style={{...S.link, ...(pathname==='/admin'?S.linkOn:{})}}>
                  <Shield size={16}/> <span className="hide-mobile-text">Admin</span>
                </Link>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Accedi</Link>
          )}
        </div>

      </div>
    </nav>
  );
}

const S = {
  nav:       { position:'fixed', top:0, left:0, right:0, zIndex:100, borderBottom:'none' },
  inner:     { maxWidth:1280, margin:'0 auto', padding:'10px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  
  /* Layout Flexbox */
  leftSide:  { display:'flex', alignItems:'center', gap: 16 },
  rightSide: { display:'flex', alignItems:'center' },
  divider:   { width: 1, height: 24, background: 'var(--glass-border)' },
  
  /* Logo */
  logo:      { display:'flex', alignItems:'center', gap:10, textDecoration:'none' },
  logoTxt:   { fontFamily:'var(--font-mono)', fontSize:20, fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.5px' },
  
  /* Utente */
  userArea:  { display:'flex', alignItems:'center', gap:10, padding: '4px 12px 4px 4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '30px' },
  userInfo:  { display:'flex', flexDirection:'column', alignItems:'flex-start' },
  uname:     { fontSize:13, fontWeight:600, color:'var(--text-primary)', lineHeight: 1.2 },
  avatar:    { width:32, height:32, borderRadius:'50%', border:'2px solid var(--glass-border)', objectFit:'cover' },
  
  /* Navigazione */
  links:     { display:'flex', alignItems:'center', gap:6, background:'rgba(0,0,0,0.2)', padding:'6px', borderRadius:'30px', border:'1px solid var(--glass-border)' },
  link:      { display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:'24px', fontSize:14, fontWeight:500, color:'var(--text-secondary)', transition:'all var(--transition)' },
  linkOn:    { color:'var(--text-primary)', background:'var(--glass-highlight)', boxShadow:'0 2px 10px rgba(0,0,0,0.2)' },
};