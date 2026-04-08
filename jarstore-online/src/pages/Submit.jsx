import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth, apiFetch, STATUS_LABELS } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ToastContainer.jsx';
import { Upload, FileCode, XCircle, AlertCircle, CheckCircle } from 'lucide-react';

export default function Submit() {
  const { user, loading } = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();
  
  const [file, setFile]                 = useState(null);
  const [name, setName]                 = useState('');
  const [desc, setDesc]                 = useState('');
  const [version, setVersion]           = useState('1.0.0');
  const [tags, setTags]                 = useState('');
  const [contributors, setContributors] = useState('');
  
  // --- STATI PER L'AUTOCOMPLETE ---
  const [knownUsers, setKnownUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  
  const [uploading, setUploading]       = useState(false);
  const [progress, setProgress]         = useState(0);
  const [step, setStep]                 = useState('');

  // 1. Recupera la lista degli utenti noti all'avvio del componente
  useEffect(() => {
    apiFetch('/api/admin/data?type=contributors')
      .then(data => {
        // Uniamo admin e contributor e prendiamo solo gli username unici
        const users = [...(data.admins || []), ...(data.contributors || [])];
        const usernames = [...new Set(users.map(u => u.github_username))];
        setKnownUsers(usernames);
      })
      .catch(() => {});
  }, []);

  const onDrop = useCallback(accepted => {
    // MODIFICATO: Rimuove l'estensione dinamicamente per qualsiasi tipo di file invece di cercare solo ".jar"
    if (accepted[0]) { 
      setFile(accepted[0]); 
      if (!name) setName(accepted[0].name.replace(/\.[^/.]+$/, "")); 
    }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    // MODIFICATO: Rimossa la proprietà "accept" per consentire tutti i file
    maxFiles: 1, maxSize: 100*1024*1024,
    // MODIFICATO: Aggiornato il messaggio di errore
    onDropRejected: () => toast.error('The file is too big (max 100MB)'), 
  });

  // 2. Logica che si attiva ogni volta che digiti un collaboratore
  const handleContributorsChange = (e) => {
    const val = e.target.value;
    setContributors(val);

    // Trova la parola che l'utente sta digitando (dopo l'ultima virgola)
    const parts = val.split(',');
    const currentWord = parts[parts.length - 1].trim().replace('@', '');

    if (currentWord.length > 0) {
      // Filtra gli utenti che contengono le lettere digitate
      const matches = knownUsers.filter(u => u.toLowerCase().includes(currentWord.toLowerCase()));
      setFilteredSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // 3. Logica per applicare il suggerimento cliccato
  const acceptSuggestion = (username) => {
    const parts = contributors.split(',');
    parts.pop(); // Rimuoviamo il frammento incompleto appena digitato
    
    // Ricostruiamo la stringa con il nuovo utente formattato bene
    const newVal = parts.length > 0
      ? parts.map(p => p.trim()).join(', ') + `, @${username}, `
      : `@${username}, `;
      
    setContributors(newVal);
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    // MODIFICATO: Aggiornato il messaggio di errore
    if (!file)        return toast.error('Select a file'); 
    if (!name.trim()) return toast.error('Insert the title');
    setUploading(true); setProgress(0);
    try {
      setStep('uploading');
      const { uploadUrl, filePath } = await apiFetch('/api/upload-url', {
        method:'POST', body: JSON.stringify({ filename: file.name }),
      });

      console.log("STEP 1 OK");
      console.log("uploadUrl =", uploadUrl);
      console.log("filePath =", filePath);
      console.log("file.name =", file.name);
      console.log("file.type =", file.type);

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) setProgress(Math.round(e.loaded/e.total*100));
        });
        xhr.addEventListener('load', () => {
          console.log("STEP 2 RESPONSE");
          console.log("status =", xhr.status);
          console.log("response =", xhr.responseText);
        
          if (xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.open('PUT', uploadUrl);
        // MODIFICATO: Usa il Content-Type reale del file caricato, o un fallback generico
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream'); 
        xhr.send(file);
      });

      setStep('submitting');
      await apiFetch('/api/programs/submit', {
        method:'POST',
        body: JSON.stringify({
          name: name.trim(), description: desc.trim(),
          version: version.trim()||'1.0.0', tags: tags.trim(),
          contributors: contributors.trim(),
          filePath, originalName: file.name, fileSize: file.size,
        }),
      });

      setStep('done');
      toast.success('Sent! L\'The admin will review it shortly.');
      setTimeout(() => navigate('/'), 2000);
    } catch(e) {
      console.error("ERRORE COMPLETO:", e);
      toast.error(e.message);
      setStep('');
    } finally { setUploading(false); }
  };

  if (loading) return null;
  if (!user) { navigate('/login'); return null; }

  const sl = STATUS_LABELS[user.user_status];
  const maxP = user.user_status==='whitelisted' ? 5 : user.user_status==='active' ? 2 : null;
  const dropBorder = isDragReject?'var(--danger)':isDragActive?'var(--accent)':file?'var(--success)':'var(--glass-border)';

  return (
    <>
      <div className="page" style={{maxWidth:660}}>
        <div className="fade-up" style={{marginBottom:24}}>
          <h1 style={{fontFamily:'var(--font-mono)',fontSize:26,fontWeight:700}}>
            <span style={{color:'var(--accent)'}}>{'//'} </span>Load maps
          </h1>
          <p style={{color:'var(--text-muted)',fontSize:12,marginTop:4,fontFamily:'var(--font-mono)'}}>
            It will be reviewed by the admin before being published.
          </p>
        </div>

        {/* Banner status */}
        {['whitelisted','admin','superadmin'].includes(user.user_status) && (
          <div style={{...S.banner, borderColor:'rgba(48, 209, 88, 0.3)', background:'rgba(48, 209, 88, 0.06)'}} className="fade-up">
            <CheckCircle size={15} color="var(--success)"/>
            <span style={{fontSize:13,color:'var(--success)'}}>
              Account <strong>{sl?.label}</strong> {maxP ? ` — max ${maxP} progetti approvati` : ' — nessun limite'}
            </span>
          </div>
        )}
        {user.user_status === 'active' && (
          <div style={S.banner} className="fade-up">
            <AlertCircle size={15} color="var(--warning)"/>
            <span style={{fontSize:13,color:'var(--text-secondary)'}}>
              Account <strong style={{color:'var(--warning)'}}>Utente</strong> — max 2 progetti approvati · 1 in revisione
            </span>
          </div>
        )}

        <div className="card fade-up glass" style={{padding:24,display:'flex',flexDirection:'column',gap:14,marginTop:14}}>
          <div {...getRootProps()} style={{...S.drop,borderColor:dropBorder,background:isDragActive?'var(--accent-dim)':file?'rgba(48, 209, 88, 0.06)':'var(--glass-bg)'}}>
            <input {...getInputProps()}/>
            {file ? (
              <div style={{display:'flex',alignItems:'center',gap:12,width:'100%',flexWrap:'wrap'}}>
                <FileCode size={28} color="var(--success)"/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontFamily:'var(--font-mono)',fontSize:13,wordBreak:'break-all'}}>{file.name}</p>
                  <p style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{(file.size/1048576).toFixed(2)} MB</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();setFile(null);}}>
                  <XCircle size={13}/>Remove
                </button>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,pointerEvents:'none'}}>
                <Upload size={32} color={isDragActive?'var(--accent)':'var(--text-muted)'}/>
                {/* MODIFICATO: Testo aggiornato da "il .jar" a "il file" */}
                <p style={{fontFamily:'var(--font-sans)',fontSize:13,color:'var(--text-secondary)'}}>
                  {isDragActive ? 'Release the file' : 'Drag file here or click to explore'}
                </p>
                <p style={{fontSize:11,color:'var(--text-muted)'}}>MAX 100 MB</p>
              </div>
            )}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 120px',gap:10}} className="form-two-col">
            <div style={S.field}>
              <label style={S.label}>title *</label>
              <input className="input" placeholder="Maps title" value={name} onChange={e=>setName(e.target.value)}/>
            </div>
            <div style={S.field}>
              <label style={S.label}>Versione</label>
              <input className="input" placeholder="1.0.0" value={version} onChange={e=>setVersion(e.target.value)}/>
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>Description</label>
            <textarea className="textarea" placeholder=Describe the program…" value={desc} onChange={e=>setDesc(e.target.value)} style={{minHeight:70}}/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}} className="form-two-col">
            <div style={S.field}>
              <label style={S.label}>Tag (virgola)</label>
              <input className="input" placeholder="map, utility…" value={tags} onChange={e=>setTags(e.target.value)}/>
            </div>
            
            {/* CAMPO COLLABORATORI CON AUTOCOMPLETE */}
            <div style={{...S.field, position: 'relative'}}>
              <label style={S.label}>Collaborators (virgola)</label>
              <input 
                className="input" 
                placeholder="@utente1, @utente2..." 
                value={contributors} 
                onChange={handleContributorsChange}
                // Il timeout serve per non chiudere il menu prima che l'utente abbia cliccato
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                onFocus={handleContributorsChange}
              />
              
              {showSuggestions && (
                <div className="suggestions-dropdown">
                  {filteredSuggestions.map(u => (
                    <div key={u} className="suggestion-item" onClick={() => acceptSuggestion(u)}>
                      @{u}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {uploading && (
            <div>
              <div style={{height:5,background:'var(--glass-border)',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${progress}%`,background:'linear-gradient(90deg,var(--accent),var(--accent2))',borderRadius:3,transition:'width .2s'}}/>
              </div>
              <p style={{fontSize:11,color:'var(--text-muted)',marginTop:5}}>
                {step==='uploading' ? `Caricamento… ${progress}%` : 'Registrazione…'}
              </p>
            </div>
          )}

          <button className="btn btn-primary" style={{justifyContent:'center'}} onClick={handleSubmit} disabled={uploading||!file}>
            {uploading ? <><span className="spinner" style={{width:15,height:15}}/>Invio…</> : <><Upload size={15}/>Invia per revisione</>}
          </button>
        </div>
      </div>
      <ToastContainer toasts={toast.toasts}/>
    </>
  );
}

const S = {
  banner: { display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:'var(--radius-md)', marginBottom:0 },
  drop:   { border:'2px dashed', borderRadius:'var(--radius-md)', padding:'24px 16px', cursor:'pointer', transition:'all var(--transition)', minHeight:110, display:'flex', alignItems:'center', justifyContent:'center' },
  field:  { display:'flex', flexDirection:'column', gap:5 },
  label:  { fontSize:11, fontWeight:600, color:'var(--text-secondary)', letterSpacing:'.04em', textTransform:'uppercase' },
};
