import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Variabili d'ambiente Supabase mancanti su Vercel." });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const method = req.method || 'GET';
  const query = req.query || {};
  const action = query.action || '';

  try {
    if (method === 'GET') {
      // 1. LETTURA DELLE CONSEGNE PER UN DETERMINATO COMPITO (VISTA ADMIN)
      if (action === 'submissions') {
        const taskId = query.taskId;
        if (!taskId) return res.status(400).json({ error: 'Parametro taskId mancante.' });

        const { data, error } = await supabase
          .from('task_submissions')
          .select('*')
          .eq('task_id', taskId);

        if (error) throw error;
        return res.status(200).json(data || []);
      }

      // 2. LETTURA DEI COMPITI FILTRATI PER LO STUDENTE
      if (action === 'student') {
        const userNik = query.userNik;
        if (!userNik) return res.status(400).json({ error: 'Parametro userNik mancante.' });

        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('deadline', { ascending: true });

        if (error) throw error;

        // Filtro: mostra se l'array assigned_to è vuoto ({}) oppure contiene il nickname dello studente
        const filtered = (data || []).filter(t => {
          if (!t.assigned_to || !Array.isArray(t.assigned_to) || t.assigned_to.length === 0) return true;
          return t.assigned_to.some(
            nik => String(nik).toLowerCase() === String(userNik).toLowerCase()
          );
        });

        return res.status(200).json(filtered);
      }

      // 3. LETTURA GENERALE DI TUTTI I COMPITI (VISTA ADMIN STANDARD)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (method === 'POST') {
      const body = req.body || {};

      // 4. CREAZIONE DI UN NUOVO COMPITO (DOCENTE)
      if (action === 'create') {
        const { title, description, deadline, assigned_to } = body;
        if (!title || !deadline) return res.status(400).json({ error: 'Titolo e Scadenza sono obbligatori.' });

        const { data, error } = await supabase
          .from('tasks')
          .insert([{
            title,
            description: description || '',
            deadline: new Date(deadline).toISOString(),
            assigned_to: Array.isArray(assigned_to) ? assigned_to : [],
            status: 'open' // Allineato al CHECK constraint ('open', 'closed')
          }])
          .select();

        if (error) throw error;
        return res.status(201).json(data ? data[0] : {});
      }

      // 5. INVIO CONSEGNA (STUDENTE)
      if (action === 'submit') {
        const { taskId, userNik, mapId, deadline } = body;
        if (!taskId || !userNik || !mapId) return res.status(400).json({ error: 'Dati di consegna incompleti.' });

        const submittedAt = new Date();
        const deadlineDate = new Date(deadline);
        
        // Calcolo dei giorni di ritardo
        const diffTime = submittedAt.getTime() - deadlineDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const delayDays = diffDays > 0 ? diffDays : 0;
        
        // Stato della sottomissione allineato al CHECK della tua tabella ('on_time', 'late', 'missing')
        const submissionStatus = delayDays > 0 ? 'late' : 'on_time';
        const penaltyBadge = delayDays > 0 ? 1 : 0;

        const { data, error } = await supabase
          .from('task_submissions')
          .insert([{
            task_id: taskId,
            user_nik: userNik,
            map_id: mapId,
            submitted_at: submittedAt.toISOString(),
            delay_days: delayDays,
            status: submissionStatus,
            penalty_badge: penaltyBadge
          }])
          .select();

        if (error) throw error;
        return res.status(200).json(data ? data[0] : {});
      }
    }

    return res.status(405).json({ error: `Metodo ${method} non consentito.` });

  } catch (err) {
    // Ritorna l'errore SQL formattato in JSON così evitiamo il crash del server e lo leggiamo nei log
    return res.status(400).json({ error: err.message || 'Errore database sconosciuto' });
  }
}
