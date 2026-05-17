import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function TasksStudent() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [mapId, setMapId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.github_username) return;
    
    // Cerca i compiti associati al nik GitHub corrente
    fetch(`/api/tasks?action=student&userNik=${encodeURIComponent(user.github_username)}`)
      .then((res) => res.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

  const handleSubmission = async (e) => {
    e.preventDefault();
    if (!selectedTask || !mapId.trim()) return;

    const payload = {
      taskId: selectedTask.id,
      userNik: user.github_username,
      mapId: mapId.trim(),
      deadline: selectedTask.deadline
    };

    const res = await fetch('/api/tasks?action=submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setMapId('');
      alert('✅ Mappa consegnata con successo!');
    } else {
      alert('❌ Errore durante la consegna.');
    }
  };

  return (
    <div className="pt-24 p-6 max-w-4xl mx-auto space-y-6 text-gray-100">
      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 space-y-2">
        <h1 className="text-xl font-bold text-white">🎯 Pannello Consegne Compiti</h1>
        <p className="text-sm text-gray-400">
          Benvenuto, <span className="text-indigo-400 font-semibold">{user?.github_username}</span>. Qui trovi i tuoi compiti attivi.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 italic">Caricamento scadenze...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-gray-500 bg-gray-800/30 p-4 rounded-lg border border-gray-800 italic text-center">Nessun compito attivo assegnato al tuo account in questo momento.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">I Tuoi Compiti</h2>
            {tasks.map(t => (
              <div 
                key={t.id} onClick={() => setSelectedTask(t)}
                className={`p-3 rounded-lg border cursor-pointer text-sm font-medium transition ${selectedTask?.id === t.id ? 'border-indigo-500 bg-indigo-950/40 text-white' : 'border-gray-700 bg-gray-800/30 hover:bg-gray-800/60'}`}
              >
                {t.title}
              </div>
            ))}
          </div>

          <div className="md:col-span-2 bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            {selectedTask ? (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">{selectedTask.title}</h2>
                <p className="text-sm text-gray-300">{selectedTask.description}</p>
                <p className="text-xs text-red-400 font-semibold bg-red-950/20 border border-red-900/50 px-2 py-1 rounded w-fit">
                  Scadenza: {new Date(selectedTask.deadline).toLocaleString('it-IT')}
                </p>
                
                <form onSubmit={handleSubmission} className="pt-4 border-t border-gray-700 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400">ID o Nome della Mappa da allegare</label>
                    <input 
                      type="text" required placeholder="Inserisci l'identificativo esatto della tua mappa" value={mapId} onChange={(e) => setMapId(e.target.value)}
                      className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition shadow">
                    Invia Mappa per la Valutazione
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8 text-sm italic">Seleziona un compito dalla lista a sinistra per procedere.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
