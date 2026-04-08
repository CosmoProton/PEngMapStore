const { getSupabase, setCors, ok, err } = require('../_utils');

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);
const PREVIEW_TTL_SECONDS = 60 * 60;
const STORAGE_BUCKET = 'jars';

function getExtension(filename = '') {
  const clean = String(filename).trim().toLowerCase();
  const lastDot = clean.lastIndexOf('.');
  if (lastDot === -1) return '';
  return clean.slice(lastDot + 1);
}

function isPreviewableImage(filename = '') {
  return IMAGE_EXTENSIONS.has(getExtension(filename));
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const sb = getSupabase();

  const { data, error } = await sb
    .from('programs')
    .select(`
      id,
      name,
      description,
      version,
      tags,
      contributors,
      file_path,
      original_name,
      file_size,
      download_count,
      created_at,
      uploader_id,
      users!uploader_id(github_username,avatar_url,user_status)
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) return err(res, error.message, 500);

  const programs = await Promise.all(
    (data || []).map(async (p) => {
      const previewable = isPreviewableImage(p.original_name);
      let preview_url = null;

      if (previewable && p.file_path) {
        const { data: signedData, error: signedError } = await sb
          .storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(p.file_path, PREVIEW_TTL_SECONDS);

        if (!signedError && signedData?.signedUrl) {
          preview_url = signedData.signedUrl;
        }
      }

      return {
        ...p,
        is_previewable: previewable,
        preview_url,
        uploader: p.users?.github_username || null,
        uploader_avatar: p.users?.avatar_url || null,
        uploader_status: p.users?.user_status || null,
        users: undefined,
      };
    })
  );

  ok(res, programs);
};