import { useState, useEffect } from 'react';
import { useAuth, apiFetch } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ToastContainer.jsx';
import {
  Calendar,
  ClipboardList,
  FileUp,
  Clock,
  Package,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function TasksStudent() {
  const { user } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [mapId, setMapId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      setFetching(true);

      try {
        const studentNik =
          user?.github_username ||
          user?.user_metadata?.user_name ||
          user?.login ||
          user?.name ||
          user?.email;

        if (!studentNik) {
          setTasks([]);
          return;
        }

        const data = await apiFetch(
          `/api/tasks?action=student&userNik=${encodeURIComponent(studentNik)}`
        );

        setTasks(Array.isArray(data) ? data : []);

      } catch (e) {
        console.error('Errore fetch tasks:', e);
        toast.error(e.message || 'Errore caricamento compiti');
        setTasks([]);

      } finally {
        setFetching(false);
      }
    };

    fetchTasks();
  }, [user]);

  const handleSubmitMap = async (e) => {
    e.preventDefault();

    const studentNik =
      user?.github_username ||
      user?.user_metadata?.user_name ||
      user?.login ||
      user?.name ||
      user?.email;

    if (!selectedTask || !mapId.trim() || !studentNik) {
      toast.error('Dati mancanti');
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiFetch('/api/tasks?action=submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: selectedTask.id,
          userNik: studentNik,
          mapId: mapId.trim(),
          deadline: selectedTask.deadline
        })
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      toast.success('Consegna inviata correttamente');
      setMapId('');

    } catch (e) {
      console.error('Errore submit:', e);
      toast.error(e.message || 'Errore consegna');

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-wide fade-up" style={{ paddingTop: '80px' }}>

        {/* HEADER */}
        <div style={S.header}>
          <div>
            <h1 style={S.title}>
              <span style={{ color: 'var(--accent)' }}>{'//'} </span>
              Student Tasks
            </h1>

            <p style={S.sub}>
              Visualizza i compiti assegnati e consegna le tue mappe.
            </p>
          </div>

          <div style={S.accountBox}>
            <CheckCircle2 size={15} color="var(--accent)" />
            <span>
              {user?.github_username || 'Utente'}
            </span>
          </div>
        </div>

        {/* GRID */}
        <div style={S.mainGrid}>

          {/* SIDEBAR */}
          <div className="glass" style={S.sidebar}>
            <h2 style={S.sectionTitle}>Compiti Disponibili</h2>

            {fetching ? (
              <div style={S.center}>
                <div className="spinner" style={{ width: 20, height: 20 }} />
              </div>
            ) : tasks.length === 0 ? (
              <div style={S.emptyWrap}>
                <Package size={28} color="var(--text-muted)" />
                <p style={S.emptyTxt}>
                  Nessun compito disponibile.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    style={{
                      ...S.taskCard,
                      ...(selectedTask?.id === task.id ? S.taskCardActive : {})
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {task.title}
                    </div>

                    <div style={S.taskDeadline}>
                      <Clock size={11} />
                      <span>
                        {new Date(task.deadline).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div className="glass" style={S.contentArea}>

            {selectedTask ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* DETTAGLI */}
                <div>
                  <h2 style={S.detailTitle}>
                    {selectedTask.title}
                  </h2>

                  <p style={S.description}>
                    {selectedTask.description || 'Nessuna descrizione disponibile.'}
                  </p>

                  <div style={S.deadlineBanner}>
                    <Calendar size={14} color="var(--warning)" />
                    <span>
                      Scadenza:
                      <strong>
                        {' '}
                        {new Date(selectedTask.deadline).toLocaleString('it-IT')}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmitMap} style={S.submitCard}>

                  <div style={S.formHeader}>
                    <FileUp size={16} color="var(--accent)" />
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>
                      Consegna Elaborato
                    </h3>
                  </div>

                  <div>
                    <label style={S.label}>
                      ID mappa o URL
                    </label>

                    <input
                      className="input"
                      required
                      type="text"
                      placeholder="Es. mia-mappa-finale"
                      value={mapId}
                      onChange={(e) => setMapId(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={submitting}
                  >
                    <FileUp size={14} />
                    {submitting ? 'Invio in corso...' : 'Consegna Mappa'}
                  </button>
                </form>
              </div>

            ) : (
              <div style={S.centerColumn}>
                <ClipboardList size={40} color="var(--text-muted)" />

                <p style={S.selectText}>
                  Seleziona un compito dalla lista laterale.
                </p>
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
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12
  },

  title: {
    fontFamily: 'var(--font-mono)',
    fontSize: 26,
    fontWeight: 700
  },

  sub: {
    color: 'var(--text-muted)',
    fontSize: 12,
    marginTop: 3,
    fontFamily: 'var(--font-mono)'
  },

  accountBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--glass-border)',
    background: 'rgba(255,255,255,0.03)',
    fontSize: 13,
    color: 'var(--text-secondary)'
  },

  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 16,
    alignItems: 'start'
  },

  sidebar: {
    padding: 16,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    border: '1px solid var(--glass-border)'
  },

  contentArea: {
    minHeight: 420,
    padding: 20,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--glass-border)'
  },

  sectionTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: 6
  },

  taskCard: {
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--glass-border)',
    background: 'rgba(255,255,255,0.02)',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  taskCardActive: {
    border: '1px solid var(--accent)',
    background: 'var(--glass-highlight)'
  },

  taskDeadline: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    color: 'var(--text-muted)',
    fontSize: 11
  },

  center: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px 0'
  },

  emptyWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '40px 0'
  },

  emptyTxt: {
    color: 'var(--text-muted)',
    fontSize: 13,
    fontFamily: 'var(--font-mono)'
  },

  detailTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 6
  },

  description: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    lineHeight: 1.6
  },

  deadlineBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    background: 'rgba(210,153,34,0.06)',
    border: '1px solid rgba(210,153,34,0.2)',
    borderRadius: 'var(--radius-md)',
    marginTop: 14,
    fontSize: 13,
    color: 'var(--text-secondary)'
  },

  submitCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 14
  },

  formHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: 10
  },

  label: {
    display: 'block',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    marginBottom: 4
  },

  centerColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 12,
    padding: '80px 0',
    textAlign: 'center'
  },

  selectText: {
    color: 'var(--text-muted)',
    fontSize: 14,
    fontFamily: 'var(--font-mono)'
  }
};
