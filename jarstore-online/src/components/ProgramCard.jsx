import { useState } from 'react';
import { Download, Terminal, HardDrive, Calendar, Trash2, Edit2, X, Check } from 'lucide-react';
import { apiFetch, useAuth } from '../hooks/useAuth.jsx';

const fmtSize = b => b ? (b>=1048576 ? `${(b/1048576).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`) : '—';
const fmtDate = s => new Date(s).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'});

export function ProgramCard({ program, onDownload, onDelete, onUpdate }) {
  const { user } = useAuth();
  const [showHow,     setShowHow]     = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [showDelConf, setShowDelConf] = useState(false);
  const [saving,      setSaving]      = useState(false);

  // Edit state
  const [editName, setEditName]         = useState(program.name);
  const [editDesc, setEditDesc]         = useState(program.description||'');
  const [editVersion, setEditVersion]   = useState(program.version||'1.0.0');
  const [editTags, setEditTags]         = useState(program.tags||'');
  const [editContribs, setEditContribs] = useState(program.contributors||'');

  const tags       = program.tags ? program.tags.split(',').map(t=>t.trim()).filter(Boolean) : [];
  const contributors = program.contributors ? program.contributors.split(',').map(t=>t.trim()).filter(Boolean) : [];

  const isAdmin   = ['admin','superadmin'].includes(user?.user_status);
  const isOwner   = user?.id === program.uploader_id;
  const contribs  = (program.contributors||'').split(',').map(s=>s.trim().replace('@','').toLowerCase());
  const isContrib = contribs.includes(user?.github_username?.toLowerCase());
  const canManage = isAdmin || isOwner || isContrib;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { url } = await apiFetch(`/api/programs/download?id=${program.id}`);
      const a = document.createElement('a');
      a.href = url; a.download = program.original_name; a.click();
      onDownload?.();
    } catch (e) { alert('Errore: ' + e.message); }
    finally { setTimeout(()=>setDownloading(false), 1500); }
  };

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/programs/manage?id=${program.id}`, { method:'DELETE' });
      setShowDelConf(false);
      onDelete?.(program.id);
    } catch(e) { alert('Errore: ' + e.message); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/programs/manage?id=${program.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName, description: editDesc,
          version: editVersion, tags: editTags, contributors: editContribs,
        }),
      });
      setEditing(false);
      onUpdate?.();
    } catch(e) { alert('Errore: ' + e.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="card fade-up" style={S.card}>
        {/* Edit mode */}
        {editing ? (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <input className="input" style={{fontSize:13}} value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Nome"/>
            <textarea className="textarea" style={{fontSize:13,minHeight:60}} value={editDesc} onChange={e=>setEditDesc(e.target.value)} placeholder="Descrizione"/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <input className="input" style={{fontSize:13}} value={editVersion} onChange={e=>setEditVersion(e.target.value)} placeholder="Versione"/>
              <input className="input" style={{fontSize:13}} value={editTags} onChange={e=>setEditTags(e.target.value)} placeholder="Tag (virgola)"/>
            </div>
            <input className="input" style={{fontSize:13}} value={editContribs} onChange={e=>setEditContribs(e.target.value)} placeholder="Collaboratori (virgola)"/>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(false)}><X size={13}/>Annulla</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" style={{width:13,height:13}}/> : <Check size={13}/>}Salva
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={S.header}>
              <div style={S.icon}>☕</div>
              <div style={{flex:1,minWidth:0}}>
                <h3 style={S.name}>{program.name}</h3>
                <span style={S.ver}>v{program.version}</span>
              </div>
              {canManage && (
                <div style={{display:'flex',gap:4,flexShrink:0}}>
                  <button className="btn btn-ghost btn-sm" style={{padding:'4px 8px'}} onClick={()=>setEditing(true)} title="Modifica">
                    <Edit2 size={13}/>
                  </button>
                  <button className="btn btn-danger btn-sm" style={{padding:'4px 8px'}} onClick={()=>setShowDelConf(true)} title="Elimina">
                    <Trash2 size={13}/>
                  </button>
                </div>
              )}
            </div>

            {program.description && <p style={S.desc}>{program.description}</p>}
            {tags.length > 0 && <div style={S.tags}>{tags.map((t,i)=><span key={i} className="badge badge-purple">{t}</span>)}</div>}
            <div className="glow-line" style={{margin:'10px 0'}}/>

            {program.uploader && (
              <div style={S.uploaderRow}>
                <img src={program.uploader_avatar||'https://github.com/ghost.png'} style={S.uploaderAvatar} alt=""/>
                <span style={S.uploaderName}>@{program.uploader}</span>
                {contributors.length > 0 && <span style={S.contribs}>+ {contributors.join(', ')}</span>}
              </div>
            )}

            <div style={S.footer}>
              <div style={S.stats}>
                <span style={S.stat}><HardDrive size={11}/>{fmtSize(program.file_size)}</span>
                <span style={S.stat}><Download  size={11}/>{program.download_count}</span>
                <span style={S.stat}><Calendar  size={11}/>{fmtDate(program.created_at)}</span>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowHow(true)}><Terminal size={13}/>Guida</button>
                <button className="btn btn-primary btn-sm" onClick={handleDownload} disabled={downloading}>
                  {downloading?<span className="spinner" style={{width:13,height:13}}/>:<Download size={13}/>}
                  Download
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Conferma eliminazione */}
      {showDelConf && (
        <div className="modal-overlay" onClick={()=>setShowDelConf(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3 style={{fontFamily:'var(--font-mono)',marginBottom:12}}>Elimina {program.name}?</h3>
            <p style={{fontSize:14,color:'var(--text-secondary)',marginBottom:20}}>
              Il file .jar verrà eliminato definitivamente dallo storage. Questa azione non è reversibile.
            </p>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowDelConf(false)}>Annulla</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}><Trash2 size={13}/>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* Come usare */}
      {showHow && (
        <div className="modal-overlay" onClick={()=>setShowHow(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3 style={{fontFamily:'var(--font-mono)',marginBottom:14}}>Come eseguire {program.name}</h3>
            <code style={{display:'block',padding:'12px',background:'var(--bg-base)',borderRadius:'var(--radius-sm)',fontSize:13,wordBreak:'break-all'}}>
              java -jar {program.original_name}
            </code>
            <p style={{color:'var(--text-muted)',fontSize:12,marginTop:10}}>
              Serve Java: <a href="https://adoptium.net" target="_blank" rel="noreferrer">adoptium.net</a>
            </p>
            <div style={{display:'flex',gap:10,marginTop:18,justifyContent:'flex-end'}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowHow(false)}>Chiudi</button>
              <button className="btn btn-primary btn-sm" onClick={()=>{handleDownload();setShowHow(false);}}>
                <Download size={13}/>Scarica
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const S = {
  card:          { padding:16, display:'flex', flexDirection:'column', gap:10 },
  header:        { display:'flex', alignItems:'flex-start', gap:10 },
  icon:          { width:38, height:38, borderRadius:8, background:'var(--bg-elevated)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 },
  name:          { fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, marginBottom:2, wordBreak:'break-word' },
  ver:           { fontSize:11, color:'var(--accent)', fontFamily:'var(--font-mono)' },
  desc:          { fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 },
  tags:          { display:'flex', flexWrap:'wrap', gap:5 },
  uploaderRow:   { display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' },
  uploaderAvatar:{ width:18, height:18, borderRadius:'50%', border:'1px solid var(--border)', flexShrink:0 },
  uploaderName:  { fontSize:12, color:'var(--text-secondary)', fontFamily:'var(--font-mono)' },
  contribs:      { fontSize:11, color:'var(--text-muted)' },
  footer:        { display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' },
  stats:         { display:'flex', gap:10, flexWrap:'wrap' },
  stat:          { display:'flex', alignItems:'center', gap:3, fontSize:11, color:'var(--text-muted)' },
};
