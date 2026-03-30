import { useState } from 'react';
import { Download, HardDrive, Calendar, Trash2, Edit2, X, Check, Coffee, Info, Users } from 'lucide-react';
import { apiFetch, useAuth } from '../hooks/useAuth.jsx';
// --- AGGIUNTA MARKDOWN ---
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const fmtSize = b => b ? (b>=1048576 ? `${(b/1048576).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`) : '—';
const fmtDate = s => new Date(s).toLocaleDateString('en-US',{day:'2-digit',month:'short',year:'numeric'});

export function ProgramCard({ program, onDownload, onDelete, onUpdate }) {
  const { user } = useAuth();
  const [showInfo, setShowInfo] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDelConf, setShowDelConf] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState(program.name);
  const [editDesc, setEditDesc] = useState(program.description||'');
  const [editVersion, setEditVersion] = useState(program.version||'1.0.0');
  const [editTags, setEditTags] = useState(program.tags||'');
  const [editContribs, setEditContribs] = useState(program.contributors||'');

  const tags = program.tags ? program.tags.split(',').map(t=>t.trim()).filter(Boolean) : [];
  
  // FIX: Cleanup to avoid double @@ (remove @ if already present)
  const contributors = program.contributors 
    ? program.contributors.split(',').map(t=>t.trim().replace(/^@/, '')).filter(Boolean) 
    : [];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { url } = await apiFetch(`/api/programs/manage?id=${program.id}`);
      const a = document.createElement('a');
      a.href = url; a.download = program.original_name; a.click();
      onDownload?.();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setTimeout(()=>setDownloading(false), 1500); }
  };

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/programs/manage?id=${program.id}`, { method:'DELETE' });
      setShowDelConf(false);
      onDelete?.(program.id);
    } catch(e) { alert('Error: ' + e.message); }
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
    } catch(e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const isAdmin = ['admin','superadmin'].includes(user?.user_status);
  const isOwner = user?.id === program.uploader_id;
  const contribsLower = (program.contributors||'').split(',').map(s=>s.trim().replace('@','').toLowerCase());
  const isContrib = contribsLower.includes(user?.github_username?.toLowerCase());
  const canManage = isAdmin || isOwner || isContrib;

  return (
    <>
      <div className="card fade-up glass" style={S.card}>
        {editing ? (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <p style={{fontFamily:'var(--font-mono)', fontSize:14, color:'var(--accent)'}}>{'//'} Edit Mode</p>
              <button className="btn btn-ghost btn-sm" style={{padding:'4px'}} onClick={()=>setEditing(false)}><X size={16}/></button>
            </div>
            
            <input className="input" style={{fontSize:13}} value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Name"/>
            <textarea className="textarea" style={{fontSize:13,minHeight:120, fontFamily:'var(--font-mono)'}} value={editDesc} onChange={e=>setEditDesc(e.target.value)} placeholder="Full description (Markdown)"/>
            
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <input className="input" style={{fontSize:13}} value={editVersion} onChange={e=>setEditVersion(e.target.value)} placeholder="Version"/>
              <input className="input" style={{fontSize:13}} value={editTags} onChange={e=>setEditTags(e.target.value)} placeholder="Tags (comma separated)"/>
            </div>
            <input className="input" style={{fontSize:13}} value={editContribs} onChange={e=>setEditContribs(e.target.value)} placeholder="Collaborators (comma separated)"/>
            
            <button className="btn btn-primary btn-sm" style={{justifyContent:'center', marginTop:8}} onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" style={{width:13,height:13}}/> : <Check size={14}/>} Save Changes
            </button>
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
                  <button className="btn btn-ghost btn-sm" style={{padding: '6px', color: 'var(--danger)'}} onClick={()=>setShowDelConf(true)} title="Delete"><Trash2 size={14}/></button>
                </div>
              )}
            </div>

            {/* MARKDOWN PREVIEW */}
            <div style={S.descPreview} className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {program.description || 'No description provided.'}
              </ReactMarkdown>
            </div>
            
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
                <button className="btn btn-ghost btn-sm" style={{padding: '8px 12px', borderRadius: '20px'}} onClick={()=>setShowInfo(true)}>
                  <Info size={14}/> Info
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

      {/* INFO MODAL WITH FULL MARKDOWN */}
      {showInfo && (
        <div className="modal-overlay" onClick={()=>setShowInfo(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth: 600, maxHeight: '85vh', display: 'flex', flexDirection: 'column'}}>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: '1px solid var(--glass-border)', paddingBottom: 16}}>
              <div>
                <h3 style={{fontFamily:'var(--font-sans)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px'}}>{program.name}</h3>
                <span style={{fontFamily:'var(--font-mono)', fontSize: 13, color: 'var(--accent)'}}>v{program.version}</span>
              </div>
              <button className="btn btn-ghost btn-sm" style={{padding: '6px', borderRadius: '50%'}} onClick={()=>setShowInfo(false)}><X size={20}/></button>
            </div>
            
            <div style={{flex: 1, overflowY: 'auto', paddingRight: 8, marginBottom: 20}} className="full-markdown-container">
              <h4 style={{fontSize: 14, color: 'var(--text-primary)', marginBottom: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px'}}>Full Description</h4>
              <div style={{color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 24}}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {program.description || "No description provided by the author."}
                </ReactMarkdown>
              </div>

              <h4 style={{fontSize: 14, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px'}}>How to run</h4>
              <code style={{display:'block',padding:'14px',background:'rgba(0,0,0,0.4)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-sm)',fontSize:13,wordBreak:'break-all', color: 'var(--text-primary)', fontFamily:'var(--font-mono)'}}>
                <span style={{color: 'var(--accent)'}}>$</span> conceptual map {program.original_name}
              </code>
            </div>
            
            <div style={{display:'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: 16, flexWrap: 'wrap', gap: 16}}>
              <div style={{flex: 1, minWidth: 200}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, marginBottom: 4}}>
                  <Users size={14}/> <span>Creation team</span>
                </div>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 6}}>
                  <span className="badge badge-gray">@{program.uploader} (Uploader)</span>
                  {contributors.map((c, i) => (
                    <span key={i} className="badge badge-gray">@{c}</span>
                  ))}
                </div>
              </div>
              
              <button className="btn btn-primary" onClick={()=>{handleDownload();setShowInfo(false);}} disabled={downloading}>
                {downloading ? <span className="spinner" style={{width:16,height:16}}/> : <Download size={16}/>}
                Download .jar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDelConf && (
        <div className="modal-overlay" onClick={()=>setShowDelConf(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth: 400}}>
            <h3 style={{fontFamily:'var(--font-mono)',marginBottom:16}}>Delete {program.name}?</h3>
            <p style={{fontSize:14,color:'var(--text-secondary)',marginBottom:24, lineHeight:1.5}}>
              The file will be permanently removed from the server. This action is <strong>irreversible</strong>.
            </p>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-ghost" onClick={()=>setShowDelConf(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={14}/> Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const S = {
  card:         { padding: 24, display:'flex', flexDirection:'column', gap: 16 },
  header:       { display:'flex', alignItems:'center', gap: 16 },
  iconBox:      { width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))', border: '1px solid var(--glass-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
  headerText:   { flex: 1, minWidth: 0 },
  name:         { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 },
  ver:          { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: '8px' },
  actions:      { display:'flex', gap: 2, background: 'rgba(0,0,0,0.2)', borderRadius: '20px', padding: '4px', border: '1px solid var(--glass-border)' },
  
  descPreview:  { 
    fontSize: 14, 
    color: 'var(--text-secondary)', 
    lineHeight: 1.6,
    display: '-webkit-box',
    WebkitLineClamp: 2, 
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  
  tags:          { display:'flex', flexWrap:'wrap', gap: 8 },
  uploaderRow:   { display:'flex', alignItems:'center', gap: 8, marginTop: -4 },
  uploaderAvatar: { width:20, height:20, borderRadius:'50%', border:'1px solid var(--glass-border)' },
  uploaderName: { fontSize:12, color:'var(--text-primary)', fontFamily:'var(--font-mono)' },
  footer:        { display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 'auto' },
  techSpecs:     { display:'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' },
};
