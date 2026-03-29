import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    const token   = params.get('token');
    const welcome = params.get('welcome');
    if (token) {
      login(token);
      // Redirect con flag welcome per mostrare popup
      navigate(welcome ? '/?welcome=1' : '/', { replace: true });
    } else {
      navigate('/login?error=auth_failed', { replace: true });
    }
  }, []);

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
      <div className="spinner" style={{width:32,height:32,borderWidth:3}}/>
      <p style={{color:'var(--text-secondary)',fontFamily:'var(--font-mono)',fontSize:14}}>Signing in…</p>
    </div>
  );
}
