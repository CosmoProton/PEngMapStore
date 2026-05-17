import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const { method } = req;
  const { action, taskId, mapId } = req.query;

  // --- GESTIONE RICHIESTE GET ---
  if (method === 'GET') {
    try {
      // Caso 1: Recupero dettagli e consegne di un singolo compito
      if (action === 'submissions' && taskId) {
        const { data: submissions, error: subError } = await supabase
          .from('task_submissions')
          .select('*')
          .eq('task_id', taskId);

        if (subError) throw subError;
        return res.status(200).json({ submissions });
      }

      // Caso 2: Recupero lista globale dei compiti
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      return res.status(200).json(tasks);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // --- GESTIONE RICHIESTE POST ---
  if (method === 'POST') {
    try {
      switch (action) {
        case 'create': {
          const { title, description, deadline, assigned_to, created_by } = req.body;
          if (!title || !deadline || !assigned_to) {
            return res.status(400).json({ error: 'Campi obbligatori mancanti.' });
          }
          const { data, error } = await supabase
            .from('tasks')
            .insert([{ title, description, deadline, assigned_to, created_by, status: 'open' }])
            .select();
          if (error) throw error;
          return res.status(201).json(data[0]);
        }

        case 'submit': {
          const { userId, mapId: submittedMapId, deadline } = req.body;
          if (!taskId || !userId || !submittedMapId || !deadline) {
            return res.status(400).json({ error: 'Dati incompleti per la consegna.' });
          }
          const submittedAt = new Date();
          const diffDays = Math.ceil((submittedAt.getTime() - new Date(deadline).getTime()) / (1000 * 60 * 60 * 24));
          const delayDays = diffDays > 0 ? diffDays : 0;
          
          const status = delayDays > 0 ? 'late' : 'on_time';

          const { data, error } = await supabase
            .from('task_submissions')
            .upsert({
              task_id: taskId,
              user_id: userId,
              map_id: submittedMapId,
              submitted_at: submittedAt.toISOString(),
              delay_days: delayDays,
              status,
              penalty_badge: delayDays
            })
            .select();
          if (error) throw error;
          return res.status(200).json(data[0]);
        }

        case 'vote': {
          const { userId, role, voteValue } = req.body;
          if (!mapId || !userId || !role || !voteValue) return res.status(400).json({ error: 'Dati voto incompleti.' });
          const { data, error } = await supabase
            .from('map_votes')
            .upsert({ map_id: mapId, user_id: userId, role, vote_value: voteValue })
            .select();
          if (error) throw error;
          return res.status(200).json(data);
        }

        case 'comment': {
          const { authorId, commentText, role } = req.body;
          if (role !== 'admin' && role !== 'teacher') return res.status(403).json({ error: 'Permesso negato.' });
          const { data, error } = await supabase
            .from('map_comments')
            .insert([{ map_id: mapId, author_id: authorId, comment_text: commentText }])
            .select();
          if (error) throw error;
          return res.status(201).json(data[0]);
        }

        default:
          return res.status(400).json({ error: 'Azione POST non valida.' });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${method} Not Allowed`);
}