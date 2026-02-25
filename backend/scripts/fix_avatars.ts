import db from '../src/utils/db';

async function fix() {
  const influencerCount = await db('influencers')
    .where('profile_image_url', 'like', '%unavatar.io/twitter/%')
    .count('* as n').first();
  const userCount = await db('users')
    .where('avatar_url', 'like', '%unavatar.io/twitter/%')
    .count('* as n').first();
  console.log('influencers to fix:', influencerCount?.n, '| users to fix:', userCount?.n);

  const inf = await db('influencers')
    .where('profile_image_url', 'like', '%unavatar.io/twitter/%')
    .update({
      profile_image_url: db.raw("replace(profile_image_url, 'unavatar.io/twitter/', 'unavatar.io/x/')"),
    });
  const usr = await db('users')
    .where('avatar_url', 'like', '%unavatar.io/twitter/%')
    .update({
      avatar_url: db.raw("replace(avatar_url, 'unavatar.io/twitter/', 'unavatar.io/x/')"),
    });
  console.log('Done — updated influencers:', inf, '| users:', usr);
  process.exit(0);
}
fix().catch(e => { console.error(e.message); process.exit(1); });
