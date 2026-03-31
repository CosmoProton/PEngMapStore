// api/upload-url.js
// Genera un URL firmato per caricare un .jar DIRETTAMENTE su Supabase Storage
// dal browser — il file non passa mai per Vercel (nessun limite di dimensione)
const { getSupabase, verifyToken, setCors, ok, err, BUCKET } = require('./_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const user = verifyToken(req);
  if (!user) return err(res, 'Non autenticato', 401);

  const { filename } = req.body || {};
  if (!filename) {
  return err(res, 'Nome file mancante');
}

  // Path univoco nel bucket
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${user.id}/${Date.now()}_${safeName}`;

  const sb = getSupabase();
  const { data, error } = await sb.storage
    .from(BUCKET)
    .createSignedUploadUrl(filePath);

  if (error) return err(res, error.message, 500);

  ok(res, { uploadUrl: data.signedUrl, filePath, token: data.token });
};
