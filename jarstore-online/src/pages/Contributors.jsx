import { useState, useEffect } from 'react';
import { Github, Code2, Cpu, ShieldCheck, TerminalSquare } from 'lucide-react';
import { apiFetch, STATUS_LABELS } from '../hooks/useAuth.jsx';

const HARDCODED_CONTRIBUTORS = [
  { username:'CosmoUniverso', name:'Cosmo', role:'Lead Developer & Admin', contributions:['Backend','Auth','Deploy','DB'] },
  { username:'gabrielerada07', name:'Gabriele', role:'Collaboratore', contributions:['Frontend','UI/UX','Testing'] },
];

const TECH = [
  { name:'React 18', desc:'Interfaccia Utente', color:'#61dafb' },
  { name:'Vite', desc:'Build Tool', color:'#fbbf24' },
  { name:'Vercel', desc:'Hosting & Serverless', color:'#ffffff' },
  { name:'Supabase', desc:'Database & Storage', color:'#3ecf8e' },
  { name:'OAuth', desc:'Autenticazione GitHub', color:'var(--accent)' },
  { name:'JWT', desc:'Gestione Sessioni sicure', color:'#e879f9' },
];

export default function Contributors() {
  const [data, setData] = useState({ admins:[], contributors:[] });

  useEffect(() => {
    apiFetch('/api/admin/data?type=contributors').then(setData).catch(()=>{});
  }, []);

  const allAdmins = data.admins || [];
  const extraContributors = data.contributors || [];

  return (
    <div className="page-wide">
      
      {/* 1. HERO SECTION (Introduzione Progetto) */}
      <div className="fade-up" style={{ textAlign: 'center', margin: '40px 0 60px 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--accent-dim)', border: '1px solid rgba(10,132,255,0.2)', borderRadius: 20, marginBottom: 20 }}>
          <Cpu size={14} color="var(--accent)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.5px' }}>TPSIT DEMO LAB</span>
        </div>
        
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, letterSpacing: '-1.5px', marginBottom: 16, lineHeight: 1.1 }}>
          Il repository dei tuoi <br/>
          <span style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
             Progetti Java
          </span>
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(15px, 2vw, 18px)', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>
          JarStore è la piattaforma cloud creata per semplificare la condivisione, 
          la revisione e il download dei file <code>.jar</code> sviluppati durante le ore di laboratorio. 
          Un ambiente sicuro per testare e distribuire codice.
        </p>
      </div>

      {/* 2. STAFF ATTIVO E ADMIN (Spostati in alto) */}
      {allAdmins.length > 0 && (
        <div className="fade-up" style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <ShieldCheck size={16} color="var(--success)"/> Staff Attivo
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {allAdmins.map(a => {
              const sl = STATUS_LABELS[a.user_status] || {};
              return (
                <a key={a.id} href={`https://github.com/${a.github_username}`} target="_blank" rel="noreferrer" className="card glass"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: '30px', textDecoration: 'none', transition: 'transform var(--transition)', ':hover': { transform: 'translateY(-2px)' } }}>
                  <img src={a.avatar_url||'https://github.com/ghost.png'} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--glass-border)' }} alt=""/>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>@{a.github_username}</span>
                  <span className={`badge ${sl.cls||'badge-gray'}`} style={{ fontSize: 10 }}>{sl.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CORE TEAM (Contributori Hardcoded) */}
      <div className="fade-up" style={{ marginBottom: 48 }}>
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
          <Code2 size={16} color="var(--accent)"/> Sviluppatori Principali
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {HARDCODED_CONTRIBUTORS.map(c => (
            <div key={c.username} className="card glass" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <img src={`https://github.com/${c.username}.png?size=80`} alt={c.username}
                  style={{ width: 56, height: 56, borderRadius: '16px', border: '1px solid var(--glass-border)', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>{c.name}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>{c.role}</p>
                </div>
                <a href={`https://github.com/${c.username}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ padding: '8px', borderRadius: '50%' }}>
                  <Github size={18}/>
                </a>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {c.contributions.map(t => <span key={t} className="badge badge-gray">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Altri Contributori dal DB */}
      {extraContributors.length > 0 && (
        <div className="fade-up" style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Hanno contribuito
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {extraContributors.map(u => (
              <a key={u.id} href={`https://github.com/${u.github_username}`} target="_blank" rel="noreferrer" className="glass"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: '20px', textDecoration: 'none' }}>
                <img src={u.avatar_url||'https://github.com/ghost.png'} style={{ width: 20, height: 20, borderRadius: '50%' }} alt=""/>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>@{u.github_username}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 4. STACK TECNOLOGICO */}
      <div className="fade-up" style={{ marginBottom: 60 }}>
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
          <TerminalSquare size={16} color="var(--accent2)"/> Stack Tecnologico
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {TECH.map(t => (
            <div key={t.name} className="card glass" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0, boxShadow: `0 0 10px ${t.color}` }}/>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. FOOTER / LINK GITHUB */}
      <div className="fade-up glass" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderRadius: 'var(--radius-lg)', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Codice Sorgente Open Source</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Consulta il codice, segnala bug o proponi modifiche.</p>
        </div>
        <a href="https://github.com/CosmoUniverso/TpsitDemoLab" target="_blank" rel="noreferrer" className="btn btn-primary">
          <Github size={16}/> Vai su GitHub
        </a>
      </div>

    </div>
  );
}