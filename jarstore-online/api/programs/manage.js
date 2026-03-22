// api/programs/manage.js — DELETE e PATCH per uploader e admin
const { getSupabase, verifyToken, setCors, ok, err, isAdmin, BUCKET } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user) return err(res, 'Non autenticato', 401);

  const { id } = req.query;
  if (!id) return err(res, 'ID mancante');

  const sb = getSupabase();

  // Carica programma
  const { data: prog, error: pErr } = await sb
    .from('programs')
    .select('id,name,description,version,tags,contributors,status,file_path,uploader_id,users!uploader_id(github_username)')
    .eq('id', id)
    .single();

  if (pErr || !prog) return err(res, 'Programma non trovato', 404);

  // Controlla permessi: admin OPPURE uploader OPPURE contributor
  const isOwner    = prog.uploader_id === user.id;
  const contribs   = (prog.contributors || '').split(',').map(s => s.trim().replace('@','').toLowerCase());
  const isContrib  = contribs.includes(user.github_username?.toLowerCase());
  const hasAccess  = isAdmin(user.user_status) || isOwner || isContrib;

  if (!hasAccess) return err(res, 'Non hai i permessi su questo programma', 403);

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    // Elimina file da Storage
    if (prog.file_path) {
      await sb.storage.from(BUCKET).remove([prog.file_path]).catch(console.error);
    }

    const { error } = await sb.from('programs').delete().eq('id', id);
    if (error) return err(res, error.message, 500);
    return ok(res, { success: true });
  }

  // ── PATCH ─────────────────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const { name, description, version, tags, contributors } = req.body || {};

    // Solo admin può modificare programmi già approvati/rifiutati di altri
    if (!isAdmin(user.user_status) && prog.status === 'approved' && !isOwner) {
      return err(res, 'Solo l\'admin può modificare programmi approvati di altri', 403);
    }

    const updates = {};
    if (name        !== undefined) updates.name         = name.trim();
    if (description !== undefined) updates.description  = description.trim();
    if (version     !== undefined) updates.version      = version.trim() || '1.0.0';
    if (tags        !== undefined) updates.tags         = tags.trim();
    if (contributors !== undefined) updates.contributors = contributors.trim();
    updates.updated_at = new Date().toISOString();

    const { error } = await sb.from('programs').update(updates).eq('id', id);
    if (error) return err(res, error.message, 500);
    return ok(res, { success: true });
  }

  return err(res, 'Method not allowed', 405);
};
