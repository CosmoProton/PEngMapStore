import React, { useState, useEffect } from 'react';

export default function TasksStudent() {
  const [nik, setNik] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [mapId, setMapId] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fetchMyTasks = () => {
    if (!nik.trim()) return;
    fetch(`/api/tasks?action=student&userNik=${encodeURIComponent(nik.trim())}`)
      .then((res) => res.json())
      .then((data) => setTasks(data || []))
      .catch((err) => console.error(err));
  };

  const handleSubmission = async (e) => {
    e.preventDefault();
    if (!selectedTask || !mapId.trim()) return;

    const payload = {
      taskId: selectedTask.id,
      userNik: nik.trim(),
      mapId: mapId.trim(),
      deadline: selectedTask.deadline
    };

    const res = await fetch('/api/tasks?action=submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setIsSubmitted(true);
      setMapId('');
      alert('Mappa consegnata con successo!');
    } else {
      alert('Errore durante la consegna.');
    }
  };

  return (
    <div className="pt-24 p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <h1 className="text-xl font-bold text-gray-900">🎯 Consegna il tuo Lavoro</h1>
        <p className="text-sm text-gray-500">Inserisci il tuo Nickname per caricare i compiti attivi.</p>
        <div className="flex gap-2">
          <input 
            type="text" placeholder="Scrivi il tuo Nik..." value={nik} onChange={(e) => setNik(e.target.value)}
            className="p-2 border rounded-lg text-sm w-full max-w-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button onClick={fetchMyTasks} className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
            Cerca Compiti
          </button>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">I Tuoi Compiti</h2>
            {tasks.map(t => (
              <div 
                key={t.id} onClick={() => { setSelectedTask(t); setIsSubmitted(false); }}
                className={`p-3 rounded-lg border cursor-pointer text-sm font-medium ${selectedTask?.id === t.id ? 'border-indigo-600 bg-indigo-50' : 'bg-white hover:bg-gray-50'}`}
              >
                {t.title}
              </div>
            ))}
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
            {selectedTask ? (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">{selectedTask.title}</h2>
                <p className="text-sm text-gray-600">{selectedTask.description}</p>
                <p className="text-xs text-red-600 font-semibold">Scadenza: {new Date(selectedTask.deadline).toLocaleString('it-IT')}</p>
                
                <form onSubmit={handleSubmission} className="pt-4 border-t space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">ID Mappa da Consegnare</label>
                    <input 
                      type="text" required placeholder="Inserisci l'ID o il nome della tua mappa" value={mapId} onChange={(e) => setMapId(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-lg text-sm"
                    />
                  </div>
                  <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-green-700">
                    Invia Mappa
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8 text-sm">Seleziona un compito dalla lista a sinistra per procedere alla consegna.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
