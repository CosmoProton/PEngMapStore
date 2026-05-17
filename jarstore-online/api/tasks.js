import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const { method } = req;
  const { action, taskId, userNik } = req.query;

  if (method === 'GET') {
    try {
      // 1. Recupero consegne per l'admin
      if (action === 'submissions' && taskId) {
        const { data, error } = await supabase.from('task_submissions').select('*').eq('task_id', taskId);
        if (error) throw error;
        return res.status(200).json({ submissions: data });
      }

      // 2. Recupero compiti filtrati per lo studente (o tutti se pubblici)
      if (action === 'student' && userNik) {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('deadline', { ascending: true });
        
        if (error) throw error;
        // Filtra i compiti: prendi quelli generali ({}) o dove compare il nik dello studente
        const filtered = data.filter(t => t.assigned_to.length === 0 || t.assigned_to.includes(userNik));
        return res.status(200).json(filtered);
      }

      // 3. Vista globale Admin
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (method === 'POST') {
    try {
      if (action === 'create') {
        const { title, description, deadline, assigned_to } = req.body;
        if (!title || !deadline) return res.status(400).json({ error: 'Titolo e Scadenza obbligatori.' });

        const { data, error } = await supabase
          .from('tasks')
          .insert([{ title, description, deadline, assigned_to: assigned_to || [] }])
          .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
      }

      if (action === 'submit') {
        const { taskId: tId, userNik: uNik, mapId, deadline } = req.body;
        const submittedAt = new Date();
        const diffDays = Math.ceil((submittedAt.getTime() - new Date(deadline).getTime()) / (1000 * 60 * 60 * 24));
        const delayDays = diffDays > 0 ? diffDays : 0;
        const status = delayDays > 0 ? 'late' : 'on_time';

        const { data, error } = await supabase
          .from('task_submissions')
          .insert([{ task_id: tId, user_nik: uNik, map_id: mapId, submitted_at: submittedAt.toISOString(), delay_days: delayDays, status, penalty_badge: delayDays }])
          .select();

        if (error) throw error;
        return res.status(200).json(data[0]);
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${method} Not Allowed`);
}
