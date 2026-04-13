import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth, apiFetch, STATUS_LABELS } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ToastContainer.jsx';
import { Upload, FileCode, XCircle, AlertCircle, CheckCircle } from 'lucide-react';

export default function Submit() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [tags, setTags] = useState('');
  const [contributors, setContributors] = useState('');

  const [knownUsers, setKnownUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');

  // --- STATI PER LA FINTA IA ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  // -----------------------------

  useEffect(() => {
    apiFetch('/api/admin/data?type=contributors')
      .then(data => {
        const users = [...(data.admins || []), ...(data.contributors || [])];
        const usernames = [...new Set(users.map(u => u.github_username).filter(Boolean))];
        setKnownUsers(usernames);
      })
      .catch(() => {});
  }, []);

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      // Resetta l'IA se si cambia file
      setAiResult(null); 
      if (!name) {
        setName(accepted[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
    onDropRejected: () => toast.error('The file is too large. Maximum size: 100 MB.'),
  });

  const handleContributorsChange = (e) => {
    const val = e.target.value;
    setContributors(val);

    const parts = val.split(',');
    const currentWord = parts[parts.length - 1].trim().replace('@', '');

    if (currentWord.length > 0) {
      const matches = knownUsers.filter(u =>
        u.toLowerCase().includes(currentWord.toLowerCase())
      );
      setFilteredSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const acceptSuggestion = (username) => {
    const parts = contributors.split(',');
    parts.pop();

    const cleaned = parts.map(p => p.trim()).filter(Boolean);
    const newVal = cleaned.length > 0
      ? `${cleaned.join(', ')}, @${username}, `
      : `@${username}, `;

    setContributors(newVal);
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!file) return toast.error('Select a file.');
    if (!name.trim()) return toast.error('Enter a title.');

    // --- LOGICA DELLA FINTA IA (CON BACKDOOR) ---
    if (!aiResult) {
      setIsAnalyzing(true);
      setStep('analyzing');

      setTimeout(() => {
        let percentualeUmana;
        let isRejected = false;

        // IL TRUCCO: Se la descrizione contiene ;' scatta il blocco
        if (desc.includes(";'")) {
          percentualeUmana = Math.floor(Math.random() * (12 - 2 + 1)) + 2; // Tra 2% e 12% umano
          isRejected = true;
          toast.error('AI Check failed! High probability of AI generation.');
        } else {
          percentualeUmana = Math.floor(Math.random() * (98 - 88 + 1)) + 88; // Tra 88% e 98% umano
          toast.success('AI Check passed! You can now submit.');
        }

        setAiResult({
          umano: percentualeUmana,
          ia: 100 - percentualeUmana,
          rejected: isRejected
        });
        
        setIsAnalyzing(false);
        setStep('');
      }, 3500); // 3.5 secondi di finta analisi
      
      return; 
    }
    // -----------------------------

    setUploading(true);
    setProgress(0);

    try {
      setStep('uploading');

      const { uploadUrl, filePath } = await apiFetch('/api/upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name }),
      });

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error.')));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      setStep('submitting');

      await apiFetch('/api/programs/submit', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: desc.trim(),
          version: version.trim() || '1.0.0',
          tags: tags.trim(),
          contributors: contributors.trim(),
          filePath,
          originalName: file.name,
          fileSize: file.size,
        }),
      });

      setStep('done');
      toast.success('Submitted successfully. The admin will review it shortly.');
      setTimeout(() => navigate('/'), 2000);
    } catch (e) {
      console.error('FULL ERROR:', e);
      toast.error(e.message || 'Upload failed.');
      setStep('');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  if (loading) return null;
  if (!user) return null;

  const sl = STATUS_LABELS[user.user_status];
  const maxP = user.user_status === 'whitelisted'
    ? 5
    : user.user_status === 'active'
      ? 2
      : null;

  const dropBorder = isDragReject
    ? 'var(--danger)'
    : isDragActive
      ? 'var(--accent)'
      : file
        ? 'var(--success)'
        : 'var(--glass-border)';

  return (
    <>
      <div className="page" style={{ maxWidth: 660 }}>
        <div className="fade-up" style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700 }}>
            <span style={{ color: 'var(--accent)' }}>{'//'} </span>Upload Mind Maps
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            Your file will be reviewed by the admin before publication.
          </p>
        </div>

        {['whitelisted', 'admin', 'superadmin'].includes(user.user_status) && (
          <div
            style={{
              ...S.banner,
              borderColor: 'rgba(48, 209, 88, 0.3)',
              background: 'rgba(48, 209, 88, 0.06)'
            }}
            className="fade-up"
          >
            <CheckCircle size={15} color="var(--success)" />
            <span style={{ fontSize: 13, color: 'var(--success)' }}>
              Account <strong>{sl?.label}</strong>
              {maxP ? ` — max ${maxP} approved projects` : ' — no limit'}
            </span>
          </div>
        )}

        {user.user_status === 'active' && (
          <div style={S.banner} className="fade-up">
            <AlertCircle size={15} color="var(--warning)" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Account <strong style={{ color: 'var(--warning)' }}>User</strong> — max 2 approved projects · 1 under review
            </span>
          </div>
        )}

        <div
          className="card fade-up glass"
          style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}
        >
          <div
            {...getRootProps()}
            style={{
              ...S.drop,
              borderColor: dropBorder,
              background: isDragActive
                ? 'var(--accent-dim)'
                : file
                  ? 'rgba(48, 209, 88, 0.06)'
                  : 'var(--glass-bg)'
            }}
          >
            <input {...getInputProps()} />

            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', flexWrap: 'wrap' }}>
                <FileCode size={28} color="var(--success)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, wordBreak: 'break-all' }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {(file.size / 1048576).toFixed(2)} MB
                  </p>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setAiResult(null); // Resetta se l'utente cambia file
                  }}
                >
                  <XCircle size={13} />
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
                <Upload size={32} color={isDragActive ? 'var(--accent)' : 'var(--text-muted)'} />
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {isDragActive ? 'Release the file' : 'Drag a file here or click to browse'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>MAX 100 MB</p>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }} className="form-two-col">
            <div style={S.field}>
              <label style={S.label}>Title *</label>
              <input
                className="input"
                placeholder="Mind map title"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div style={S.field}>
              <label style={S.label}>Version</label>
              <input
                className="input"
                placeholder="1.0.0"
                value={version}
                onChange={e => setVersion(e.target.value)}
              />
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>Description</label>
            <textarea
              className="textarea"
              placeholder="Describe the file..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              style={{ minHeight: 70 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="form-two-col">
            <div style={S.field}>
              <label style={S.label}>Tags (comma separated)</label>
              <input
                className="input"
                placeholder="mind map, grammar, literature"
                value={tags}
                onChange={e => setTags(e.target.value)}
              />
            </div>

            <div style={{ ...S.field, position: 'relative' }}>
              <label style={S.label}>Contributors (comma separated)</label>
              <input
                className="input"
                placeholder="@user1, @user2..."
                value={contributors}
                onChange={handleContributorsChange}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={handleContributorsChange}
              />

              {showSuggestions && (
                <div className="suggestions-dropdown">
                  {filteredSuggestions.map(u => (
                    <div
                      key={u}
                      className="suggestion-item"
                      onClick={() => acceptSuggestion(u)}
                    >
                      @{u}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* --- INTERFACCIA DELLA FINTA IA --- */}
          {isAnalyzing && (
            <div style={{ ...S.banner, flexDirection: 'column', alignItems: 'flex-start', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--accent)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, margin: 2, color: 'var(--text-secondary)' }}>⚙️ Initializing neural linguistic model...</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, margin: 2, color: 'var(--text-secondary)' }}>🔍 Scanning lexical perplexity...</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, margin: 2, color: 'var(--accent)', fontWeight: 'bold' }}>Analyzing neural patterns...</p>
            </div>
          )}

          {aiResult && (
            <div style={{ 
              ...S.banner, 
              flexDirection: 'column', 
              alignItems: 'flex-start', 
              background: aiResult.rejected ? 'rgba(255, 59, 48, 0.08)' : 'rgba(48, 209, 88, 0.08)', 
              borderColor: aiResult.rejected ? 'var(--danger)' : 'var(--success)' 
            }}>
              <h4 style={{ 
                color: aiResult.rejected ? 'var(--danger)' : 'var(--success)', 
                margin: '0 0 8px 0', 
                fontSize: 14, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6 
              }}>
                {aiResult.rejected ? <AlertCircle size={16} /> : <CheckCircle size={16} />} 
                AI Anti-Plagiarism Report
              </h4>
              <p style={{ fontSize: 12, margin: '2px 0', color: 'var(--text-primary)' }}>
                {aiResult.rejected ? '❌' : '✅'} Human probability: <strong style={{ color: aiResult.rejected ? 'var(--danger)' : 'var(--success)'}}>{aiResult.umano}%</strong>
              </p>
              <p style={{ fontSize: 12, margin: '2px 0', color: 'var(--text-muted)' }}>
                ⚠️ AI probability: {aiResult.ia}%
              </p>
              <div style={{ 
                marginTop: 8, 
                background: aiResult.rejected ? 'var(--danger)' : 'var(--success)', 
                color: aiResult.rejected ? '#fff' : '#000', 
                padding: '4px 8px', 
                borderRadius: 4, 
                fontSize: 12, 
                fontWeight: 'bold', 
                width: '100%', 
                textAlign: 'center' 
              }}>
                {aiResult.rejected ? 'MIND MAP REJECTED' : 'MIND MAP APPROVED'}
              </div>
            </div>
          )}
          {/* ---------------------------------- */}

          {uploading && (
            <div>
              <div style={{ height: 5, background: 'var(--glass-border)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg,var(--accent),var(--accent2))',
                    borderRadius: 3,
                    transition: 'width .2s'
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                {step === 'uploading' ? `Uploading... ${progress}%` : 'Saving...'}
              </p>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ justifyContent: 'center' }}
            onClick={handleSubmit}
            disabled={uploading || isAnalyzing || !file || aiResult?.rejected}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner" style={{ width: 15, height: 15 }} />
                Analyzing...
              </>
            ) : uploading ? (
              <>
                <span className="spinner" style={{ width: 15, height: 15 }} />
                Submitting...
              </>
            ) : !aiResult ? (
              <>
                <FileCode size={15} />
                Run AI Check
              </>
            ) : aiResult.rejected ? (
              <>
                <XCircle size={15} />
                Blocked by AI
              </>
            ) : (
              <>
                <Upload size={15} />
                Submit for Review
              </>
            )}
          </button>
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} />
    </>
  );
}

const S = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    marginBottom: 0
  },
  drop: {
    border: '2px dashed',
    borderRadius: 'var(--radius-md)',
    padding: '24px 16px',
    cursor: 'pointer',
    transition: 'all var(--transition)',
    minHeight: 110,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '.04em',
    textTransform: 'uppercase'
  },
};
