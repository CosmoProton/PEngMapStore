const { getSupabase, signToken, SUPERADMIN, MAX_USERS } = require('../_utils');

async function ghGet(url, token) {
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'EngMapStore' },
  });
  return r.json();
}

module.exports = async (req, res) => {
  const APP = process.env.APP_URL;
  const { code } = req.query;
  if (!code) return res.redirect(`${APP}/login?error=no_code`);

  try {
    const tkRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri:  `${APP}/api/auth/callback`,
      }),
    });
    const { access_token: at } = await tkRes.json();
    if (!at) throw new Error('no access_token');

    const [gu, emails] = await Promise.all([
      ghGet('https://api.github.com/user', at),
      ghGet('https://api.github.com/user/emails', at).catch(() => []),
    ]);
    const email = (Array.isArray(emails) ? emails.find(e => e.primary)?.email : null) || gu.email || null;
    const sb = getSupabase();

    // Check if user already exists
    const { data: existing } = await sb
      .from('users')
      .select('id,user_status')
      .eq('github_id', String(gu.id))
      .single();

    const isNew = !existing;

    if (isNew) {
      const { count } = await sb
        .from('users')
        .select('*', { count: 'exact', head: true })
        .not('user_status', 'eq', 'banned');
      if (count >= MAX_USERS) return res.redirect(`${APP}/login?error=full`);
    }

    // Superadmin is fixed, otherwise preserve existing status
    const isSuperadmin = gu.login === SUPERADMIN;
    const user_status  = isSuperadmin ? 'superadmin' : (existing?.user_status || 'pending');

    if (user_status === 'banned') return res.redirect(`${APP}/login?error=banned`);

    if (isNew) {
      await sb.from('users').insert({
        github_id:           String(gu.id),
        github_username:     gu.login,
        email, avatar_url:   gu.avatar_url,
        user_status,
        github_created_at:   gu.created_at,
        github_public_repos: gu.public_repos || 0,
      });
    } else {
      // Update only GitHub data, NEVER user_status
      await sb.from('users').update({
        github_username:     gu.login,
        email, avatar_url:   gu.avatar_url,
        github_public_repos: gu.public_repos || 0,
      }).eq('github_id', String(gu.id));
    }

    const { data: user } = await sb
      .from('users')
      .select('id,github_username,email,avatar_url,user_status,is_contributor')
      .eq('github_id', String(gu.id))
      .single();

    if (!user) throw new Error('User not found');
    if (user.user_status === 'banned') return res.redirect(`${APP}/login?error=banned`);

    const token = signToken({
      id:             user.id,
      github_username:user.github_username,
      email:          user.email,
      avatar_url:     user.avatar_url,
      user_status:    user.user_status,
      is_contributor: user.is_contributor,
    });

    res.redirect(`${APP}/auth/callback?token=${token}${isNew ? '&welcome=1' : ''}`);
  } catch (e) {
    console.error('[auth/callback]', e.message);
    res.redirect(`${process.env.APP_URL}/login?error=auth_failed`);
  }
};
