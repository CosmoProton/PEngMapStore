import React, { useState, useEffect } from 'react';
import { SubmissionBadge } from '../components/SubmissionBadge';

export default function TasksAdmin() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  
  // Stati per il Form di creazione compito
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignedTo, setAssignedTo] = useState(''); // Stringa separata da virgole per gli ID utente

  // Funzione per caricare i compiti dal database
  const loadTasks = () => {
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => setTasks(data || []))
      .catch((err) => console.error("Errore recupero compiti:", err));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const selectTask = (task) => {
    setSelectedTask(task);
    fetch(`/api/tasks?action=submissions&taskId=${task.id}`)
      .then((res) => res.json())
      .then((data) => setSubmissions(data.submissions || []))
      .catch((err) => console.error("Errore sottomissioni:", err));
  };

  // Funzione per inviare il nuovo compito all'endpoint unico
  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    // Converte la stringa degli utenti in un array pulito
    const assignedArray = assignedTo.split(',').map(id => id.trim()).filter(id => id.length > 0);

    const newTask = {
      title,
      description,
      deadline: new Date(deadline).toISOString(),
      assigned_to: assignedArray,
      created_by: '00000000-0000-0000-0000-000000000000' // Inserisci qui l'ID dell'admin attuale se integrato con l'auth
    };

    try {
      const response = await fetch('/api/tasks?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });

      if (response.ok) {
        // Reset dei campi e chiusura modale
        setTitle('');
        setDescription('');
        setDeadline('');
        setAssignedTo('');
        setIsModalOpen(false);
        // Ricarica la lista aggiornata
        loadTasks();
      } else {
        const errData = await response.json();
        alert(`Errore: ${errData.error}`);
      }
    } catch (error) {
      console.error("Errore durante la creazione del compito:", error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registro Compiti & Scadenze</h1>
          <p className="text-sm text-gray-500">Gestione e monitoraggio consegne studenti</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow transition"
        >
          + Crea Nuovo Compito
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Elenco dei compiti */}
        <div className="bg-white p-4 rounded-xl border shadow-sm h-fit space-y-2">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Compiti Rilasciati</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Nessun compito rilasciato.</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => selectTask(task)}
                className={`p-3 rounded-lg border cursor-pointer transition ${selectedTask?.id === task.id ? 'border-blue-500 bg-blue-50/50' : 'hover:bg-gray-50'}`}
              >
                <h3 className="font-semibold text-gray-900 text-sm">{task.title}</h3>
                <p className="text-xs text-gray-500 mt-1">Scadenza: {new Date(task.deadline).toLocaleDateString('it-IT')}</p>
              </div>
            ))
          )}
        </div>

        {/* Tabella Dettaglio Consegne */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
          {selectedTask ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
                <div className="mt-2 inline-block bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded font-medium">
                  Scadenza: {new Date(selectedTask.deadline).toLocaleString('it-IT')}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                    <tr>
                      <th className="p-3">Utente ID</th>
                      <th className="p-3">Stato Consegna</th>
                      <th className="p-3">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-medium text-gray-900">{sub.user_id}</td>
                        <td className="p-3">
                          <SubmissionBadge status={sub.status} delayDays={sub.delay_days} />
                        </td>
                        <td className="p-3">
                          <a href={`/maps/${sub.map_id}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs font-semibold">
                            Apri Mappa
                          </a>
                        </td>
                      </tr>
                    ))}
                    {submissions.length === 0 && (
                      <tr>
                        <td colSpan="3" className="p-4 text-center text-gray-400 italic">
                          Nessuna mappa consegnata per questo compito.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              Seleziona un compito sulla sinistra per vedere il pannello sottomissioni.
            </div>
          )}
        </div>
      </div>

      {/* MODAL / FORM A COMPARSA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Nuovo Compito</h2>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Titolo</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Descrizione</label>
                <textarea 
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg text-sm h-20 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Data e Ora Scadenza</label>
                <input 
                  type="datetime-local" required value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Assegna a Utenti (ID separati da virgola)</label>
                <input 
                  type="text" required placeholder="es: id1, id2, id3" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow"
                >
                  Pubblica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
