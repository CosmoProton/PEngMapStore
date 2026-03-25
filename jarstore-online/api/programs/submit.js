const { 
  getSupabase, 
  verifyToken, 
  setCors, 
  ok, 
  err, 
  canUpload, 
  maxProjects, 
  isAdmin, 
  checkStorageLimit 
} = require('../_utils');

const ACCOUNT_MIN_DAYS = 5;

/**
 * Funzione helper per i controlli di sicurezza anti-spam
 */
async function antiSpamCheck(sb, dbUser) {
  // Whitelisted, Admin e Superadmin saltano i controlli anti-spam temporali
  if (['whitelisted', 'admin', 'superadmin'].includes(dbUser.user_status)) return null;

  // Controllo età account GitHub
  if (dbUser.github_created_at) {
    const ageMs = Date.now() - new Date(dbUser.github_created_at).getTime();
    if (ageMs < ACCOUNT_MIN_DAYS * 86400000) {
      const left = Math.ceil((ACCOUNT_MIN_DAYS * 86400000 - ageMs) / 86400000);
      return `Account GitHub troppo recente. Mancano ${left} giorni.`;
    }
  }

  // Controllo presenza di almeno 1 repository pubblico
  if ((dbUser.github_public_repos || 0) < 1) {
    return 'Il tuo account GitHub deve avere almeno 1 repository pubblico.';
  }

  return null;
}

module.exports = async (req, res) => {
  // Configurazione CORS per Vercel
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  // 1. Verifica autenticazione (JWT)
  const user = verifyToken(req);
  if (!user) return err(res, 'Non autenticato', 401);

  const sb = getSupabase();

  // 2. Recupero dati freschi dell'utente dal DB
  const { data: dbUser } = await sb
    .from('users')
    .select('id, user_status, github_created_at, github_public_repos')
    .eq('id', user.id)
    .single();

  if (!dbUser) return err(res, 'Utente non trovato', 404);
  
  // 3. Controlli sui permessi del ruolo
  if (dbUser.user_status === 'banned') return err(res, 'Account sospeso', 403);
  if (dbUser.user_status === 'pending') return err(res, 'Il tuo account è in attesa di approvazione admin.', 403);
  if (!canUpload(dbUser.user_status)) return err(res, 'Non hai i permessi per caricare programmi', 403);

  // 4. Controllo limite storage globale (Supabase)
  const storageFull = await checkStorageLimit(sb);
  if (storageFull) return err(res, 'Storage quasi pieno. Contatta l\'admin.', 507);

  // 5. Esecuzione Anti-spam
  const spamErr = await antiSpamCheck(sb, dbUser);
  if (spamErr) return err(res, spamErr, 429);

  // 6. Controllo limiti per progetto (Approvati e in Pending)
  const max = maxProjects(dbUser.user_status);
  const { count: approvedCount } = await sb
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('uploader_id', user.id)
    .eq('status', 'approved');

  if (approvedCount >= max) {
    return err(res, `Hai raggiunto il limite di ${max} progetti approvati per il tuo livello.`, 429);
  }

  const { count: pendingCount } = await sb
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('uploader_id', user.id)
    .eq('status', 'pending');

  if (pendingCount >= 1 && !isAdmin(dbUser.user_status)) {
    return err(res, 'Hai già un progetto in attesa di revisione.', 429);
  }

  // 7. Estrazione dati dal body e Validazione (Tua Nuova Logica)
  const { name, description, version, tags, contributors, filePath, originalName, fileSize } = req.body || {};
  
  if (!name?.trim())  return err(res, 'Nome obbligatorio');
  if (!filePath)      return err(res, 'File obbligatorio');
  if (!originalName)  return err(res, 'Nome file obbligatorio');

  // LOGICA INFO JAR: Pulizia stringa collaboratori (es: "@user1, @user2")
  const cleanedContributors = contributors 
    ? contributors.split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0)
        .join(', ')
    : '';

  // 8. Inserimento nel Database
  const { data: prog, error } = await sb
    .from('programs')
    .insert({
      name:          name.trim(),
      description:   description?.trim()   || '',
      version:       version?.trim()       || '1.0.0',
      tags:          tags?.trim()          || '',
      contributors:  cleanedContributors, // Stringa pulita salvata qui
      file_path:     filePath,
      original_name: originalName,
      file_size:     fileSize || 0,
      uploader_id:   user.id,
      status:        'pending',
    })
    .select()
    .single();

  if (error) return err(res, error.message, 500);

  // 9. Logging operazione e risposta finale
  await sb.from('submission_log').insert({ user_id: user.id });
  ok(res, prog, 201);
};
