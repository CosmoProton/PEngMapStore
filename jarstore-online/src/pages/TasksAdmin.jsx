import React, { useState, useEffect } from 'react';
import { SubmissionBadge } from '../components/SubmissionBadge';

export default function TasksAdmin() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    // Chiamata standard per la lista
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => setTasks(data || []))
      .catch((err) => console.error("Errore compiti:", err));
  }, []);

  const selectTask = (task) => {
    setSelectedTask(task);
    // Chiamata con i parametri d'azione corretti sul singolo endpoint
    fetch(`/api/tasks?action=submissions&taskId=${task.id}`)
      .then((res) => res.json())
      .then((data) => setSubmissions(data.submissions || []))
      .catch((err) => console.error("Errore sottomissioni:", err));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Registro Compiti & Scadenze</h1>
        <p className="text-sm text-gray-500">Gestione e monitoraggio consegne studenti</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-xl border shadow-sm h-fit space-y-2">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Compiti Rilasciati</h2>
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => selectTask(task)}
              className={`p-3 rounded-lg border cursor-pointer transition ${selectedTask?.id === task.id ? 'border-blue-500 bg-blue-50/50' : 'hover:bg-gray-50'}`}
            >
              <h3 className="font-semibold text-gray-900 text-sm">{task.title}</h3>
              <p className="text-xs text-gray-500 mt-1">Scadenza: {new Date(task.deadline).toLocaleDateString('it-IT')}</p>
            </div>
          ))}
        </div>

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
                      <th className="p-3">Studente (ID/Email)</th>
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
    </div>
  );
}