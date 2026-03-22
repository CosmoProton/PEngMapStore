// api/admin/log.js — storico programmi approvati/rifiutati con note (solo admin)
const { getSupabase, verifyToken, setCors, ok, err, isAdmin } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!isAdmin(user?.user_status)) return err(res, 'Accesso negato', 403);

  const sb = getSupabase();
  const { data, error } = await sb
    .from('programs')
    .select('id,name,version,status,admin_note,original_name,file_size,created_at,updated_at,uploader_id,users!uploader_id(github_username,avatar_url)')
    .in('status', ['approved','rejected'])
    .order('updated_at', { ascending: false });

  if (error) return err(res, error.message, 500);

  const log = (data || []).map(p => ({
    ...p,
    uploader:        p.users?.github_username || null,
    uploader_avatar: p.users?.avatar_url      || null,
    users:           undefined,
  }));

  ok(res, log);
};
