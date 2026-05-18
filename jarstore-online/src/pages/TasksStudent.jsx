import { useState, useEffect, useCallback } from 'react';
import { useAuth, apiFetch } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ToastContainer.jsx';
import { Calendar, Package, FileUp, AlertTriangle, Clock } from 'lucide-react';

export default function TasksStudent() {
  const { user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [mapId, setMapId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMyTasks = useCallback(async () => {
    // FIX: Intercettiamo il nome utente corretto, che sia su github_username o su user_metadata
    const studentNik = user?.github_username || user?.user_metadata?.user_name;
    
    if (!studentNik) {
      setFetching(false); // FIX CRITICO: Spegne la girella se non trova il nome!
      return;
    }

    setFetching(true);
    try {
      const data = await apiFetch(`/api/tasks?action=student&userNik=${encodeURIComponent(studentNik)}`);
      
      if (data && data.error) throw new Error(data.error);
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Errore fetchMyTasks:", e);
      toast.error(e.message || "Impossibile caricare i compiti.");
      setTasks([]);
    } finally {
      setFetching(false); // Spegne la girella SEMPRE
    }
  }, [user, toast]);

  useEffect(() => { fetchMyTasks(); }, [fetchMyTasks]);

  const handleSubmitMap = async (e) => {
    e.preventDefault();
    const studentNik = user?.github_username || user?.user_metadata?.user_name;
    if (!selectedTask || !mapId.trim() || !studentNik) return;

    setSubmitting(true);
    try {
      const response = await apiFetch('/api/tasks?action=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedTask.id,
          userNik: studentNik,
          mapId: mapId.trim(),
          deadline: selectedTask.deadline
        })
      });

      if (response && response.error) throw new Error(response.error);

      toast.success('Mappa consegnata correttamente!');
      setMapId('');
    } catch (e) {
      console.error("Errore handleSubmitMap:", e);
      toast.error(e.message || "Errore durante la consegna.");
    } finally {
      setSubmitting(false); // Riabilita il pulsante SEMPRE
    }
  };

  return (
    <>
      <div className="page-wide fade-up" style={{ paddingTop: '80px' }}>
        
        {/* Banner Benvenuto */}
        <div style={S.welcomeCard} className="glass">
          <Calendar size={20} color="var(--accent)" />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>Pannello Compiti & Scadenze</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
              Account sincronizzato: <strong style={{ color: 'var(--accent)' }}>{user?.github_username}</strong>. Qui trovi i lavori richiesti dal docente.
            </p>
          </div>
        </div>

        {/* Layout griglia */}
        <div style={S.mainGrid}>
          
          {/* Elenco Compiti Attivi */}
          <div className="glass" style={S.sidebar}>
            <h2 style={S.sectionTitle}>I Tuoi Compiti</h2>
            {fetching ? (
              <div style={S.center}><div className="spinner" style={{ width: 20, height: 20 }} /></div>
            ) : tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Package size={24} color="var(--text-muted)" />
                <p style={S.emptyTxt}>Nessun compito attivo al momento.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.map(t => (
                  <div 
                    key={t.id} onClick={() => setSelectedTask(t)}
                    style={{ ...S.taskCard, ...(selectedTask?.id === t.id ? S.taskCardActive : {}) }}
                  >
                    <span style={{ fontWeight: 600 }}>{t.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dettaglio del compito e Area di Caricamento */}
          <div className="glass" style={S.contentArea}>
            {selectedTask ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h2 style={S.detailTitle}>{selectedTask.title}</h2>
                  <p style={S.description}>{selectedTask.description || 'Nessun dettaglio aggiuntivo dal docente.'}</p>
                </div>

                <div style={S.deadlineBanner}>
                  <Clock size={15} color="var(--warning)" />
                  <span>Consegnare entro il: <strong>{new Date(selectedTask.deadline).toLocaleString('it-IT')}</strong></span>
                </div>

                {/* Form Invio Elaborato */}
                <form onSubmit={handleSubmitMap} style={S.uploadForm}>
                  <h3 style={{ ...S.sectionTitle, fontSize: 13, paddingBottom: 4 }}>Invia la tua Mappa</h3>
                  <div>
                    <label style={S.label}>ID Mappa o URL</label>
                    <input 
                      className="input" required type="text" 
                      placeholder="Es. id_mia_mappa o incolla il nome esatto" 
                      value={mapId} onChange={e => setMapId(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
                    <FileUp size={14} /> {submitting ? 'Invio in corso...' : 'Consegna Mappa'}
                  </button>
                </form>
              </div>
            ) : (
              <div style={S.centerColumn}>
                <AlertTriangle size={32} color="var(--text-muted)" />
                <p style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>Seleziona un compito a sinistra per allegare il tuo lavoro.</p>
              </div>
            )}
          </div>

        </div>
      </div>
      <ToastContainer toasts={toast.toasts} />
    </>
  );
}

const S = {
  welcomeCard: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', marginBottom: 20 },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'start' },
  sidebar: { padding: 16, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--glass-border)' },
  contentArea: { gridColumn: 'span 2', minHeight: 320, padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' },
  sectionTitle: { fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 6 },
  taskCard: { padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.15s', fontSize: 13 },
  taskCardActive: { border: '1px solid var(--accent)', background: 'var(--glass-highlight)' },
  center: { display: 'flex', justifyContent: 'center', padding: '20px 0' },
  emptyTxt: { color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 8 },
  centerColumn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: '60px 0' },
  detailTitle: { fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700 },
  description: { color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginTop: 6 },
  deadlineBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(210,153,34,0.06)', border: '1px solid rgba(210,153,34,0.2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)' },
  uploadForm: { background: 'rgba(0,0,0,0.15)', padding: 16, border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 },
  label: { display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }
};
