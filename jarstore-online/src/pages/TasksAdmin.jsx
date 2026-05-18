import { useState, useEffect, useCallback } from 'react';
import { useAuth, apiFetch } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ToastContainer.jsx';
import { ClipboardList, Plus, Calendar, Users, Globe, Lock, FileText, AlertCircle } from 'lucide-react';

export default function TasksAdmin() {
  console.log("TASK ADMIN REAL FILE LOADED");
  const { user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const fetchTasks = useCallback(async () => {
    console.log("START FETCH TASKS");
  
    setFetching(true);
  
    try {
      const data = await apiFetch('/api/tasks');
  
      console.log("DATA:", data);
  
      setTasks(Array.isArray(data) ? data : []);
  
    } catch (e) {
      console.error("FETCH ERROR:", e);
  
      setTasks([]);
  
      toast.error(e.message);
  
    } finally {
      console.log("FETCH FINALLY");
      setFetching(false);
    }
  }, [toast]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const selectTask = async (task) => {
    setSelectedTask(task);
    try {
      const data = await apiFetch(`/api/tasks?action=submissions&taskId=${task.id}`);
      setSubmissions(data || []);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const assignedArray = assignedTo ? assignedTo.split(',').map(nik => nik.trim()) : [];

    try {
      const response = await apiFetch('/api/tasks?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          deadline: new Date(deadline).toISOString(),
          assigned_to: assignedArray
        })
      });

      if (response && response.error) throw new Error(response.error);

      toast.success('Task pubblicato con successo!');
      setTitle(''); setDescription(''); setDeadline(''); setAssignedTo('');
      setIsModalOpen(false);
      fetchTasks();
    } catch (e) {
      console.error("Errore handleCreateTask:", e);
      toast.error(e.message || "Errore durante la creazione del compito.");
    }
  };

  return (
    <>
      <div className="page-wide fade-up" style={{ paddingTop: '80px' }}>
        
        {/* Header di sezione */}
        <div style={S.header}>
          <div>
            <h1 style={S.title}><span style={{ color: 'var(--accent)' }}>{'//'} </span>Task Management</h1>
            <p style={S.sub}>Assegna compiti e monitora le consegne degli studenti</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} /> Crea Nuovo Compito
          </button>
        </div>

        {/* Corpo Principale a due colonne */}
        <div style={S.mainGrid}>
          
          {/* Colonna Sinistra: Lista Compiti */}
          <div className="glass" style={S.sidebar}>
            <h2 style={S.sectionTitle}>Compiti Rilasciati</h2>
            {fetching ? (
              <div style={S.center}><div className="spinner" style={{ width: 20, height: 20 }} /></div>
            ) : tasks.length === 0 ? (
              <p style={S.emptyTxt}>Nessun compito presente.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => selectTask(task)} 
                    style={{ ...S.taskCard, ...(selectedTask?.id === task.id ? S.taskCardActive : {}) }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{task.title}</div>
                    <div style={S.badgeRow}>
                      {!Array.isArray(task.assigned_to) || task.assigned_to.length === 0 ? (
                        <span style={S.badgeGlobal}><Globe size={10} /> Tutti</span>
                      ) : (
                        <span style={S.badgePrivate}><Lock size={10} /> Privato ({task.assigned_to?.length || 0})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colonna Destra: Dettagli e Consegne */}
          <div className="glass" style={S.contentArea}>
            {selectedTask ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h2 style={{ ...S.title, fontSize: 22, marginBottom: 6 }}>{selectedTask.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{selectedTask.description || 'Nessuna descrizione fornita.'}</p>
                  <div style={S.deadlineBanner}>
                    <Calendar size={14} color="var(--warning)" />
                    <span>Scadenza: <strong>{new Date(selectedTask.deadline).toLocaleString('it-IT')}</strong></span>
                  </div>
                </div>

                {/* Tabella Consegne */}
                <div>
                  <h3 style={{ ...S.sectionTitle, marginBottom: 12 }}>Elaborati Consegnati</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={S.table}>
                      <thead>
                        <tr style={S.thRow}>
                          <th style={S.th}>Studente (GitHub)</th>
                          <th style={S.th}>Stato</th>
                          <th style={{ ...S.th, textAlign: 'right' }}>Mappa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((sub) => (
                          <tr key={sub.id} style={S.tr}>
                            <td style={S.td}><strong style={{ color: 'var(--text-primary)' }}>{sub.user_nik}</strong></td>
                            <td style={S.td}>
                              <span style={sub.status === 'on_time' ? S.statusOnTime : S.statusLate}>
                                {sub.status === 'on_time' ? 'In Tempo' : `Ritardo (+${sub.delay_days}d)`}
                              </span>
                            </td>
                            <td style={{ ...S.td, textAlign: 'right' }}>
                              <a href={`/maps/${sub.map_id}`} className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', padding: '4px 10px' }}>Apri</a>
                            </td>
                          </tr>
                        ))}
                        {submissions.length === 0 && (
                          <tr>
                            <td colSpan="3" style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', italic: true }}>
                              Nessuno studente ha ancora consegnato questo compito.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div style={S.centerColumn}>
                <ClipboardList size={40} color="var(--text-muted)" />
                <p style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>Seleziona un compito per visualizzare il registro consegne.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal di Creazione Compito (Identico al tuo WelcomePopup strutturalmente) */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, marginBottom: 16, borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>🎉 Nuovo Compito</h2>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={S.label}>Titolo del compito</label>
                <input className="input" required type="text" placeholder="Es. Sintesi modulo 3" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Istruzioni / Descrizione</label>
                <textarea className="input" style={{ height: 80, resize: 'none', padding: '10px' }} placeholder="Spiega cosa devono mappare gli studenti..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Data e Ora di Scadenza</label>
                <input className="input" required type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Assegna a specifici utenti (opzionale)</label>
                <input className="input" type="text" placeholder="Inserisci i GitHub Nik separati da virgola" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Lascia vuoto per assegnarlo automaticamente a tutta la classe.</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" style={{ width: '50%', justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>Annulla</button>
                <button type="submit" className="btn btn-primary" style={{ width: '50%', justifyContent: 'center' }}>Pubblica</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer toasts={toast.toasts} />
    </>
  );
}

const S = {
  header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title: { fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700 },
  sub: { color: 'var(--text-muted)', fontSize: 12, marginTop: 3, fontFamily: 'var(--font-mono)' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'start' },
  sidebar: { padding: 16, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--glass-border)' },
  contentArea: { gridColumn: 'span 2', minHeight: 400, padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' },
  sectionTitle: { fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 6 },
  taskCard: { padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s' },
  taskCardActive: { border: '1px solid var(--accent)', background: 'var(--glass-highlight)' },
  badgeRow: { display: 'flex', gap: 6, marginTop: 6 },
  badgeGlobal: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, background: 'rgba(0,210,255,0.1)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 12 },
  badgePrivate: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 12 },
  center: { display: 'flex', justifyContent: 'center', padding: '20px 0' },
  centerColumn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: '80px 0', textAlign: 'center' },
  emptyTxt: { color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)', italic: true },
  deadlineBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(210,153,34,0.06)', border: '1px solid rgba(210,153,34,0.2)', borderRadius: 'var(--radius-md)', marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' },
  label: { display: 'block', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thRow: { borderBottom: '1px solid var(--glass-border)' },
  th: { padding: '10px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: 12 },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.03)' },
  td: { padding: '12px 8px', verticalAlign: 'middle' },
  statusOnTime: { background: 'rgba(40,167,69,0.15)', color: '#28a745', padding: '2px 8px', borderRadius: '4px', fontSize: 11, fontWeight: 600 },
  statusLate: { background: 'rgba(220,53,69,0.15)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '4px', fontSize: 11, fontWeight: 600 }
};
