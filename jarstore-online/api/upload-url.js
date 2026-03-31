const { getSupabase, verifyToken, setCors, ok, err, BUCKET } = require('./_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  try {
    console.log('--- /api/upload-url START ---');
    console.log('method =', req.method);
    console.log('bucket =', BUCKET);
    console.log('body =', req.body);

    const user = verifyToken(req);
    console.log('user =', user);

    if (!user) {
      console.log('auth failed');
      return err(res, 'Non autenticato', 401);
    }

    const { filename } = req.body || {};
    console.log('filename =', filename);

    if (!filename) {
      console.log('missing filename');
      return err(res, 'Nome file mancante');
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${user.id}/${Date.now()}_${safeName}`;

    console.log('safeName =', safeName);
    console.log('filePath =', filePath);

    const sb = getSupabase();

    const { data: buckets, error: bucketsError } = await sb.storage.listBuckets();
    console.log('buckets =', buckets);
    console.log('bucketsError =', bucketsError);

    const { data, error } = await sb.storage
      .from(BUCKET)
      .createSignedUploadUrl(filePath);

    console.log('signedUpload data =', data);
    console.log('signedUpload error =', error);

    if (error) {
      return err(res, `SUPABASE_UPLOAD_URL_ERROR: ${error.message}`, 500);
    }

    console.log('--- /api/upload-url OK ---');
    return ok(res, { uploadUrl: data.signedUrl, filePath, token: data.token });
  } catch (e) {
    console.error('FATAL /api/upload-url', e);
    return err(res, `FATAL: ${e.message}`, 500);
  }
};
