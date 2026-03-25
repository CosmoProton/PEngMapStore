import { useState } from 'react';
import { Download, Terminal, HardDrive, Calendar, Trash2, Edit2, X, Check, RefreshCw, Coffee } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { apiFetch, useAuth } from '../hooks/useAuth.jsx';

const fmtSize = b => b ? (b>=1048576 ? `${(b/1048576).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`) : '—';
const fmtDate = s => new Date(s).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'});

export function ProgramCard({ program, onDownload, onDelete, onUpdate }) {
  const { user } = useAuth();
  const [showHow, setShowHow] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDelConf, setShowDelConf] = useState(false);
  const [newJar, setNewJar] = useState(null);
  const [replacingJar, setReplacingJar] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState(program.name);
  const [editDesc, setEditDesc] = useState(program.description||'');
  const [editVersion, setEditVersion] = useState(program.version||'1.0.0');
  const [editTags, setEditTags] = useState(program.tags||'');
  const [editContribs, setEditContribs] = useState(program.contributors||'');

  const tags = program.tags ? program.tags.split(',').map(t=>t.trim()).filter(Boolean) : [];
  const contributors = program.contributors ? program.contributors.split(',').map(t=>t.trim()).filter(Boolean) : [];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { url } = await apiFetch(`/api/programs/manage?id=${program.id}`);
      const a = document.createElement('a');
      a.href = url; a.download = program.original_name; a.click();
      onDownload?.();
    } catch (e) { alert('Errore: ' + e.message); }
    finally { setTimeout(()=>setDownloading(false), 1500); }
  };

  const isAdmin = ['admin','superadmin'].includes(user?.user_status);
  const isOwner = user?.id === program.uploader_id;
  const contribs = (program.contributors||'').split(',').map(s=>s.trim().replace('@','').toLowerCase());
  const isContrib = contribs.includes(user?.github_username?.toLowerCase());
  const canManage = isAdmin || isOwner || isContrib;

  return (
    <>
      <div className="card fade-up glass" style={S.card}>
        {editing ? (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <p style={{fontFamily:'var(--font-mono)', fontSize:14, color:'var(--accent)'}}>// Edit Mode</p>
            <button className="btn btn-ghost" onClick={()=>setEditing(false)}>Chiudi editor</button>
          </div>
        ) : (
          <>
            <div style={S.header}>
              <div style={S.iconBox}>
                <Coffee size={24} color="var(--text-primary)"/>
              </div>
              <div style={S.headerText}>
                <h3 style={S.name}>{program.name}</h3>
                <span style={S.ver}>v{program.version}</span>
              </div>
              
              {canManage && (
                <div style={S.actions}>
                  <button className="btn btn-ghost btn-sm" style={{padding: '6px'}} onClick={()=>setEditing(true)} title="Modifica"><Edit2 size={14}/></button>
                  <button className="btn btn-ghost btn-sm" style={{padding: '6px', color: 'var(--danger)'}} onClick={()=>setShowDelConf(true)} title="Elimina"><Trash2 size={14}/></button>
                </div>
              )}
            </div>

            <p style={S.desc}>{program.description || 'Nessuna descrizione.'}</p>
            
            {tags.length > 0 && (
              <div style={S.tags}>
                {tags.map((t,i) => <span key={i} className="badge">{t}</span>)}
              </div>
            )}

            <div className="glow-line" />

            {program.uploader && (
              <div style={S.uploaderRow}>
                <img src={program.uploader_avatar||'https://github.com/ghost.png'} style={S.uploaderAvatar} alt=""/>
                <span style={S.uploaderName}>@{program.uploader}</span>
                {contributors.length > 0 && <span style={{fontSize:11, color:'var(--text-muted)'}}>+ {contributors.length} devs</span>}
              </div>
            )}

            <div style={S.footer}>
              <div style={S.techSpecs}>
                <span title="Size"><HardDrive size={12}/> {fmtSize(program.file_size)}</span>
                <span title="Date"><Calendar size={12}/> {fmtDate(program.created_at)}</span>
              </div>
              
              <div style={{display:'flex', gap:8}}>
                <button className="btn btn-ghost btn-sm" style={{borderRadius: '50%', padding: '10px'}} onClick={()=>setShowHow(true)} title="Istruzioni">
                  <Terminal size={14}/>
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleDownload} disabled={downloading}>
                  {downloading ? <span className="spinner" style={{width:14,height:14}}/> : <Download size={16}/>}
                  Get
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

const S = {
  card:       { padding: 24, display:'flex', flexDirection:'column', gap: 16 },
  header:     { display:'flex', alignItems:'center', gap: 16 },
  iconBox:    { width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))', border: '1px solid var(--glass-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
  headerText: { flex: 1, minWidth: 0 },
  name:       { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 },
  ver:        { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: '8px' },
  actions:    { display:'flex', gap: 2, background: 'rgba(0,0,0,0.2)', borderRadius: '20px', padding: '4px', border: '1px solid var(--glass-border)' },
  desc:       { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 },
  tags:       { display:'flex', flexWrap:'wrap', gap: 8 },
  uploaderRow:{ display:'flex', alignItems:'center', gap: 8, marginTop: -4 },
  uploaderAvatar:{ width:20, height:20, borderRadius:'50%', border:'1px solid var(--glass-border)' },
  uploaderName:{ fontSize:12, color:'var(--text-primary)', fontFamily:'var(--font-mono)' },
  footer:     { display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 'auto' },
  techSpecs:  { display:'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' },
};