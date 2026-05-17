import React, { useState, useEffect } from 'react';
import { SubmissionBadge } from '../components/SubmissionBadge';

export default function TasksAdmin() {
  const [tasks, setTasks] = useState([]);
  const [dbError, setDbError] = useState(null); // Per intercettare errori reali
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignedTo, setAssignedTo] = useState(''); 

  const loadTasks = () => {
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.error) {
          setDbError(data.error);
        } else {
          setTasks(Array.isArray(data) ? data : []);
          setDbError(null);
        }
      })
      .catch((err) => setDbError(err.message));
  };

  useEffect(() => { loadTasks(); }, []);

  const selectTask = (task) => {
    setSelectedTask(task);
    fetch(`/api/tasks?action=submissions&taskId=${task.id}`)
      .then((res) => res.json())
      .then((data) => setSubmissions(data.submissions || []))
      .catch((err) => console.error(err));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const assignedArray = assignedTo ? assignedTo.split(',').map(nik => nik.trim()) : [];

    const newTask = {
      title,
      description,
      deadline: new Date(deadline).toISOString(),
      assigned_to: assignedArray
    };

    const response = await fetch('/api/tasks?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });

    if (response.ok) {
      setTitle(''); setDescription(''); setDeadline(''); setAssignedTo('');
      setIsModalOpen(false);
      loadTasks();
    } else {
      const err = await response.json();
      alert(`Errore creazione: ${err.error}`);
    }
  };

  return (
    <div className="pt-24 p-6 max-w-7xl mx-auto space-y-6 text-gray-100">
      <div className="border-b border-gray-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Pannello di Controllo Docenti</h1>
          <p className="text-sm text-gray-400">Gestione scadenze e compiti inseriti</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow transition">
          + Crea Nuovo Compito
        </button>
      </div>

      {dbError && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl text-sm">
          <strong>⚠️ Errore Database/API:</strong> {dbError} <br />
          <span className="text-xs text-red-300">Verifica di aver eseguito lo script SQL su Supabase.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 h-fit space-y-2">
          <h2 className="text-lg font-bold text-white mb-2">Compiti Rilasciati</h2>
          {tasks.length === 0 ? <p className="text-sm text-gray-400 italic">Nessun compito presente.</p> : 
            tasks.map((task) => (
              <div key={task.id} onClick={() => selectTask(task)} className={`p-3 rounded-lg border cursor-pointer transition ${selectedTask?.id === task.id ? 'border-indigo-500 bg-indigo-950/30' : 'border-gray-700 hover:bg-gray-800/50'}`}>
                <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded font-mono text-gray-300 block w-fit mt-1">
                  {task.assigned_to.length === 0 ? '🌍 Per Tutti' : `👥 Per: ${task.assigned_to.join(', ')}`}
                </span>
              </div>
            ))
          }
        </div>

        <div className="lg:col-span-2 bg-gray-800/50 p-6 rounded-xl border border-gray-700">
          {selectedTask ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedTask.title}</h2>
                <p className="text-sm text-gray-300 mt-1">{selectedTask.description}</p>
                <div className="mt-2 inline-block bg-amber-950/40 border border-amber-800 text-amber-300 text-xs px-2.5 py-1 rounded font-medium">
                  Scadenza: {new Date(selectedTask.deadline).toLocaleString('it-IT')}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-gray-900 text-gray-400 font-semibold uppercase text-xs">
                    <tr>
                      <th className="p-3">Studente (Nik)</th>
                      <th className="p-3">Stato</th>
                      <th className="p-3">Mappa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-800/30">
                        <td className="p-3 font-medium text-white">{sub.user_nik}</td>
                        <td className="p-3"><SubmissionBadge status={sub.status} delayDays={sub.delay_days} /></td>
                        <td className="p-3">
                          <a href={`/maps/${sub.map_id}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline text-xs font-semibold">Apri Mappa</a>
                        </td>
                      </tr>
                    ))}
                    {submissions.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-gray-500 italic">Nessuna consegna eseguita.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          ) : <div className="text-center py-12 text-gray-400">Seleziona un compito per vedere i dettagli delle consegne.</div>}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 max-w-md w-full space-y-4 text-gray-100">
            <h2 className="text-xl font-bold text-white">Crea Nuovo Compito</h2>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400">Titolo</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400">Descrizione</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm h-20 text-white focus:border-indigo-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400">Data e Ora Scadenza</label>
                <input type="datetime-local" required value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400">Assegna a specifici GitHub Nik (Separati da virgola)</label>
                <input type="text" placeholder="Lascia vuoto per assegnare a TUTTI" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"/>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-600 rounded-lg text-sm text-gray-400 hover:bg-gray-700">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Pubblica</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
