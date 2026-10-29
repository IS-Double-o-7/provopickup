(() => {
'use strict';

/* =====================================================================
   1. Helpers
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAY = 864e5;
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const todayISO = () => iso(today0());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = d => addDays(d, -((d.getDay() + 6) % 7));
const dayNum = d => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
const fmtShort = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtDay = k => parseISO(k).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fmtLong = d => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const weekdayName = d => d.toLocaleDateString('en-US', { weekday: 'long' });
const fmtTime = t => { const [h, m] = t.split(':').map(Number); return `${(h % 12) || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`; };
const relDay = k => {
  const diff = dayNum(parseISO(k)) - dayNum(today0());
  if (diff === 0) return 'Today'; if (diff === 1) return 'Tomorrow'; if (diff === -1) return 'Yesterday';
  return diff > 1 ? `In ${diff} days` : `${-diff} days ago`;
};
const relTime = ts => {
  const diff = Date.now() - ts;
  if (diff < 60e3) return 'now';
  if (diff < 3600e3) return Math.floor(diff / 60e3) + 'm';
  if (diff < DAY) return Math.floor(diff / 3600e3) + 'h';
  if (diff < 2 * DAY) return 'Yesterday';
  if (diff < 7 * DAY) return new Date(ts).toLocaleDateString('en-US', { weekday: 'short' });
  return fmtShort(new Date(ts));
};
const hue = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const initials = n => (n || '').replace('@', '').split(/[\s._]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
const avatar = (name, size = 40) => `<span class="avatar" style="--s:${size}px;--av:hsl(${hue(name || 'You')} 42% 40%)" aria-hidden="true">${esc(initials(name || 'You'))}</span>`;
const photoAvatar = (src, name, size = 40) => src ? `<img class="avatar" src="${esc(src)}" alt="" style="--s:${size}px;object-fit:cover">` : avatar(name, size);
const plural = (n, w, p = w + 's') => `${n} ${n === 1 ? w : p}`;

const ICON = (() => {
  const s = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${extra} aria-hidden="true">${d}</svg>`;
  return {
    home: s('<path d="M3.5 11 12 4l8.5 7v9a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>'),
    play: s('<rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M2.5 7v10M21.5 7v10"/>'),
    messages: s('<path d="M4 5h16v11H9.5L5 20v-4H4z"/>'),
    courts: s('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    calendar: s('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    reels: s('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="m10 8.5 5.5 3.5-5.5 3.5z"/>'),
    challenge: s('<path d="M13 2 4.5 13.5H11L10 22l9-12h-6.5z"/>'),
    stats: s('<path d="M5 20v-8M12 20V4M19 20v-5"/>'),
    more: s('<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>'),
    plus: s('<path d="M12 5v14M5 12h14"/>'),
    x: s('<path d="M6 6l12 12M18 6 6 18"/>'),
    heart: s('<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>'),
    comment: s('<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4A8 8 0 1 1 20 12z"/>'),
    bookmark: s('<path d="M6 3.5h12V21l-6-4-6 4z"/>'),
    share: s('<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8M5 13v7h14v-7"/>'),
    back: s('<path d="M15 5l-7 7 7 7"/>'),
    left: s('<path d="M15 5l-7 7 7 7"/>'),
    right: s('<path d="M9 5l7 7-7 7"/>'),
    send: s('<path d="M4 12 20 4l-6 16-3-7z"/>'),
    check: s('<path d="M5 12.5 10 17l9-10"/>'),
    flag: s('<path d="M5 21V4h11l-2 4 2 4H5"/>'),
    medal: s('<circle cx="12" cy="14" r="6"/><path d="M8.5 3h7L14 9h-4z"/>'),
    spark: s('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
    clock: s('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    user: s('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  };
})();

/* =====================================================================
   2. Reference data (would come from the server)
   ===================================================================== */
const SPORTS = [
  { id: 'pickleball', name: 'Pickleball', icon: '🏓', community: '8.2k' },
  { id: 'basketball', name: 'Basketball', icon: '🏀', community: '5.6k' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐', community: '4.1k' },
  { id: 'soccer', name: 'Soccer', icon: '⚽', community: '3.2k' },
  { id: 'tennis', name: 'Tennis', icon: '🎾', community: '2.8k' },
  { id: 'spikeball', name: 'Spikeball', icon: '🟡', community: '1.4k' },
  { id: 'badminton', name: 'Badminton', icon: '🏸', community: '1.1k' },
  { id: 'kickball', name: 'Kickball', icon: '🔴', community: '620' },
];
const sport = id => SPORTS.find(s => s.id === id) || SPORTS[0];
const LEVELS = ['Beginner', 'Casual', 'Intermediate', 'Advanced'];
const SLOTS = { 'Mon eve': 'Monday evenings', 'Tue eve': 'Tuesday evenings', 'Wed eve': 'Wednesday evenings', 'Thu eve': 'Thursday evenings', 'Fri eve': 'Friday evenings', 'Sat am': 'Saturday mornings', 'Sat pm': 'Saturday afternoons', 'Sun pm': 'Sunday afternoons' };

const PLACES = [
  { id: 'kiwanis', name: 'Kiwanis Park Courts', sports: ['pickleball'], setting: 'Outdoor', count: 6, unit: 'courts', mi: 2.1, busy: 'Busy evenings' },
  { id: 'rec', name: 'Provo Rec Center', sports: ['basketball', 'volleyball', 'badminton', 'pickleball'], setting: 'Indoor', count: 4, unit: 'courts', mi: 3.4, busy: 'Steady all day' },
  { id: 'northpark', name: 'North Park Fields', sports: ['soccer', 'kickball', 'spikeball'], setting: 'Outdoor', count: 3, unit: 'fields', mi: 3.8, busy: 'Quiet weekdays' },
  { id: 'byu', name: 'BYU Outdoor Courts', sports: ['tennis', 'pickleball'], setting: 'Outdoor', count: 8, unit: 'courts', mi: 4.0, busy: 'Busy weekends' },
  { id: 'memorial', name: 'Memorial Park', sports: ['volleyball', 'spikeball'], setting: 'Outdoor', count: 2, unit: 'courts', mi: 4.7, busy: 'Quiet' },
];
const place = id => PLACES.find(p => p.id === id);

const PEOPLE = [
  { id: 'jamie', name: 'Jamie Lee', age: 26, mi: 2.4, sports: [['pickleball', 'Intermediate'], ['tennis', 'Beginner']], avail: ['Tue eve', 'Thu eve', 'Sat am'], court: 'kiwanis', likesYou: true, bio: 'Competitive enough to keep score, social enough to grab tacos after.' },
  { id: 'marcus', name: 'Marcus Chen', age: 23, mi: 3.1, sports: [['basketball', 'Intermediate'], ['soccer', 'Casual']], avail: ['Mon eve', 'Wed eve', 'Sat pm'], court: 'rec', likesYou: true, bio: 'Weeknight runs, weekend pickup, and learning to love a close game.' },
  { id: 'taylor', name: 'Taylor Brooks', age: 28, mi: 4.7, sports: [['volleyball', 'Intermediate'], ['spikeball', 'Casual']], avail: ['Thu eve', 'Sat am', 'Sun pm'], court: 'memorial', likesYou: true, bio: 'Looking for consistent games and good energy. Let’s make it a habit.' },
  { id: 'sam', name: 'Sam Rivera', age: 24, mi: 1.8, sports: [['pickleball', 'Intermediate'], ['volleyball', 'Casual']], avail: ['Tue eve', 'Sat am'], court: 'kiwanis', likesYou: true, bio: 'Just moved to Provo and looking for a regular crew. Always down for one more game.' },
  { id: 'noor', name: 'Noor Haddad', age: 29, mi: 2.1, sports: [['pickleball', 'Advanced'], ['spikeball', 'Intermediate']], avail: ['Tue eve', 'Thu eve', 'Sat am'], court: 'kiwanis', likesYou: false, bio: '3.5 DUPR and happy to drill dinks with anyone who wants to get better.' },
  { id: 'priya', name: 'Priya Nair', age: 27, mi: 2.9, sports: [['tennis', 'Intermediate'], ['pickleball', 'Casual']], avail: ['Wed eve', 'Sat am'], court: 'byu', likesYou: true, bio: 'Former high school tennis player easing back in. Patient with beginners, happy to rally.' },
  { id: 'hannah', name: 'Hannah Kim', age: 22, mi: 1.2, sports: [['volleyball', 'Casual'], ['badminton', 'Intermediate']], avail: ['Mon eve', 'Thu eve'], court: 'rec', likesYou: false, bio: 'Grad student. Badminton is my stress relief and volleyball is my social life.' },
  { id: 'diego', name: 'Diego Alvarez', age: 25, mi: 3.6, sports: [['soccer', 'Advanced'], ['basketball', 'Casual']], avail: ['Tue eve', 'Thu eve', 'Sun pm'], court: 'northpark', likesYou: true, bio: 'I organize a Sunday pickup game at North Park. We always need a few more.' },
  { id: 'eli', name: 'Eli Watson', age: 31, mi: 4.2, sports: [['basketball', 'Advanced'], ['pickleball', 'Beginner']], avail: ['Sat am', 'Sat pm'], court: 'rec', likesYou: true, bio: 'Saturday morning runs at the Rec. Trying pickleball because my knees asked nicely.' },
  { id: 'chris', name: 'Chris Okafor', age: 26, mi: 5.0, sports: [['kickball', 'Casual'], ['soccer', 'Casual']], avail: ['Fri eve', 'Sun pm'], court: 'northpark', likesYou: true, bio: 'Captain of a very average rec kickball team. We bring snacks and good attitudes.' },
];
const dbPlayers = new Map();
const person = id => dbPlayers.get(id) || PEOPLE.find(p => p.id === id);

const CHALLENGES = [
  { id: 'invite', cat: 'Community', title: 'Invite someone new to play this week', body: 'Message one of your matches about a game. Your crew gets better when it gets bigger.', xp: 40, min: 2, auto: 'message' },
  { id: 'skill', cat: 'Practice', title: 'Practice one skill for 10 minutes', body: 'Handles, serves, dinks or footwork. Pick one and give it ten focused minutes.', xp: 25, min: 10 },
  { id: 'visit', cat: 'Explore', title: 'Visit a court you haven’t tried', body: 'Pick a spot from the Courts tab. Bonus if you play while you’re there.', xp: 30, min: 30 },
  { id: 'encourage', cat: 'Kindness', title: 'Encourage a player', body: 'Send a kind note to someone you played with recently.', xp: 20, min: 2, auto: 'message' },
  { id: 'plan', cat: 'Commit', title: 'Put a game on the calendar', body: 'Pick a day, a court and a time. Plans you write down are plans you keep.', xp: 35, min: 3, auto: 'game' },
  { id: 'try', cat: 'Explore', title: 'Try a sport you don’t usually play', body: 'Browse players in a new sport, or join a beginner run.', xp: 40, min: 45 },
  { id: 'move', cat: 'Move', title: 'Get 20 active minutes', body: 'A game, a walk to the courts, a quick shootaround. It all counts.', xp: 20, min: 20 },
];
const challengeFor = d => CHALLENGES[dayNum(d) % CHALLENGES.length];

const REELS = [
  { id: 'r1', sport: 'pickleball', cat: 'Tips', title: '3 ways to find your soft game', caption: 'A softer touch makes a big difference at the kitchen line.', creator: '@maddieplays', likes: 248, comments: 18, ago: 1 },
  { id: 'r2', sport: 'pickleball', cat: 'Pickup games', title: 'A perfect evening at Kiwanis', caption: 'The kind of night that makes you want to come back tomorrow.', creator: '@provo.pickle', likes: 193, comments: 11, ago: 2 },
  { id: 'r3', sport: 'basketball', cat: 'Beginner friendly', title: 'Beginner hoops: come as you are', caption: 'Beginner-friendly runs every Thursday at the Rec.', creator: '@hoopswithj', likes: 89, comments: 9, ago: 2 },
  { id: 'r4', sport: 'volleyball', cat: 'Community', title: 'Your reminder to try something new', caption: 'Try something new with people who make it easy.', creator: '@taylormoves', likes: 321, comments: 24, ago: 3 },
  { id: 'r5', sport: 'soccer', cat: 'Pickup games', title: 'Sunday pickup at North Park', caption: 'All levels, pinnies provided, we play until sunset.', creator: '@diego.plays', likes: 156, comments: 14, ago: 4 },
  { id: 'r6', sport: 'tennis', cat: 'Tips', title: 'Fix your toss in one session', caption: 'Consistent toss, consistent serve. Three drills to try.', creator: '@priyaserves', likes: 74, comments: 6, ago: 5 },
  { id: 'r7', sport: 'spikeball', cat: 'Highlights', title: 'That rally went on forever', caption: 'Memorial Park, Saturday morning, zero chill.', creator: '@roundnet.provo', likes: 211, comments: 19, ago: 6 },
  { id: 'r8', sport: 'badminton', cat: 'Tips', title: 'Footwork that saves your shuttle', caption: 'Split step first, then go.', creator: '@hannahk', likes: 58, comments: 3, ago: 8 },
];

/* =====================================================================
   3. Store + API
   Every screen reads and writes through `api`, and every method is async.
   Today it works against a local store saved in this browser. To connect
   a real backend, replace each method body with a fetch() to your server
   (e.g. api.swipe -> POST /swipes, api.send -> POST /conversations/:id/messages).
   ===================================================================== */
function seed() {
  const t = today0();
  const done = [];
  for (let i = 4; i >= 1; i--) { const d = addDays(t, -i), c = challengeFor(d); done.push({ date: iso(d), id: c.id, xp: c.xp }); }

  const now = Date.now(), H = 3600e3, M = 60e3;
  return {
    v: 1,
    profile: { name: '', sports: { pickleball: 'Intermediate', volleyball: 'Casual', basketball: 'Casual' }, avail: ['Tue eve', 'Thu eve', 'Sat am'] },
    swipes: {},
    matches: ['jamie', 'marcus', 'taylor'],
    conversations: [
      { id: 'c-jamie', with: 'jamie', unread: 1, messages: [
        { from: 'them', text: `Good games ${weekdayName(addDays(t, -3))}! Your third shot drop is getting dangerous.`, at: now - 50 * H },
        { from: 'me', text: 'Ha, thanks. Your serve is the real problem.', at: now - 49 * H },
        { from: 'them', text: `Still good for ${weekdayName(addDays(t, 2))} at 6? I can grab court 3.`, at: now - 9 * M } ] },
      { id: 'c-marcus', with: 'marcus', unread: 1, messages: [
        { from: 'me', text: 'Rec center next week? They open the full court at 7.', at: now - 5 * H },
        { from: 'them', text: 'That court works for me!', at: now - 2 * H } ] },
      { id: 'c-taylor', with: 'taylor', unread: 0, messages: [
        { from: 'them', text: 'Fun game last night. Same time next week?', at: now - 20 * H },
        { from: 'me', text: 'Count me in.', at: now - 19 * H } ] },
    ],
    games: [],
    challenges: { done, swaps: {} },
    reels: { liked: [], saved: [], following: ['@provo.pickle'], hidden: [], posts: [], comments: {} },
    ui: { playSport: 'all', placeSport: 'all', reelSport: 'all', reelTab: 'for-you', statsRange: 'week' },
  };
}

const store = (() => {
  const KEY = 'rally.provo.v1';
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
  if (!s || s.v !== 1) s = seed();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage unavailable: keep in memory */ } };
  save();
  return { get: () => s, save, reset() { s = seed(); save(); } };
})();
const S = () => store.get();

/* ---- Supabase ---- */
// auth.js creates the client so the login screen and the app share one session.
const db = window.rallyDb || window.supabase.createClient(RALLY_CONFIG.SUPABASE_URL, RALLY_CONFIG.SUPABASE_ANON_KEY);
const ME = 'me';
const authError = (message, cause) => Object.assign(new Error(message), { cause });
function profileFromRows(row, interests = [], avail = [], photos = []) {
  const sports = Object.fromEntries((interests || []).map(x => [x.interest_id, x.skill_level]).filter(([id, level]) => id && level));
  return {
    id: row.profile_id, ownerId: row.auth_uid || null, name: row.name || '', bio: row.bio || '',
    sports, avail, photo: photos[0]?.photo_file || '',
  };
}
function hasLiveAccount() {
  const user = window.RallyAuth && window.RallyAuth.user();
  return Boolean(user?.id && !user.demo && S().profile?.ownerId === user.id && S().profile?.id);
}
function requireProfileId() {
  if (!hasLiveAccount()) throw authError('Sign in and finish your profile to use matching.');
  return S().profile.id;
}
async function loadPlayerRows(profileIds) {
  const ids = [...new Set(profileIds || [])].filter(Boolean);
  if (!ids.length) return [];
  const [profilesResult, interestsResult, availabilityResult, photosResult] = await Promise.all([
    db.from('profile').select('profile_id,name,bio').in('profile_id', ids),
    db.from('profile_interest').select('user_id,interest_id,skill_level').in('user_id', ids),
    db.from('profile_availability').select('profile_id,slot').in('profile_id', ids),
    db.from('photo').select('user_id,photo_file,display_order_id').in('user_id', ids).order('display_order_id', { ascending: true }),
  ]);
  for (const [result, message] of [
    [profilesResult, 'Could not load player profiles.'],
    [interestsResult, 'Could not load player sports and skill levels.'],
    [availabilityResult, 'Could not load player availability.'],
    [photosResult, 'Could not load player photos.'],
  ]) if (result.error) throw authError(message, result.error);
  const byOwner = rows => (rows || []).reduce((map, row) => {
    const key = row.user_id || row.profile_id;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
    return map;
  }, new Map());
  const interestsByPlayer = byOwner(interestsResult.data);
  const availabilityByPlayer = byOwner(availabilityResult.data);
  const photosByPlayer = byOwner(photosResult.data);
  const players = (profilesResult.data || []).map(row => {
    const interests = (interestsByPlayer.get(row.profile_id) || []).filter(x =>
      SPORTS.some(s => s.id === x.interest_id) && LEVELS.includes(x.skill_level));
    const player = {
      id: row.profile_id, name: row.name || '', bio: row.bio || '',
      photo: photosByPlayer.get(row.profile_id)?.[0]?.photo_file || '',
      sports: interests.map(x => [x.interest_id, x.skill_level]),
      avail: [...new Set((availabilityByPlayer.get(row.profile_id) || []).map(x => x.slot).filter(slot => Object.hasOwn(SLOTS, slot)))],
    };
    dbPlayers.set(player.id, player);
    return player;
  });
  return players;
}
async function loadPlayersForIds(ids) {
  const players = await loadPlayerRows(ids);
  const byId = new Map(players.map(p => [p.id, p]));
  return ids.map(id => byId.get(id)).filter(Boolean);
}
async function loadProfileFor(user) {
  const { data: profileId, error: profileError } = await db.rpc('current_profile_id');
  if (profileError) throw authError('Could not load your profile.', profileError);
  if (!profileId) return null;
  const { data: row, error: rowError } = await db.from('profile')
    .select('profile_id,name,bio').eq('profile_id', profileId).maybeSingle();
  if (rowError) throw authError('Could not load your profile.', rowError);
  if (!row) return null;
  const [interestsResult, availabilityResult, photosResult] = await Promise.all([
    db.from('profile_interest').select('interest_id,skill_level').eq('user_id', row.profile_id),
    db.from('profile_availability').select('slot').eq('profile_id', row.profile_id),
    db.from('photo').select('photo_file,display_order_id').eq('user_id', row.profile_id).order('display_order_id', { ascending: true }),
  ]);
  const { data: interests, error: interestsError } = interestsResult;
  const { data: availability, error: availabilityError } = availabilityResult;
  const { data: photos, error: photosError } = photosResult;
  if (interestsError) throw authError('Could not load your sports and skill levels.', interestsError);
  if (availabilityError) throw authError('Could not load your availability.', availabilityError);
  if (photosError) throw authError('Could not load your profile photo.', photosError);
  return profileFromRows({ ...row, auth_uid: user.id }, interests, (availability || []).map(x => x.slot), photos || []);
}
async function persistProfilePhoto(user, profileId, photo) {
  if (!photo) throw authError('Choose a profile photo before saving.');
  let photoUrl = photo;
  if (photo.startsWith('data:image/')) {
    const bucketName = RALLY_CONFIG.PROFILE_PHOTO_BUCKET;
    if (!bucketName || bucketName.startsWith('YOUR-')) throw authError('Profile photo storage is not configured yet.');
    const blob = await (await fetch(photo)).blob();
    const path = `${user.id}/profile.jpg`;
    const bucket = db.storage.from(bucketName);
    const { error: uploadError } = await bucket.upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (uploadError) throw authError('Your profile fields were saved, but your photo could not be uploaded.', uploadError);
    photoUrl = bucket.getPublicUrl(path).data.publicUrl;
  }
  const { data: existing, error: readError } = await db.from('photo').select('photo_id')
    .eq('user_id', profileId).order('display_order_id', { ascending: true }).limit(1);
  if (readError) throw authError('Your profile fields were saved, but your photo could not be checked.', readError);
  const photoRow = { user_id: profileId, photo_file: photoUrl, display_order_id: 1 };
  const result = existing?.length
    ? await db.from('photo').update({ photo_file: photoUrl, display_order_id: 1 }).eq('photo_id', existing[0].photo_id)
    : await db.from('photo').insert(photoRow);
  if (result.error) throw authError('Your profile fields were saved, but your photo could not be saved.', result.error);
  return photoUrl;
}
const rowToGame = r => ({
  id: r.event_id, sport: r.interest_id, place: r.venue_id,
  date: r.event_date, time: String(r.event_time).slice(0, 5),
  with: (r.event_attendee || []).map(a => a.profile_id).filter(p => p !== ME),
  met: r.new_people_met || 0, note: r.note || '',
});
const lastMsg = c => c.messages[c.messages.length - 1];
const myHandle = () => '@' + ((S().profile.name || 'you').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'you');

function compat(p, me) {
  let score = 40, best = null;
  for (const [sp, lvl] of p.sports) {
    const mine = me.sports[sp]; if (!mine) continue;
    const gap = Math.abs(LEVELS.indexOf(mine) - LEVELS.indexOf(lvl)), pts = 24 - gap * 7;
    score += pts;
    if (!best || pts > best.pts) best = { sp, lvl, gap, pts };
  }
  const shared = p.avail.filter(a => me.avail.includes(a));
  score += Math.min(shared.length, 2) * 8;
  score = Math.round(Math.max(52, Math.min(98, score)));
  let reason = best
    ? `You both play ${best.gap === 0 ? best.lvl.toLowerCase() + ' ' : ''}${sport(best.sp).name.toLowerCase()}`
    : `A chance to try ${sport(p.sports[0][0]).name.toLowerCase()}`;
  reason += shared.length ? ` and are free ${SLOTS[shared[0]].toLowerCase()}.` : '.';
  return { score, reason, shared };
}

function activeDaySet() {
  const tk = todayISO(), set = new Set(S().games.filter(g => g.date <= tk).map(g => g.date));
  S().challenges.done.forEach(c => set.add(c.date));
  return set;
}
function currentStreak() {
  const set = activeDaySet(); let d = today0(), n = 0;
  if (!set.has(iso(d))) d = addDays(d, -1);
  while (set.has(iso(d))) { n++; d = addDays(d, -1); }
  return n;
}
function todaysChallenge() { const s = S(); return CHALLENGES.find(c => c.id === s.challenges.swaps[todayISO()]) || challengeFor(today0()); }
function doneToday() { return S().challenges.done.find(d => d.date === todayISO()); }
function completeToday() {
  if (doneToday()) return null;
  const c = todaysChallenge(), rec = { date: todayISO(), id: c.id, xp: c.xp };
  S().challenges.done.push(rec); store.save(); return rec;
}

const api = {
  // auth.js owns sign-up, sign-in and sign-out. These methods persist the
  // signed-in player's profile against Jordan's auth_uid/profile_id contract.
  async profile() {
    const user = window.RallyAuth && window.RallyAuth.user();
    if (!user?.id) throw authError('Sign in to load your profile.');
    const profile = (await loadProfileFor(user)) || {
      id: null, ownerId: null, name: user.user_metadata?.name || '', bio: '', sports: {}, avail: [], photo: '',
    };
    S().profile = profile; store.save();
    return profile;
  },
  async saveProfile(p) {
    const user = window.RallyAuth && window.RallyAuth.user();
    if (!user?.id) throw authError('Sign in to save your profile.');
    if (p.ownerId && p.ownerId !== user.id) throw authError('You can only save your own profile.');
    const name = String(p.name || '').trim();
    const bio = String(p.bio || '').trim();
    const profileFields = { name, bio };
    if (!name || name.length > 40) throw authError('Enter a first name with no more than 40 characters.');
    if (bio.length > BIO_MAX) throw authError(`Keep your bio to ${BIO_MAX} characters or fewer.`);
    if (!p.photo) throw authError('Choose a profile photo before saving.');
    const wanted = Object.entries(p.sports || {}).filter(([id, level]) => SPORTS.some(s => s.id === id) && LEVELS.includes(level));
    if (!wanted.length) throw authError('Choose at least one sport and skill level.');
    const wantedSlots = [...new Set((p.avail || []).filter(slot => Object.hasOwn(SLOTS, slot)))];
    if (!wantedSlots.length) throw authError('Choose at least one time you are usually free.');
    const { data: existingProfileId, error: profileReadError } = await db.rpc('current_profile_id');
    if (profileReadError) throw authError('Could not check your profile.', profileReadError);
    let profileId = existingProfileId;
    if (!profileId) {
      const { data, error } = await db.from('profile')
        .insert({ profile_id: user.id, auth_uid: user.id, ...profileFields })
        .select('profile_id').single();
      if (error) throw authError('Your profile could not be created.', error);
      profileId = data.profile_id;
    } else {
      const { error } = await db.from('profile').update(profileFields).eq('profile_id', profileId);
      if (error) throw authError('Could not save your name and bio.', error);
    }

    const { data: current, error: currentError } = await db.from('profile_interest').select('interest_id').eq('user_id', profileId);
    if (currentError) throw authError('Could not update your sports and skill levels.', currentError);
    const currentIds = new Set((current || []).map(x => x.interest_id));
    const wantedIds = new Set(wanted.map(([id]) => id));
    const removed = [...currentIds].filter(id => !wantedIds.has(id));
    if (removed.length) {
      const { error } = await db.from('profile_interest').delete().eq('user_id', profileId).in('interest_id', removed);
      if (error) throw authError('Your profile name was saved, but some sports could not be removed.', error);
    }
    for (const [interest_id, skill_level] of wanted) {
      const { error } = await db.from('profile_interest').upsert({ user_id: profileId, interest_id, skill_level }, { onConflict: 'user_id,interest_id' });
      if (error) throw authError('Your profile was saved, but some sports or skill levels could not be saved.', error);
    }

    const { data: currentAvailability, error: availabilityReadError } = await db.from('profile_availability')
      .select('slot').eq('profile_id', profileId);
    if (availabilityReadError) throw authError('Your profile and sports were saved, but availability could not be read.', availabilityReadError);
    const currentSlots = new Set((currentAvailability || []).map(row => row.slot));
    const wantedSlotSet = new Set(wantedSlots);
    const removedSlots = [...currentSlots].filter(slot => !wantedSlotSet.has(slot));
    if (removedSlots.length) {
      const { error } = await db.from('profile_availability').delete().eq('profile_id', profileId).in('slot', removedSlots);
      if (error) throw authError('Your profile and sports were saved, but some availability could not be removed.', error);
    }
    const newSlots = wantedSlots.filter(slot => !currentSlots.has(slot));
    if (newSlots.length) {
      const { error } = await db.from('profile_availability').insert(newSlots.map(slot => ({ profile_id: profileId, slot })));
      if (error) throw authError('Your profile and sports were saved, but availability could not be saved.', error);
    }

    const photoUrl = await persistProfilePhoto(user, profileId, p.photo);

    const saved = { ...p, ...profileFields, id: profileId, ownerId: user.id, photo: photoUrl, sports: Object.fromEntries(wanted), avail: wantedSlots };
    S().profile = saved; store.save();
    return saved;
  },

  async deck(sportId = 'all') {
    if (hasLiveAccount()) {
      const myId = requireProfileId();
      const { data: choices, error: choicesError } = await db.from('choice')
        .select('swiped_on').eq('swiper', myId);
      if (choicesError) throw authError('Could not load your matching choices.', choicesError);
      const excluded = new Set([myId, ...(choices || []).map(row => row.swiped_on)]);
      const { data: profiles, error: profilesError } = await db.from('profile')
        .select('profile_id').neq('profile_id', myId);
      if (profilesError) throw authError('Could not load players for matching.', profilesError);
      const candidates = await loadPlayerRows((profiles || []).map(row => row.profile_id));
      const mine = S().profile;
      return candidates.filter(p => !excluded.has(p.id) && p.name && p.photo && p.sports.length && p.avail.length)
        .filter(p => sportId === 'all' || p.sports.some(([sp]) => sp === sportId))
        .map(p => ({ ...p, ...compat(p, mine) }))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    }
    const s = S(), me = s.profile;
    return PEOPLE.filter(p => !s.swipes[p.id] && !s.matches.includes(p.id))
      .filter(p => sportId === 'all' || p.sports.some(([sp]) => sp === sportId))
      .map(p => ({ ...p, ...compat(p, me) }))
      .sort((a, b) => b.score - a.score);
  },
  async swipe(id, dir) {
    if (hasLiveAccount()) {
      const myId = requireProfileId();
      if (!['like', 'pass'].includes(dir)) throw authError('Choose like or pass.');
      const target = person(id);
      if (!target || id === myId) throw authError('That player is no longer available. Refresh the deck and try again.');
      const { error } = await db.from('choice').upsert({
        swiper: myId, swiped_on: id, yes: dir === 'like', no: dir === 'pass',
      }, { onConflict: 'swiper,swiped_on' });
      if (error) throw authError('Your choice could not be saved. Please try again.', error);
      const { data: matches, error: matchesError } = await db.rpc('my_matches');
      if (matchesError) throw authError('Your choice was saved, but mutual matches could not be refreshed.', matchesError);
      const matchIds = (matches || []).map(row => row.profile_id);
      S().matches = matchIds; store.save();
      return { matched: dir === 'like' && matchIds.includes(id), conv: null };
    }
    const s = S(), p = person(id); s.swipes[id] = dir; let conv = null;
    if (dir === 'like' && p.likesYou) {
      s.matches.push(id);
      conv = { id: 'c-' + id, with: id, unread: 1, messages: [{ from: 'them', text: `Hey! Looks like we both like ${sport(p.sports[0][0]).name.toLowerCase()}. Want to get a game in this week?`, at: Date.now() }] };
      s.conversations.push(conv);
    }
    store.save(); return { matched: !!conv, conv };
  },
  async undoSwipe(id) {
    if (hasLiveAccount()) {
      const { error } = await db.from('choice').delete().eq('swiper', requireProfileId()).eq('swiped_on', id);
      if (error) throw authError('That choice could not be undone. Please try again.', error);
      return;
    }
    delete S().swipes[id]; store.save();
  },
  async resetPasses() {
    if (hasLiveAccount()) {
      const { error } = await db.from('choice').delete().eq('swiper', requireProfileId()).eq('no', true);
      if (error) throw authError('Passed players could not be restored. Please try again.', error);
      return;
    }
    const s = S(); for (const k in s.swipes) if (s.swipes[k] === 'pass') delete s.swipes[k]; store.save();
  },
  async likesSent() {
    if (hasLiveAccount()) {
      const myId = requireProfileId();
      const [{ data: choices, error: choicesError }, { data: matches, error: matchesError }] = await Promise.all([
        db.from('choice').select('swiped_on').eq('swiper', myId).eq('yes', true),
        db.rpc('my_matches'),
      ]);
      if (choicesError) throw authError('Could not load likes you sent.', choicesError);
      if (matchesError) throw authError('Could not check which likes are mutual.', matchesError);
      const matchedIds = new Set((matches || []).map(row => row.profile_id));
      const ids = (choices || []).map(row => row.swiped_on).filter(id => !matchedIds.has(id));
      return loadPlayersForIds(ids);
    }
    const s = S(); return Object.keys(s.swipes).filter(id => s.swipes[id] === 'like' && !s.matches.includes(id)).map(person);
  },
  async matches() {
    if (hasLiveAccount()) {
      const { data, error } = await db.rpc('my_matches');
      if (error) throw authError('Could not load your matches.', error);
      const ids = (data || []).map(row => row.profile_id);
      S().matches = ids; store.save();
      return loadPlayersForIds(ids);
    }
    return S().matches.map(person);
  },

  async conversations() { return [...S().conversations].sort((a, b) => lastMsg(b).at - lastMsg(a).at); },
  async conversation(id) { return S().conversations.find(c => c.id === id) || null; },
  async markRead(id) { const c = await api.conversation(id); if (c && c.unread) { c.unread = 0; store.save(); } },
  async send(id, text, kind = 'text') {
    const c = await api.conversation(id); if (!c) return {};
    c.messages.push({ from: 'me', text, at: Date.now(), kind }); store.save();
    const t = todaysChallenge();
    return { done: t.auto === 'message' ? completeToday() : null };
  },
  async demoReply(id, viewing) {
    const c = await api.conversation(id); if (!c) return null;
    const p = person(c.with), mine = [...c.messages].reverse().find(m => m.from === 'me');
    c.messages.push({ from: 'them', text: replyFor(mine ? mine.text : '', p), at: Date.now() });
    if (!viewing) c.unread = (c.unread || 0) + 1;
    store.save(); return c;
  },

  async places(sportId = 'all') { return PLACES.filter(p => sportId === 'all' || p.sports.includes(sportId)).sort((a, b) => a.mi - b.mi); },

  async syncGames() {
    const { data, error } = await db.from('event')
      .select('event_id, interest_id, venue_id, event_date, event_time, note, new_people_met, event_attendee(profile_id)');
    if (error) { console.error('Could not load games', error); return { error }; }
    S().games = data.map(rowToGame); store.save(); return { error: null };
  },

  async games({ from, to } = {}) {
    return S().games.filter(g => (!from || g.date >= from) && (!to || g.date <= to))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  },

  async addGame(g) {
    const { data, error } = await db.from('event').insert({
      host_id: ME, interest_id: g.sport, venue_id: g.place,
      event_date: g.date, event_time: g.time,
      note: g.note || null, new_people_met: g.met,
    }).select('event_id').single();
    if (error) { console.error('Could not save game', error); return { error }; }
    g.id = data.event_id;
    const status = g.date < todayISO() ? 'played' : 'going';
    const people = [ME, ...g.with];
    const { error: aErr } = await db.from('event_attendee')
      .insert(people.map(p => ({ event_id: g.id, profile_id: p, status })));
    if (aErr) console.error('Could not save who is playing', aErr);
    S().games.push(g); store.save();
    const t = todaysChallenge();
    return { game: g, done: t.auto === 'game' && g.date >= todayISO() ? completeToday() : null, error: null };
  },

  async removeGame(id) {
    const s = S(), i = s.games.findIndex(g => g.id === id);
    if (i < 0) return null;
    const { error } = await db.from('event').delete().eq('event_id', id);
    if (error) { console.error('Could not remove game', error); return null; }
    const [g] = s.games.splice(i, 1); store.save(); return g;
  },

  async restoreGame(g) {
    const { data, error } = await db.from('event').insert({
      host_id: ME, interest_id: g.sport, venue_id: g.place,
      event_date: g.date, event_time: g.time,
      note: g.note || null, new_people_met: g.met,
    }).select('event_id').single();
    if (error) { console.error('Could not restore game', error); return; }
    const status = g.date < todayISO() ? 'played' : 'going';
    await db.from('event_attendee').insert([ME, ...g.with].map(p => ({ event_id: data.event_id, profile_id: p, status })));
    g.id = data.event_id; S().games.push(g); store.save();
  },

  async reels({ sportId = 'all', tab = 'for-you' } = {}) {
    const r = S().reels, me = myHandle();
    const all = [...r.posts.map(p => ({ ...p, creator: me, mine: true })), ...REELS];
    return all.filter(x => !r.hidden.includes(x.id))
      .filter(x => sportId === 'all' || x.sport === sportId)
      .filter(x => tab === 'for-you' || (tab === 'saved' ? r.saved.includes(x.id) : (x.mine || r.following.includes(x.creator))))
      .map(x => ({ ...x,
        liked: r.liked.includes(x.id), saved: r.saved.includes(x.id), following: r.following.includes(x.creator),
        likeCount: x.likes + (r.liked.includes(x.id) ? 1 : 0),
        commentCount: x.comments + (r.comments[x.id] || []).length }));
  },
  async toggleReel(kind, id) { const list = S().reels[kind], i = list.indexOf(id); if (i >= 0) list.splice(i, 1); else list.push(id); store.save(); return i < 0; },
  async hideReel(id, hide = true) { const h = S().reels.hidden; if (hide) h.push(id); else h.splice(h.indexOf(id), 1); store.save(); },
  async postReel(data) { const p = { id: 'p' + Date.now(), likes: 0, comments: 0, ago: 0, ...data }; S().reels.posts.unshift(p); store.save(); return p; },
  async comments(id) { return S().reels.comments[id] || []; },
  async addComment(id, text) { const c = S().reels.comments; (c[id] = c[id] || []).push({ text, at: Date.now(), by: myHandle() }); store.save(); },

  async challenge() {
    const s = S(), ws = startOfWeek(today0()), set = activeDaySet(), tk = todayISO();
    const week = Array.from({ length: 7 }, (_, i) => { const d = addDays(ws, i), k = iso(d); return { d, k, on: set.has(k), today: k === tk, future: k > tk }; });
    const weekXp = s.challenges.done.filter(c => c.date >= iso(ws)).reduce((a, c) => a + c.xp, 0)
      + s.games.filter(g => g.date >= iso(ws) && g.date <= tk).length * 15;
    return { today: todaysChallenge(), done: doneToday(), streak: currentStreak(), total: s.challenges.done.length, weekXp, week, goal: 5, active: week.filter(w => w.on).length };
  },
  async completeChallenge() { return completeToday(); },
  async swapChallenge(id) { if (doneToday()) return; S().challenges.swaps[todayISO()] = id; store.save(); },

  async stats(range) {
    const t = today0(), tk = iso(t), s = S();
    const past = s.games.filter(g => g.date <= tk).sort((a, b) => a.date.localeCompare(b.date));
    let buckets, title, label;
    if (range === 'week') {
      const ws = startOfWeek(t);
      buckets = Array.from({ length: 7 }, (_, i) => { const d = addDays(ws, i); return { from: iso(d), to: iso(d), label: 'MTWTFSS'[i] }; });
      title = 'Your week in motion'; label = `${fmtShort(ws)} – ${fmtShort(addDays(ws, 6))}`;
    } else if (range === 'month' || range === 'season') {
      const n = range === 'month' ? 5 : 12, ws = startOfWeek(t);
      buckets = Array.from({ length: n }, (_, i) => { const d = addDays(ws, (i - n + 1) * 7); return { from: iso(d), to: iso(addDays(d, 6)), label: range === 'month' ? fmtShort(d) : `${d.getMonth() + 1}/${d.getDate()}` }; });
      title = range === 'month' ? 'Your month in motion' : 'Your season in motion'; label = `Last ${n} weeks, by week`;
    } else {
      buckets = Array.from({ length: 7 }, (_, i) => { const d = new Date(t.getFullYear(), t.getMonth() - 6 + i, 1), e = new Date(d.getFullYear(), d.getMonth() + 1, 0); return { from: iso(d), to: iso(e), label: d.toLocaleDateString('en-US', { month: 'short' }) }; });
      title = 'Your full story'; label = 'Last 7 months, by month';
    }
    const from = range === 'all' ? '0000' : buckets[0].from;
    const inRange = past.filter(g => g.date >= from);
    buckets.forEach(b => { b.value = inRange.filter(g => g.date >= b.from && g.date <= b.to).length; b.now = tk >= b.from && tk <= b.to; });
    const set = activeDaySet();
    const activeDays = [...set].filter(k => k >= from && k <= tk).length;
    const counts = {}; inRange.forEach(g => { counts[g.sport] = (counts[g.sport] || 0) + 1; });
    const bySport = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, n, pct: Math.round(n / inRange.length * 100) }));
    return { title, label, buckets, games: inRange.length, met: inRange.reduce((a, g) => a + (g.met || 0), 0), activeDays, streak: currentStreak(), bySport, badges: badges(past) };
  },
  async reset() { store.reset(); },
};

function badges(past) {
  const s = S(), out = [];
  const fmt = k => 'Earned ' + fmtShort(parseISO(k));
  out.push({ name: 'First Game', icon: ICON.medal, earned: past[0] ? fmt(past[0].date) : null, todo: 'Log your first game' });
  // first time a 3-day run of active days happened
  const days = [...activeDaySet()].sort(); let run = 0, prev = null, three = null;
  for (const k of days) { run = prev && dayNum(parseISO(k)) - dayNum(parseISO(prev)) === 1 ? run + 1 : 1; prev = k; if (run >= 3) { three = k; break; } }
  out.push({ name: 'Three-Day Streak', icon: ICON.challenge, earned: three ? fmt(three) : null, todo: 'Be active 3 days in a row' });
  let met = 0, tenAt = null; for (const g of past) { met += g.met || 0; if (met >= 10) { tenAt = g.date; break; } }
  out.push({ name: 'Met 10 Players', icon: ICON.user, earned: tenAt ? fmt(tenAt) : null, todo: `Meet ${10 - met} more` });
  const seen = new Set(); let fiveAt = null; for (const g of past) { seen.add(g.sport); if (seen.size >= 5) { fiveAt = g.date; break; } }
  out.push({ name: 'Multi-Sport Player', icon: ICON.spark, earned: fiveAt ? fmt(fiveAt) : null, todo: `Play ${plural(5 - seen.size, 'more sport')}` });
  const dates = new Set(past.map(g => g.date)); let ww = null;
  for (const g of past) { const d = parseISO(g.date); if (d.getDay() === 6 && dates.has(iso(addDays(d, 1)))) { ww = iso(addDays(d, 1)); break; } }
  out.push({ name: 'Weekend Warrior', icon: ICON.calendar, earned: ww ? fmt(ww) : null, todo: 'Play Saturday and Sunday' });
  const m = s.matches.length;
  out.push({ name: 'Community Builder', icon: ICON.messages, earned: m >= 5 ? 'Earned' : null, todo: `Match with ${plural(5 - m, 'more player')}` });
  return out;
}

function replyFor(text, p) {
  const t = text.toLowerCase(), court = place(p.court).name;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  if (/put us down|added a game/.test(t)) return pick(['Perfect, it’s on my calendar too.', 'Locked in. See you there!']);
  if (/\b(mon|tue|wed|thu|fri|sat|sun)|tomorrow|tonight|\d/.test(t)) return pick([`That works for me. ${court}?`, 'Works for me. I’ll bring a ball.']);
  if (t.includes('?')) return pick([`Yes! I’m usually free ${SLOTS[p.avail[0]].toLowerCase()}.`, 'Definitely. What day works for you?']);
  if (/thank|good game|gg|fun/.test(t)) return 'Anytime. That was a fun one.';
  return pick(['Sounds good!', 'Love it. Let’s make it happen.', `Nice. I’m at ${court} most ${SLOTS[p.avail[0]].toLowerCase()}.`]);
}

/* =====================================================================
   4. Illustrations
   ===================================================================== */
const ART = {
  pickleball: ['#2B7BA0', '#2C5C4B'], tennis: ['#3A6CA4', '#4E8848'], basketball: ['#C88A4D', '#9A6232'], volleyball: ['#D7B474', '#C49855'],
  soccer: ['#3E8D4A', '#357C40'], spikeball: ['#4B8F45', '#3F7D3B'], badminton: ['#2C7F72', '#22635A'], kickball: ['#4A8B44', '#3F7D3B'],
};
function courtSVG(sp) {
  const [c, sur] = ART[sp] || ART.pickleball;
  const L = 'stroke="rgba(255,255,255,.82)" stroke-width="3" fill="none"';
  const net = (x1, x2) => `<path d="M${x1} 200H${x2}" stroke="rgba(8,18,24,.55)" stroke-width="6"/>`;
  let g = '';
  switch (sp) {
    case 'tennis': g = `<rect x="45" y="30" width="210" height="340" fill="${c}"/><g ${L}><rect x="45" y="30" width="210" height="340"/><path d="M71 30V370M229 30V370M71 108H229M71 292H229M150 108V292"/></g>${net(35, 265)}`; break;
    case 'basketball': g = `<rect width="300" height="400" fill="${c}"/><g stroke="rgba(0,0,0,.09)" stroke-width="2">${Array.from({ length: 15 }, (_, i) => `<path d="M${i * 20 + 10} 0V400"/>`).join('')}</g><g ${L}><rect x="30" y="30" width="240" height="340"/><path d="M30 200H270"/><circle cx="150" cy="200" r="36"/><rect x="110" y="30" width="80" height="95"/><rect x="110" y="275" width="80" height="95"/><circle cx="150" cy="125" r="30"/><circle cx="150" cy="275" r="30"/><path d="M48 30V62A102 102 0 0 0 252 62V30M48 370V338A102 102 0 0 1 252 338V370"/></g>`; break;
    case 'volleyball': g = `<rect width="300" height="400" fill="${c}"/><g fill="rgba(120,80,30,.12)">${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 73) % 300}" cy="${(i * 131) % 400}" r="${2 + i % 3}"/>`).join('')}</g><g ${L}><rect x="60" y="40" width="180" height="320"/><path d="M60 147H240M60 253H240"/></g>${net(48, 252)}`; break;
    case 'soccer': g = `${Array.from({ length: 8 }, (_, i) => `<rect y="${i * 50}" width="300" height="50" fill="${i % 2 ? sur : c}"/>`).join('')}<g ${L}><rect x="30" y="30" width="240" height="340"/><path d="M30 200H270"/><circle cx="150" cy="200" r="40"/><rect x="85" y="30" width="130" height="65"/><rect x="85" y="305" width="130" height="65"/><rect x="120" y="30" width="60" height="24"/><rect x="120" y="346" width="60" height="24"/></g>`; break;
    case 'spikeball': g = `<rect width="300" height="400" fill="${c}"/><circle cx="150" cy="200" r="95" stroke="rgba(255,255,255,.7)" stroke-width="3" stroke-dasharray="7 9" fill="none"/><circle cx="150" cy="200" r="36" fill="#F2D33D" stroke="#1f1f1f" stroke-width="5"/><circle cx="150" cy="200" r="24" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>`; break;
    case 'badminton': g = `<rect x="70" y="30" width="160" height="340" fill="${c}"/><g ${L}><rect x="70" y="30" width="160" height="340"/><path d="M82 30V370M218 30V370M70 150H230M70 250H230M70 50H230M70 350H230M150 30V150M150 250V370"/></g>${net(60, 240)}`; break;
    case 'kickball': g = `<rect width="300" height="400" fill="${c}"/><path d="M150 340 265 225 150 110 35 225Z" fill="#B8693F"/><g ${L}><path d="M150 340 265 225 150 110 35 225Z"/><circle cx="150" cy="225" r="16"/></g><g fill="#fff"><rect x="143" y="333" width="14" height="14"/><rect x="258" y="218" width="14" height="14"/><rect x="143" y="103" width="14" height="14"/><rect x="28" y="218" width="14" height="14"/></g>`; break;
    default: g = `<rect x="60" y="40" width="180" height="320" fill="${c}"/><g ${L}><rect x="60" y="40" width="180" height="320"/><path d="M60 149H240M60 251H240M150 40V149M150 251V360"/></g>${net(48, 252)}`;
  }
  return `<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="300" height="400" fill="${sur}"/>${g}</svg>`;
}
const ballSVG = `<svg class="ball-art" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="var(--ball)"/>${[[60,22],[34,38],[86,38],[24,64],[60,52],[96,64],[40,86],[80,86],[60,98],[60,76]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6" fill="var(--ball-ink)" fill-opacity=".22"/>`).join('')}</svg>`;
const brandSVG = `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="var(--ball)"/><path d="M5 9c7 3 9 11 4 19M27 9c-7 3-9 11-4 19" fill="none" stroke="var(--ball-ink)" stroke-opacity=".5" stroke-width="2"/></svg>`;

/* =====================================================================
   5. UI state + navigation
   ===================================================================== */
const ROUTES = [
  ['home', 'Home', ICON.home], ['play', 'Play', ICON.play], ['messages', 'Messages', ICON.messages], ['courts', 'Courts', ICON.courts],
  ['calendar', 'Calendar', ICON.calendar], ['reels', 'Reels', ICON.reels], ['challenge', 'Challenge', ICON.challenge], ['stats', 'Stats', ICON.stats],
];
const MORE = ['courts', 'reels', 'challenge', 'stats'];
const ui = { route: 'home', conv: null, chatOpen: false, calMonth: null, selDate: todayISO(), openPlace: null, focus: null, swiping: false, typing: {}, resetArmed: false };
const view = r => $('#v-' + r);
const isWide = () => window.matchMedia('(min-width: 821px)').matches;
const saveUI = (k, v) => { S().ui[k] = v; store.save(); };

function buildNav() {
  $('#brandMark').innerHTML = brandSVG; $('#brandMark2').innerHTML = brandSVG;
  $('#sideNav').innerHTML = ROUTES.map(([r, label, ic]) => `<button class="nav-link" data-route="${r}">${ic}<span>${label}</span>${r === 'messages' ? '<span class="count" data-unread hidden></span>' : ''}</button>`).join('');
  $('#bottomNav').innerHTML = ['home', 'play', 'messages', 'calendar'].map(r => { const [, label, ic] = ROUTES.find(x => x[0] === r); return `<button data-route="${r}">${ic}<span>${label}</span>${r === 'messages' ? '<span class="count" data-unread hidden></span>' : ''}</button>`; }).join('') + `<button data-action="more" data-more>${ICON.more}<span>More</span></button>`;
  renderMe();
}
function renderMe() {
  const p = S().profile, name = p.name || 'Your profile';
  $('#sideMe').innerHTML = `${photoAvatar(p.photo, p.name, 36)}<span class="t"><b>${esc(name)}</b><small>${esc(Object.keys(p.sports).map(id => sport(id).name).join(', ') || 'Add your sports')}</small></span>`;
  $('#topMe').innerHTML = photoAvatar(p.photo, p.name, 34);
}
function updateBadges() {
  const n = S().conversations.reduce((a, c) => a + (c.unread || 0), 0);
  $$('[data-unread]').forEach(b => { b.hidden = !n; b.textContent = n; });
}
function go(route) {
  if (!ROUTES.some(r => r[0] === route)) route = 'home';
  ui.route = route;
  $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === route));
  $$('.nav-link[data-route], .bottom-nav [data-route]').forEach(b => b.classList.toggle('active', b.dataset.route === route));
  const more = $('[data-more]'); if (more) more.classList.toggle('active', MORE.includes(route));
  try { if (location.hash.slice(1) !== route) history.replaceState(null, '', '#' + route); } catch (e) { /* hash sync is optional */ }
  closeSheet();
  render();
  window.scrollTo({ top: 0 });
}
async function render() {
  try { await V[ui.route](); } catch (err) { console.error(err); view(ui.route).innerHTML = `<div class="card empty"><h3>Something went wrong loading this screen.</h3><p class="muted">${esc(err.message)}</p><button class="btn" data-route="home">Go home</button></div>`; }
  updateBadges();
}

/* =====================================================================
   6. Views
   ===================================================================== */
const V = {};
const chipRow = (action, current, items) => `<div class="chips" role="group">${items.map(([id, label]) => `<button class="chip ${current === id ? 'active' : ''}" data-action="${action}" data-id="${id}" aria-pressed="${current === id}">${label}</button>`).join('')}</div>`;
const sportChips = (action, current, ids = SPORTS.map(s => s.id)) => chipRow(action, current, [['all', 'All sports'], ...ids.map(id => [id, `${sport(id).icon} ${sport(id).name}`])]);

/* ---- Home ---- */
V.home = async () => {
  const [me, deck, upcoming, ch, convs] = await Promise.all([api.profile(), api.deck('all'), api.games({ from: todayISO() }), api.challenge(), api.conversations()]);
  const next = upcoming[0], hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const unread = convs.filter(c => c.unread);
  view('home').innerHTML = `
    <header class="page-head">
      <div><p class="eyebrow">${esc(fmtLong(today0()))} · Provo, UT</p>
        <h1>${greet}${me.name ? ', ' + esc(me.name.split(' ')[0]) : ''}</h1>
        <p class="sub">${ch.streak ? `You’re on a ${ch.streak}-day streak. ` : 'Play or finish a challenge today to start a streak. '}${plural(deck.length, 'player')} nearby ${deck.length === 1 ? 'is' : 'are'} waiting in your deck.</p></div>
      <button class="btn" data-action="add-game">${ICON.plus} Plan a game</button>
    </header>
    <div class="home-top">
      ${next ? nextGameCard(next) : `<article class="card empty"><h3>No games on the calendar</h3><p class="muted">Pick a court and a time, then invite one of your matches.</p><button class="btn" data-action="add-game">Plan a game</button></article>`}
      <article class="card chal-mini">
        <div class="between"><p class="eyebrow" style="margin:0">Today’s challenge</p><span class="pill ball">+${ch.today.xp} XP</span></div>
        <h3>${esc(ch.today.title)}</h3>
        <p class="muted">${esc(ch.today.body)}</p>
        <div class="row">${ch.done ? `<span class="pill good">${ICON.check.replace('<svg', '<svg width="14" height="14"')} Done today</span>` : `<button class="btn sm" data-action="complete-challenge">Mark complete</button>`}<button class="link" data-route="challenge">See your week</button></div>
      </article>
    </div>
    ${unread.length ? `<section class="sec"><div class="sec-head"><h2>New messages</h2><button class="link" data-route="messages">Open inbox</button></div><div class="card" style="padding-block:6px">${unread.map(c => { const p = person(c.with); return `<button class="unread-row" data-action="open-conv" data-id="${c.id}">${avatar(p.name, 40)}<span class="grow"><strong>${esc(p.name)}</strong><span class="last">${esc(lastMsg(c).text)}</span></span><span class="pill clay">${c.unread} new</span></button>`; }).join('')}</div></section>` : ''}
    <section class="sec">
      <div class="sec-head"><h2>Top matches</h2><button class="link" data-route="play">See everyone</button></div>
      ${deck.length ? `<div class="mini-row">${deck.slice(0, 5).map(miniCard).join('')}</div>` : `<div class="card empty"><h3>You’ve seen everyone nearby</h3><p class="muted">Try another sport or check back soon.</p></div>`}
    </section>
    <section class="sec">
      <div class="sec-head"><h2>Find players by sport</h2></div>
      <div class="sport-grid">${SPORTS.map(sp => `<button class="sport-tile" data-action="pick-sport" data-id="${sp.id}"><span class="ic">${sp.icon}</span><b>${sp.name}</b><small>${sp.community} players in Provo</small>${me.sports[sp.id] ? `<span class="pill">${esc(me.sports[sp.id])}</span>` : ''}</button>`).join('')}</div>
    </section>`;
};
function nextGameCard(g) {
  const p = g.with[0] ? person(g.with[0]) : null;
  return `<article class="next"><div class="art">${courtSVG(g.sport)}</div><div class="shade"></div>
    <p class="eyebrow">Next game · ${relDay(g.date)}</p>
    <h3>${esc(sport(g.sport).name)} at ${esc(place(g.place).name)}</h3>
    <p>${fmtDay(g.date)} · ${fmtTime(g.time)}${p ? ' · with ' + esc(p.name) : ''}${g.note ? ' · ' + esc(g.note) : ''}</p>
    <div class="row"><button class="btn ball sm" data-route="calendar">Open calendar</button>${p ? `<button class="btn glass sm" data-action="open-conv-with" data-id="${p.id}">Message ${esc(p.name.split(' ')[0])}</button>` : ''}</div></article>`;
}
function miniCard(p) {
  const [sp, lvl] = p.sports[0];
  return `<button class="mini" data-action="play-person" data-id="${p.id}"><div class="art">${courtSVG(sp)}</div><div class="shade"></div>
    <span class="pill ball">${p.score}% match</span>${photoAvatar(p.photo, p.name, 44)}
    <strong>${esc(p.name)}</strong><small>${sport(sp).name} · ${lvl}</small></button>`;
}

/* ---- Play ---- */
V.play = async () => {
  const sf = S().ui.playSport;
  let deck, matches, pending;
  try { [deck, matches, pending] = await Promise.all([api.deck(sf), api.matches(), api.likesSent()]); }
  catch (error) {
    view('play').innerHTML = `<header class="page-head"><div><p class="eyebrow">Find your people</p><h1>Play</h1></div></header><div class="card empty" role="alert"><h3>Matching could not load</h3><p class="muted">${esc(error.message || 'Check your connection and try again.')}</p><button class="btn sm" data-action="retry-play">Try again</button></div>`;
    return;
  }
  if (ui.focus) { const i = deck.findIndex(p => p.id === ui.focus); if (i > 0) deck.unshift(...deck.splice(i, 1)); ui.focus = null; }
  view('play').innerHTML = `
    <header class="page-head"><div><p class="eyebrow">Find your people</p><h1>Play</h1>
      <p class="sub">Drag a card right to like or left to pass. When you both like each other, you’ll see a mutual match.</p></div></header>
    ${sportChips('play-filter', sf)}
    <div class="play-layout block">
      <div>
        <div class="deck" id="deck">${deck.length ? deck.slice(0, 2).reverse().map((p, i, a) => playerCard(p, i === a.length - 1)).join('') : `<div class="empty"><h3>That’s everyone${sf !== 'all' ? ' for ' + esc(sport(sf).name.toLowerCase()) : ''} for now</h3><p class="muted">New players join every week. You can also give passed players another look.</p><div class="row" style="justify-content:center"><button class="btn sm" data-action="reset-passes">Review passed players</button>${sf !== 'all' ? `<button class="btn ghost sm" data-action="play-filter" data-id="all">All sports</button>` : ''}</div></div>`}</div>
        ${deck.length ? `<div class="deck-actions"><button class="round" data-action="swipe" data-dir="pass" aria-label="Pass on ${esc(deck[0].name)}">${ICON.x}</button><button class="round like" data-action="swipe" data-dir="like" aria-label="Like ${esc(deck[0].name)}">${ICON.heart}</button></div>
        <p class="hint">${plural(deck.length, 'player')} left · Arrow keys work too</p>` : ''}
      </div>
      <aside class="stack">
        <div class="card"><h3>Your matches</h3>
          ${matches.length ? matches.map(p => `<div class="list-row">${photoAvatar(p.photo, p.name, 36)}<div class="grow"><strong>${esc(p.name)}</strong><small class="muted">${p.sports.map(([s]) => sport(s).name).join(' · ')}</small></div>${hasLiveAccount() ? '<span class="pill good">Matched</span>' : `<button class="btn ghost sm" data-action="open-conv-with" data-id="${p.id}">Message</button>`}</div>`).join('') : '<p class="muted small" style="margin-top:6px">Mutual likes show up here.</p>'}
        </div>
        <div class="card"><h3>Likes sent</h3>
          <p class="muted small" style="margin:4px 0 10px">If they like you back, they’ll appear in Your matches.</p>
          ${pending.length ? `<div class="avatars">${pending.map(p => photoAvatar(p.photo, p.name, 36)).join('')}</div>` : '<p class="muted small">None waiting.</p>'}
        </div>
      </aside>
    </div>`;
  const top = $('#deck .pcard:not(.back)'); if (top) bindDrag(top);
};
function playerCard(p, isTop) {
  return `<article class="pcard ${isTop ? '' : 'back'}" data-id="${p.id}" aria-label="${esc(p.name)}">
    <div class="art">${courtSVG(p.sports[0][0])}</div><div class="shade"></div>
    <span class="pill ball compat">${p.score}% match</span>
    <span class="stamp like">LIKE</span><span class="stamp pass">PASS</span>
    <div class="pcard-body">
      <div class="who">${photoAvatar(p.photo, p.name, 56)}<div class="min0"><h2>${esc(p.name)}</h2></div></div>
      <p>${esc(p.bio)}</p>
      <div class="tags">${p.sports.map(([s, l]) => `<span class="tag">${sport(s).icon} ${sport(s).name} · ${l}</span>`).join('')}</div>
      <div class="tags">${p.avail.map(a => `<span class="tag soft">${esc(a)}</span>`).join('')}</div>
      <div class="reason">${ICON.spark.replace('<svg', '<svg width="16" height="16" style="flex:none;margin-top:1px"')}<span>${esc(p.reason)}</span></div>
    </div></article>`;
}
function bindDrag(card) {
  let x0 = 0, y0 = 0, dx = 0, dragging = false;
  card.addEventListener('pointerdown', e => { if (e.button > 0) return; dragging = true; x0 = e.clientX; y0 = e.clientY; dx = 0; card.setPointerCapture(e.pointerId); card.classList.add('dragging'); });
  card.addEventListener('pointermove', e => {
    if (!dragging) return; dx = e.clientX - x0; const dy = (e.clientY - y0) * .2;
    card.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 18}deg)`;
    card.style.setProperty('--like', Math.max(0, Math.min(1, dx / 100))); card.style.setProperty('--pass', Math.max(0, Math.min(1, -dx / 100)));
  });
  const end = () => {
    if (!dragging) return; dragging = false; card.classList.remove('dragging');
    if (Math.abs(dx) > 100) doSwipe(dx > 0 ? 'like' : 'pass');
    else { card.style.transform = ''; card.style.setProperty('--like', 0); card.style.setProperty('--pass', 0); }
  };
  card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
}
async function doSwipe(dir) {
  const card = $('#deck .pcard:not(.back)'); if (!card || ui.swiping) return;
  ui.swiping = true;
  const id = card.dataset.id, p = person(id);
  card.style.setProperty(dir === 'like' ? '--like' : '--pass', 1);
  card.style.transform = `translate(${dir === 'like' ? 520 : -520}px,40px) rotate(${dir === 'like' ? 24 : -24}deg)`; card.style.opacity = '0';
  let res;
  try { res = await api.swipe(id, dir); }
  catch (error) {
    ui.swiping = false; card.style.transform = ''; card.style.opacity = ''; card.style.setProperty('--like', 0); card.style.setProperty('--pass', 0);
    toast(error.message || 'Your choice could not be saved. Please try again.');
    return;
  }
  setTimeout(async () => {
    ui.swiping = false; await render();
    if (res.matched) openMatch(p, res.conv);
    else if (dir === 'like') toast(`Like sent to ${p.name.split(' ')[0]}. You’ll hear if it’s mutual.`);
    else toast(`Passed on ${p.name.split(' ')[0]}`, { label: 'Undo', run: async () => { await api.undoSwipe(id); ui.focus = id; render(); } });
  }, 260);
}
function openMatch(p, conv) {
  openModal(`<div class="match-card"><p class="eyebrow">Mutual like</p><h2>It’s a match</h2>
    <div class="match-avs">${photoAvatar(S().profile.photo, S().profile.name, 76)}${photoAvatar(p.photo, p.name, 76)}</div>
    <p class="muted">You and ${esc(p.name.split(' ')[0])} both want to play.${conv ? ` ${esc(p.name.split(' ')[0])} already sent you a message.` : ''}</p>
    <div class="row" style="justify-content:center">${conv ? `<button class="btn" data-action="open-conv" data-id="${conv.id}">Reply now</button>` : ''}<button class="btn ghost" data-action="close">Keep browsing</button></div></div>`);
}

/* ---- Messages ---- */
V.messages = async () => {
  const convs = await api.conversations();
  if (!ui.conv || !convs.some(c => c.id === ui.conv)) ui.conv = convs[0] ? convs[0].id : null;
  view('messages').innerHTML = `
    <header class="page-head"><div><p class="eyebrow">${plural(convs.length, 'match', 'matches')}</p><h1>Messages</h1></div>
      <button class="btn ghost" data-route="play">Find more players</button></header>
    <div class="msg-layout ${ui.chatOpen ? 'chat-open' : ''}" id="msgLayout">
      <aside class="conv-list" id="convList" aria-label="Conversations"></aside>
      <section class="chat" id="chat" aria-label="Conversation"></section>
    </div>`;
  await renderConvList(convs);
  await renderChat();
};
async function renderConvList(convs) {
  convs = convs || await api.conversations();
  $('#convList').innerHTML = convs.length ? convs.map(c => {
    const p = person(c.with), m = lastMsg(c);
    return `<button class="conv ${c.id === ui.conv ? 'active' : ''} ${c.unread ? 'unread' : ''}" data-action="open-conv" data-id="${c.id}">${avatar(p.name, 44)}<span class="min0"><strong>${esc(p.name)}</strong><span class="last">${m.from === 'me' ? 'You: ' : ''}${esc(m.text)}</span></span><span><time>${relTime(m.at)}</time>${c.unread ? '<i class="dot"></i>' : ''}</span></button>`;
  }).join('') : `<div class="empty"><h3>No matches yet</h3><p class="muted">Like a few players in Play. When it’s mutual, the chat shows up here.</p></div>`;
}
async function renderChat() {
  const box = $('#chat'); if (!box) return;
  const c = ui.conv ? await api.conversation(ui.conv) : null;
  if (!c) { box.innerHTML = `<div class="empty"><h3>Pick a conversation</h3></div>`; return; }
  if (isWide() || ui.chatOpen) { await api.markRead(c.id); updateBadges(); }
  const p = person(c.with), me = S().profile, draft = $('#chatInput') ? $('#chatInput').value : '';
  let lastDay = '';
  const bubbles = c.messages.map(m => {
    const k = iso(new Date(m.at)); let sep = '';
    if (k !== lastDay) { lastDay = k; sep = `<div class="day-sep">${relDay(k) === 'Today' || relDay(k) === 'Yesterday' ? relDay(k) : fmtDay(k)}</div>`; }
    return sep + `<div class="bubble ${m.kind === 'game' ? 'game' : m.from}">${esc(m.text)}</div>`;
  }).join('');
  const shared = p.sports.find(([s]) => me.sports[s]);
  const sugg = ['Want to play this week?', me.avail[0] ? `I’m free ${SLOTS[me.avail[0]].toLowerCase()}.` : null, `Meet at ${place(p.court).name}?`].filter(Boolean);
  box.innerHTML = `
    <div class="chat-head">
      <button class="icon-btn back-btn" data-action="conv-back" aria-label="Back to conversations">${ICON.back}</button>
      ${avatar(p.name, 40)}<div class="grow"><strong>${esc(p.name)}</strong><small class="muted">${p.sports.map(([s, l]) => `${sport(s).name} · ${l}`).join(', ')}</small></div>
      <button class="btn ghost sm" data-action="add-game" data-with="${p.id}" data-sport="${shared ? shared[0] : p.sports[0][0]}">${ICON.calendar} Plan a game</button>
    </div>
    <div class="chat-body" id="chatBody">${bubbles}${ui.typing[c.id] ? '<div class="typing" aria-label="Typing"><i></i><i></i><i></i></div>' : ''}</div>
    <div class="suggest">${sugg.map(t => `<button class="chip" data-action="suggest" data-text="${esc(t)}">${esc(t)}</button>`).join('')}<button class="chip" data-action="add-game" data-with="${p.id}">${ICON.calendar.replace('<svg', '<svg width="15" height="15"')} Plan a game</button></div>
    <form class="chat-form" id="chatForm" data-conv="${c.id}"><input id="chatInput" autocomplete="off" maxlength="500" placeholder="Message ${esc(p.name.split(' ')[0])}…" aria-label="Message ${esc(p.name)}"><button class="btn" aria-label="Send">${ICON.send}</button></form>`;
  $('#chatInput').value = draft;
  const body = $('#chatBody'); body.scrollTop = body.scrollHeight;
  renderConvList();
}
async function sendMessage(convId, text) {
  const res = await api.send(convId, text);
  ui.typing[convId] = true;
  await renderChat(); $('#chatInput') && $('#chatInput').focus();
  if (res.done) challengeToast(res.done);
  setTimeout(async () => {
    const viewing = ui.route === 'messages' && ui.conv === convId && (isWide() || ui.chatOpen);
    await api.demoReply(convId, viewing);
    ui.typing[convId] = false;
    if (ui.route === 'messages') await renderChat();
    updateBadges();
    if (!viewing) { const p = person((await api.conversation(convId)).with); toast(`${p.name.split(' ')[0]} replied`, { label: 'Open', run: () => openConv(convId) }); }
  }, 1300 + Math.random() * 900);
}
function openConv(id) { ui.conv = id; ui.chatOpen = true; closeModal(); if (ui.route === 'messages') V.messages(); else go('messages'); }

/* ---- Courts ---- */
V.courts = async () => {
  const sf = S().ui.placeSport, list = await api.places(sf), upcoming = await api.games({ from: todayISO() });
  const used = [...new Set(PLACES.flatMap(p => p.sports))];
  view('courts').innerHTML = `
    <header class="page-head"><div><p class="eyebrow">Around Provo</p><h1>Courts</h1>
      <p class="sub">Where people are playing. Open a spot to see who plays there and plan a game.</p></div></header>
    ${sportChips('place-filter', sf, SPORTS.map(s => s.id).filter(id => used.includes(id)))}
    <div class="places block">${list.map(pl => placeCard(pl, upcoming)).join('') || `<div class="card empty"><h3>No spots for this sport yet</h3></div>`}</div>`;
};
function placeCard(pl, upcoming) {
  const open = ui.openPlace === pl.id;
  const tone = /Busy/.test(pl.busy) ? 'clay' : /Steady/.test(pl.busy) ? 'warn' : 'good';
  const regulars = PEOPLE.filter(p => p.court === pl.id), mine = upcoming.filter(g => g.place === pl.id);
  const matched = S().matches;
  return `<article class="card place">
    <button class="place-row" data-action="toggle-place" data-id="${pl.id}" aria-expanded="${open}">
      <span class="place-ic">${courtSVG(pl.sports[0])}</span>
      <span class="min0"><strong>${esc(pl.name)}</strong><small class="muted">${pl.sports.map(s => sport(s).name).join(' · ')}</small><small class="muted">${pl.setting} · ${pl.count} ${pl.unit} · ${pl.mi} mi</small></span>
      <span class="pill ${tone}">${esc(pl.busy)}</span>
    </button>
    ${open ? `<div class="place-detail">
      <div><p class="eyebrow">Players who play here</p>${regulars.length ? regulars.map(p => `<div class="list-row">${avatar(p.name, 32)}<div class="grow"><strong>${esc(p.name)}</strong><small class="muted">${p.sports.map(([s, l]) => `${sport(s).name} · ${l}`).join(', ')}</small></div>${matched.includes(p.id) ? `<button class="btn ghost sm" data-action="open-conv-with" data-id="${p.id}">Message</button>` : `<button class="btn ghost sm" data-action="play-person" data-id="${p.id}">View</button>`}</div>`).join('') : '<p class="muted small">No regulars listed yet.</p>'}</div>
      <div><p class="eyebrow">Your games here</p>${mine.length ? mine.map(gameRow).join('') : '<p class="muted small">Nothing planned here yet.</p>'}</div>
      <div class="row full"><button class="btn sm" data-action="add-game" data-place="${pl.id}">${ICON.plus} Plan a game here</button><a class="btn ghost sm" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pl.name + ', Provo, UT')}" target="_blank" rel="noopener">Directions</a></div>
    </div>` : ''}
  </article>`;
}

/* ---- Calendar ---- */
V.calendar = async () => {
  const t = today0();
  if (!ui.calMonth) ui.calMonth = new Date(t.getFullYear(), t.getMonth(), 1);
  const m = ui.calMonth, start = addDays(m, -((m.getDay() + 6) % 7));
  const all = await api.games({}), byDate = {};
  all.forEach(g => (byDate[g.date] = byDate[g.date] || []).push(g));
  const tk = todayISO(), sel = ui.selDate, selGames = byDate[sel] || [];
  const upcoming = all.filter(g => g.date >= tk).slice(0, 5);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = addDays(start, i), k = iso(d), gs = byDate[k] || [];
    return `<button class="cal-day ${d.getMonth() !== m.getMonth() ? 'out' : ''} ${k === tk ? 'today' : ''} ${k === sel ? 'sel' : ''}" data-action="cal-day" data-id="${k}" aria-label="${fmtDay(k)}${gs.length ? ', ' + plural(gs.length, 'game') : ''}" aria-pressed="${k === sel}">${d.getDate()}<span class="cal-dots">${gs.slice(0, 3).map(g => `<i style="background:${ART[g.sport][0]}"></i>`).join('')}</span></button>`;
  }).join('');
  view('calendar').innerHTML = `
    <header class="page-head"><div><p class="eyebrow">Your schedule</p><h1>Calendar</h1>
      <p class="sub">Plan games ahead, or log ones you already played so your stats stay honest.</p></div>
      <button class="btn" data-action="add-game" data-date="${sel}">${ICON.plus} Add a game</button></header>
    <div class="cal-layout">
      <div class="card">
        <div class="between"><h2>${m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <div class="row"><button class="btn ghost sm" data-action="cal-today">Today</button><button class="icon-btn" data-action="cal-prev" aria-label="Previous month">${ICON.left}</button><button class="icon-btn" data-action="cal-next" aria-label="Next month">${ICON.right}</button></div></div>
        <div class="cal-grid">${['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => `<span class="cal-dow">${d}</span>`).join('')}${cells}</div>
      </div>
      <div class="stack">
        <div class="card"><div class="between"><div><p class="eyebrow" style="margin-bottom:4px">${relDay(sel)}</p><h3>${fmtLong(parseISO(sel))}</h3></div><button class="icon-btn" data-action="add-game" data-date="${sel}" aria-label="Add a game on this day">${ICON.plus}</button></div>
          <div style="margin-top:8px">${selGames.length ? selGames.map(gameRow).join('') : `<p class="muted small" style="margin-top:8px">${sel < tk ? 'No games logged this day.' : 'Nothing planned. Add a game to fill it in.'}</p>`}</div></div>
        <div class="card"><h3>Coming up</h3><div style="margin-top:4px">${upcoming.length ? upcoming.map(gameRow).join('') : '<p class="muted small" style="margin-top:8px">No upcoming games.</p>'}</div></div>
      </div>
    </div>`;
};
function gameRow(g) {
  const names = g.with.map(id => person(id)).filter(Boolean).map(p => p.name);
  const past = g.date < todayISO();
  return `<div class="game"><div><b>${fmtTime(g.time)}</b><small class="muted">${past ? 'Played' : relDay(g.date)}</small></div>
    <div class="min0"><strong>${sport(g.sport).icon} ${esc(sport(g.sport).name)} at ${esc(place(g.place).name)}</strong><small class="muted">${fmtDay(g.date)} · ${names.length ? 'With ' + esc(names.join(', ')) : 'Open game'}${g.note ? ' · ' + esc(g.note) : ''}</small></div>
    <button class="icon-btn sm" data-action="del-game" data-id="${g.id}" aria-label="Remove this game">${ICON.x}</button></div>`;
}

/* ---- Reels ---- */
V.reels = async () => {
  const u = S().ui, list = await api.reels({ sportId: u.reelSport, tab: u.reelTab });
  const emptyMsg = { 'for-you': ['No reels for this sport yet', 'Be the first to post one.'], following: ['Nothing from people you follow', 'Follow creators from the For you tab to see them here.'], saved: ['No saved reels', 'Tap Save on any reel to keep it here.'] }[u.reelTab];
  view('reels').innerHTML = `
    <header class="page-head"><div><p class="eyebrow">Local sports feed</p><h1>Reels</h1>
      <p class="sub">Tips, pickup games and good energy from around Provo.</p></div>
      <button class="btn" data-action="post-reel">${ICON.plus} Post a reel</button></header>
    <div class="reel-controls">
      ${sportChips('reel-filter', u.reelSport, ['pickleball', 'basketball', 'volleyball', 'soccer', 'tennis', 'spikeball', 'badminton'])}
      <div class="tabs" role="group">${[['for-you', 'For you'], ['following', 'Following'], ['saved', 'Saved']].map(([id, l]) => `<button class="${u.reelTab === id ? 'active' : ''}" data-action="reel-tab" data-id="${id}" aria-pressed="${u.reelTab === id}">${l}</button>`).join('')}</div>
    </div>
    ${list.length ? `<div class="reel-grid">${list.map(reelCard).join('')}</div>` : `<div class="card empty block"><h3>${emptyMsg[0]}</h3><p class="muted">${emptyMsg[1]}</p></div>`}
    <p class="note">${ICON.flag.replace('<svg', '<svg width="16" height="16"')} Keep it local, kind and sports-first. Use the menu on any reel to report it.</p>`;
};
function reelCard(r) {
  return `<article class="reel">
    <div class="reel-media"><div class="art">${courtSVG(r.sport)}</div><div class="shade"></div>
      <span class="glyph" aria-hidden="true">${sport(r.sport).icon}</span>
      <span class="pill reel-type">${esc(r.cat)}</span>
      ${r.mine ? '' : `<button class="reel-menu" data-action="reel-report" data-id="${r.id}" aria-label="Report this reel">${ICON.more}</button>`}
      <div class="reel-cap"><strong>${esc(r.title)}</strong><span>${esc(r.caption)}</span></div></div>
    <div class="reel-meta">${avatar(r.creator, 34)}<div class="min0"><b>${esc(r.creator)}</b><small class="muted">${esc(sport(r.sport).name)} · ${r.ago ? r.ago + 'd ago' : 'Just now'}</small></div>
      ${r.mine ? '<span class="pill" style="margin-left:auto">Yours</span>' : `<button class="follow ${r.following ? 'on' : ''}" data-action="reel-follow" data-id="${esc(r.creator)}" aria-pressed="${r.following}">${r.following ? 'Following' : 'Follow'}</button>`}</div>
    <div class="reel-actions">
      <button class="${r.liked ? 'liked' : ''}" data-action="reel-like" data-id="${r.id}" aria-pressed="${r.liked}" aria-label="Like, ${r.likeCount} likes">${ICON.heart}<span class="tnum">${r.likeCount}</span></button>
      <button data-action="reel-comments" data-id="${r.id}" aria-label="Comments, ${r.commentCount}">${ICON.comment}<span class="tnum">${r.commentCount}</span></button>
      <button class="${r.saved ? 'saved' : ''}" data-action="reel-save" data-id="${r.id}" aria-pressed="${r.saved}">${ICON.bookmark}<span>${r.saved ? 'Saved' : 'Save'}</span></button>
      <button data-action="reel-share" data-id="${r.id}">${ICON.share}<span>Share</span></button>
    </div></article>`;
}

/* ---- Challenge ---- */
V.challenge = async () => {
  const c = await api.challenge(), t = c.today;
  const autoNote = t.auto === 'message' ? 'Completes automatically when you send a message.' : t.auto === 'game' ? 'Completes automatically when you plan a game.' : '';
  view('challenge').innerHTML = `
    <header class="page-head"><div><p class="eyebrow">Keep it moving</p><h1>Daily challenge</h1>
      <p class="sub">One small action for a more active, connected week.</p></div>
      <div class="streak-badge">${ICON.challenge.replace('<svg', '<svg width="26" height="26" style="color:var(--court)"')}<b class="tnum">${c.streak}</b><small>day<br>streak</small></div></header>
    <article class="chal-hero">
      <div class="min0">
        <div class="row"><span class="pill">${esc(t.cat)}</span><span class="pill ball">+${t.xp} XP</span></div>
        <h2>${esc(t.title)}</h2>
        <p>${esc(t.body)}</p>
        <div class="meta"><span>About ${t.min} min</span>${autoNote ? `<span>${autoNote}</span>` : ''}</div>
        <div class="row">${c.done ? `<span class="done">${ICON.check.replace('<svg', '<svg width="18" height="18"')} Done for today</span>` : `<button class="btn" data-action="complete-challenge">Mark complete</button>`}<button class="btn ghost" data-action="share-challenge">${ICON.share} Share</button></div>
      </div>
      ${ballSVG}
    </article>
    <div class="metrics">
      <div class="card metric"><b class="tnum">${c.total}</b><small>challenges completed</small></div>
      <div class="card metric"><b class="tnum">${c.weekXp}</b><small>XP this week (games count 15)</small></div>
      <div class="card metric"><b class="tnum">${Math.min(c.active, c.goal)}/${c.goal}</b><small>active days toward this week’s goal</small></div>
    </div>
    <article class="card block">
      <div class="between"><div><p class="eyebrow" style="margin-bottom:4px">This week</p><h3>${c.active >= c.goal ? 'Weekly goal reached' : `${plural(c.goal - c.active, 'more active day')} to hit your goal`}</h3></div><span class="pill ${c.active >= c.goal ? 'good' : ''}">${c.active} of ${c.goal}</span></div>
      <div class="track"><i style="width:${Math.min(100, c.active / c.goal * 100)}%"></i></div>
      <div class="week">${c.week.map(w => `<div class="wday ${w.on ? 'on' : ''} ${w.today ? 'today' : ''}">${'MTWTFSS'[(w.d.getDay() + 6) % 7]}<span aria-label="${weekdayName(w.d)}: ${w.on ? 'active' : w.future ? 'upcoming' : w.today ? 'today' : 'no activity'}">${w.on ? '✓' : w.today ? '•' : w.future ? '' : '–'}</span></div>`).join('')}</div>
      <p class="muted small" style="margin-top:14px">A day counts as active when you play a game or finish the daily challenge.</p>
    </article>
    <article class="card block">
      <div class="between"><div><p class="eyebrow" style="margin-bottom:4px">A little variety</p><h3>Other ways to show up</h3></div></div>
      <div style="margin-top:8px">${CHALLENGES.filter(x => x.id !== t.id).map(x => `<div class="lib"><span class="xp tnum">+${x.xp}</span><div class="min0"><strong>${esc(x.title)}</strong><small class="muted" style="display:block">${esc(x.body)}</small></div>${c.done ? '' : `<button class="btn ghost sm" data-action="swap-challenge" data-id="${x.id}">Do this instead</button>`}</div>`).join('')}</div>
    </article>`;
};
function challengeToast(rec) { toast(`Challenge complete: +${rec.xp} XP. Streak is ${plural(currentStreak(), 'day')}.`); }

/* ---- Stats ---- */
V.stats = async () => {
  const range = S().ui.statsRange, d = await api.stats(range);
  const max = Math.max(1, ...d.buckets.map(b => b.value));
  const fav = d.bySport[0];
  const earned = d.badges.filter(b => b.earned).length;
  view('stats').innerHTML = `
    <header class="page-head"><div><p class="eyebrow">Your momentum</p><h1>Stats</h1>
      <p class="sub">Participation is progress. Here’s how you’ve been showing up.</p></div>
      <div class="tabs" role="group">${[['week', 'Week'], ['month', 'Month'], ['season', 'Season'], ['all', 'All time']].map(([id, l]) => `<button class="${range === id ? 'active' : ''}" data-action="stats-range" data-id="${id}" aria-pressed="${range === id}">${l}</button>`).join('')}</div></header>
    <div class="tiles">
      <div class="card tile"><small>Current streak</small><b class="tnum">${d.streak}</b><small>${d.streak === 1 ? 'day' : 'days'}</small></div>
      <div class="card tile"><small>Games played</small><b class="tnum">${d.games}</b><small>${esc(range === 'week' ? 'this week' : range === 'all' ? 'all time' : 'in this range')}</small></div>
      <div class="card tile"><small>New players met</small><b class="tnum">${d.met}</b><small>from logged games</small></div>
      <div class="card tile"><small>Active days</small><b class="tnum">${d.activeDays}</b><small>games or challenges</small></div>
    </div>
    <div class="stats-grid">
      <article class="card">
        <div class="between"><div><p class="eyebrow" style="margin-bottom:4px">Activity</p><h3>${d.title}</h3></div><span class="pill">${plural(d.games, 'game')}</span></div>
        <div class="chart" role="img" aria-label="Games per period: ${d.buckets.map(b => b.label + ' ' + b.value).join(', ')}">${d.buckets.map(b => `<div class="bar-col"><span>${b.value || ''}</span><div class="bar-track"><i class="bar ${b.value ? '' : 'zero'} ${b.now ? 'now' : ''}" style="height:${b.value / max * 100}%"></i></div></div>`).join('')}</div>
        <div class="bar-labels">${d.buckets.map(b => `<small>${esc(b.label)}</small>`).join('')}</div>
        <p class="muted small" style="margin-top:10px">Games played · ${esc(d.label)} · yellow bar is the current period</p>
      </article>
      <article class="card">
        <p class="eyebrow" style="margin-bottom:4px">By sport</p><h3>What you’ve been playing</h3>
        <div style="margin-top:8px">${d.bySport.length ? d.bySport.map(s => `<div class="sport-row"><span class="ic">${sport(s.id).icon}</span><div class="between"><strong>${sport(s.id).name}</strong><span class="muted small tnum">${plural(s.n, 'game')} · ${s.pct}%</span></div><div class="meter"><i style="width:${s.pct}%"></i></div></div>`).join('') : '<p class="muted small" style="margin-top:8px">No games in this range yet. Log one from the calendar.</p>'}</div>
      </article>
    </div>
    <div class="highlight">
      <article class="card fav">${fav ? `<span class="ic">${sport(fav.id).icon}</span><div><p class="eyebrow" style="margin-bottom:4px">Favorite sport</p><h3>${sport(fav.id).name}</h3><p class="muted small">${plural(fav.n, 'game')} · ${fav.pct}% of your activity</p></div>` : `<div><p class="eyebrow">Favorite sport</p><p class="muted">Play a few games to find out.</p></div>`}</article>
      <article class="card"><p class="eyebrow" style="margin-bottom:4px">Keep going</p><h3>Showing up beats keeping score.</h3><p class="muted small">You’re building a steady habit and meeting more people along the way.</p></article>
    </div>
    <article class="card block">
      <div class="between"><div><p class="eyebrow" style="margin-bottom:4px">Milestones</p><h3>Little badges, big deal</h3></div><span class="pill">${earned} earned · ${d.badges.length - earned} to go</span></div>
      <div class="badges">${d.badges.map(b => `<div class="badge ${b.earned ? '' : 'locked'}"><span class="medal">${b.icon}</span><strong>${esc(b.name)}</strong><small>${esc(b.earned || b.todo)}</small></div>`).join('')}</div>
    </article>`;
};

/* =====================================================================
   7. Modals, sheet, toast
   ===================================================================== */
function openModal(html) { $('#modalCard').innerHTML = html; $('#modal').hidden = false; const f = $('#modalCard input, #modalCard select, #modalCard textarea, #modalCard button'); if (f) f.focus(); }
function closeModal() { $('#modal').hidden = true; $('#modalCard').innerHTML = ''; }
const modalHead = (eyebrow, title, sub = '') => `<div class="modal-head"><div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2>${sub ? `<p class="muted small" style="margin-top:6px">${sub}</p>` : ''}</div><button class="icon-btn" type="button" data-action="close" aria-label="Close">${ICON.x}</button></div>`;
function openSheet() {
  $('#sheetCard').innerHTML = MORE.map(r => { const [, label, ic] = ROUTES.find(x => x[0] === r); return `<button class="nav-link ${ui.route === r ? 'active' : ''}" data-route="${r}">${ic}<span>${label}</span></button>`; }).join('') + `<button class="nav-link" data-action="open-profile">${ICON.user}<span>Your profile</span></button>`;
  $('#sheet').hidden = false;
}
function closeSheet() { $('#sheet').hidden = true; }
let toastTimer;
function toast(msg, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { t.classList.remove('show'); action.run(); };
  t.classList.add('show'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), action ? 5000 : 2800);
}

const placeOptions = (sp, selected) => { const opts = PLACES.filter(p => p.sports.includes(sp)); return (opts.length ? opts : PLACES).map(p => `<option value="${p.id}" ${p.id === selected ? 'selected' : ''}>${esc(p.name)}</option>`).join(''); };
function openGameModal({ sport: sp, place: pl, date, withId } = {}) {
  const me = S().profile, p0 = withId ? person(withId) : null;
  if (!sp) sp = pl ? place(pl).sports[0] : p0 ? ((p0.sports.find(([s]) => me.sports[s]) || p0.sports[0])[0]) : Object.keys(me.sports)[0] || 'pickleball';
  if (!pl || !place(pl).sports.includes(sp)) { const o = PLACES.filter(x => x.sports.includes(sp)); pl = p0 && o.some(x => x.id === p0.court) ? p0.court : (o[0] || PLACES[0]).id; }
  date = date || iso(addDays(today0(), 1));
  const order = [...Object.keys(me.sports), ...SPORTS.map(s => s.id).filter(id => !me.sports[id])];
  openModal(`${modalHead('Calendar', 'Plan a game', 'Pick a past date to log a game you already played.')}
    <form class="form" id="gameForm">
      <div class="form-grid">
        <div class="field"><label for="g-sport">Sport</label><select id="g-sport">${order.map(id => `<option value="${id}" ${id === sp ? 'selected' : ''}>${sport(id).icon} ${sport(id).name}</option>`).join('')}</select></div>
        <div class="field"><label for="g-place">Where</label><select id="g-place">${placeOptions(sp, pl)}</select></div>
        <div class="field"><label for="g-date">Date</label><input type="date" id="g-date" value="${date}" required></div>
        <div class="field"><label for="g-time">Time</label><input type="time" id="g-time" value="18:00" required></div>
        <div class="field"><label for="g-with">Playing with</label><select id="g-with"><option value="">Open game</option>${S().matches.map(id => `<option value="${id}" ${id === withId ? 'selected' : ''}>${esc(person(id).name)}</option>`).join('')}</select></div>
        <div class="field"><label for="g-met">New people met</label><input type="number" id="g-met" min="0" max="30" value="0" inputmode="numeric"></div>
      </div>
      <div class="field"><label for="g-note">Note</label><input id="g-note" maxlength="80" placeholder="Court number, what to bring, score…"></div>
      <label class="check"><input type="checkbox" id="g-notify" checked> Send the details to the person you’re playing with</label>
      <div class="row"><button class="btn" type="submit">Save game</button><button class="btn ghost" type="button" data-action="close">Cancel</button></div>
    </form>`);
}
/* ---- Profile fields (shared by sign-up setup and the profile modal) ---- */
const BIO_MAX = 300;
const pendingPhoto = {};
function photoField(pre, photo, required) {
  return `<div class="field photo-field"><span class="lbl" id="${pre}-photo-lbl">Profile photo${required ? '' : ' (optional)'}</span>
    <div class="photo-pick">
      <span class="photo-preview" id="${pre}-photo-preview">${photo ? `<img src="${esc(photo)}" alt="Your profile photo">` : `<span aria-hidden="true">${ICON.user}</span>`}</span>
      <div><button class="btn ghost sm" type="button" data-pick-photo="${pre}" aria-describedby="${pre}-photo-lbl">${photo ? 'Change photo' : 'Choose a photo'}</button>
      <input class="sr-only" type="file" id="${pre}-photo" accept="image/*" data-photo="${pre}" tabindex="-1" aria-hidden="true">
      <p class="muted small">A clear photo of your face helps players recognize you at the court.</p></div>
    </div></div>`;
}
const sportLevelFields = (pre, sports) => `<div class="field"><span class="lbl">Sports you play and your level</span><div class="sport-levels">${SPORTS.map(s => `<div class="field"><label for="${pre}-sp-${s.id}" style="font-weight:600">${s.icon} ${s.name}</label><select id="${pre}-sp-${s.id}"><option value="">Not playing</option>${LEVELS.map(l => `<option ${sports[s.id] === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`).join('')}</div></div>`;
const bioField = (pre, bio) => `<div class="field"><label for="${pre}-bio">Bio <span class="muted" style="font-weight:500">(optional)</span></label><textarea id="${pre}-bio" maxlength="${BIO_MAX}" placeholder="What you like to play, how competitive you are, anything players should know.">${esc(bio || '')}</textarea></div>`;
const availFields = (pre, avail) => `<fieldset class="field bare"><legend class="lbl">When you’re usually free</legend><div class="slot-grid">${Object.keys(SLOTS).map(k => `<label class="slot"><input type="checkbox" id="${pre}-av-${k.replace(' ', '-')}" value="${k}" ${avail.includes(k) ? 'checked' : ''}><span>${k}</span></label>`).join('')}</div></fieldset>`;
const readSports = pre => { const o = {}; SPORTS.forEach(s => { const v = $(`#${pre}-sp-${s.id}`).value; if (v) o[s.id] = v; }); return o; };
const readAvail = f => $$('.slot input', f).filter(x => x.checked).map(x => x.value);

/* Shrink a chosen image to a 320px square JPEG so it is small enough to save. */
function loadPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error('Choose an image file (JPG, PNG or HEIC).'));
    if (file.size > 15 * 1024 * 1024) return reject(new Error('That photo is over 15 MB. Choose a smaller one.'));
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const S2 = 320, c = document.createElement('canvas'), side = Math.min(img.naturalWidth, img.naturalHeight);
      c.width = c.height = S2;
      c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, S2, S2);
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as an image.')); };
    img.src = url;
  });
}

/* ---- Profile setup after sign-up ---- */
const needsProfile = user => {
  if (!user || user.demo) return false;
  const p = S().profile;
  return p.ownerId !== user.id || !String(p.name || '').trim() || !p.photo ||
    !Object.keys(p.sports || {}).length || !Array.isArray(p.avail) || !p.avail.length;
};
function showOnboarding(user) {
  const p = S().profile, mine = p.ownerId === user.id;
  pendingPhoto.o = mine ? p.photo || '' : '';
  $('#app').hidden = true;
  const el = $('#onboard'); el.hidden = false;
  document.title = 'Create your profile · Rally Provo';
  el.innerHTML = `<div class="onboard-inner">
    <div class="onboard-top"><div class="brand">${brandSVG}Rally<small>Provo</small></div><button class="link" type="button" data-auth="sign-out">Log out</button></div>
    <p class="eyebrow">Step 2 of 2 · ${esc(user.email || '')}</p>
    <h1>Create your profile</h1>
    <p class="muted onboard-lede">Players see this when they swipe. You can change it any time from your profile.</p>
    <form class="form card onboard-form" id="onboardForm" novalidate>
      ${photoField('o', pendingPhoto.o, true)}
      <div class="field"><label for="o-name">First name</label><input id="o-name" maxlength="40" required autocomplete="given-name" value="${esc(mine ? p.name : '')}" placeholder="What should players call you?"></div>
      ${sportLevelFields('o', mine ? p.sports : {})}
      ${bioField('o', mine ? p.bio : '')}
      ${availFields('o', mine ? p.avail : [])}
      <p class="auth-msg" id="o-msg" role="alert" data-kind="error" hidden></p>
      <button class="btn auth-submit" type="submit">Finish and start playing</button>
    </form></div>`;
  window.scrollTo({ top: 0 });
  $('[data-pick-photo="o"]').focus();
}
function finishOnboarding() {
  $('#onboard').hidden = true; $('#onboard').innerHTML = '';
  $('#app').hidden = false; document.title = 'Rally Provo';
  startApp();
}

async function openProfile() {
  let p;
  try { p = await api.profile(); }
  catch (error) { return toast(error.message || 'Could not load your profile. Please try again.'); }
  ui.resetArmed = false; pendingPhoto.p = p.photo || '';
  openModal(`${modalHead('Your profile', 'How you play', 'Matches and suggestions use your sports, levels and free times.')}
    <form class="form" id="profileForm">
      ${photoField('p', p.photo || '', false)}
      <div class="field"><label for="p-name">First name</label><input id="p-name" maxlength="40" value="${esc(p.name)}" placeholder="What should players call you?" autocomplete="given-name"></div>
      ${sportLevelFields('p', p.sports)}
      ${bioField('p', p.bio)}
      ${availFields('p', p.avail)}
      <p class="auth-msg" id="p-msg" role="alert" data-kind="error" hidden></p>
      <div class="row"><button class="btn" type="submit">Save profile</button><button class="btn ghost" type="button" data-action="close">Cancel</button></div>
      <div style="border-top:1px solid var(--line);padding-top:14px;margin-top:4px"><p class="muted small" style="margin-bottom:10px">Start over with the original sample players, games and messages.</p><button class="btn danger sm" type="button" data-action="reset-demo">Reset all app data</button></div>
      ${window.RallyAuth && window.RallyAuth.user() ? `<div class="auth-account"><p class="muted small">Signed in as <b>${esc(window.RallyAuth.user().email)}</b></p><button class="btn ghost sm" type="button" data-auth="sign-out">Log out</button></div>` : ''}
    </form>`);
}
function openComposer() {
  const me = S().profile;
  openModal(`${modalHead('New reel', 'Post a reel', 'Video uploads arrive with the real backend. For now each post gets a court cover for its sport.')}
    <form class="form" id="reelForm">
      <div class="field"><label for="r-title">Title</label><input id="r-title" maxlength="60" required placeholder="Sunset doubles at Kiwanis"></div>
      <div class="form-grid">
        <div class="field"><label for="r-sport">Sport</label><select id="r-sport">${SPORTS.map(s => `<option value="${s.id}" ${me.sports[s.id] && Object.keys(me.sports)[0] === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}</select></div>
        <div class="field"><label for="r-cat">Type</label><select id="r-cat">${['Tips', 'Pickup games', 'Highlights', 'Beginner friendly', 'Community'].map(c => `<option>${c}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label for="r-caption">Caption</label><textarea id="r-caption" maxlength="140" placeholder="What should people know?"></textarea></div>
      <div class="row"><button class="btn" type="submit">Post</button><button class="btn ghost" type="button" data-action="close">Cancel</button></div>
    </form>`);
}
async function openComments(id) {
  const all = await api.reels({}), r = all.find(x => x.id === id) || REELS.find(x => x.id === id), list = await api.comments(id);
  openModal(`${modalHead('Comments', esc(r.title))}
    <div>${list.length ? list.map(c => `<div class="comment"><div class="row">${avatar(c.by, 28)}<strong class="small">${esc(c.by)}</strong><span class="muted small">${relTime(c.at)}</span></div><p style="margin-top:6px">${esc(c.text)}</p></div>`).join('') : `<p class="muted">${r.comments ? `${plural(r.comments, 'earlier comment')} from the community. Add yours below.` : 'Be the first to comment.'}</p>`}</div>
    <form class="chat-form" id="commentForm" data-id="${id}" style="padding:16px 0 0"><input id="c-text" maxlength="200" placeholder="Add a comment…" aria-label="Comment" required><button class="btn" aria-label="Post comment">${ICON.send}</button></form>`);
}

/* =====================================================================
   8. Events (one delegated listener per event type)
   ===================================================================== */
document.addEventListener('click', async e => {
  if (e.target.id === 'modal') return closeModal();
  if (e.target.id === 'sheet') return closeSheet();
  const r = e.target.closest('[data-route]');
  if (r) { closeModal(); return go(r.dataset.route); }
  const a = e.target.closest('[data-action]'); if (!a) return;
  const id = a.dataset.id, s = S();
  switch (a.dataset.action) {
    case 'close': closeModal(); break;
    case 'more': openSheet(); break;
    case 'open-profile': closeSheet(); await openProfile(); break;
    case 'retry-profile': { const user = window.RallyAuth && window.RallyAuth.user(); if (user) await boot(user); break; }
    case 'reset-demo':
      if (!ui.resetArmed) { ui.resetArmed = true; a.textContent = 'Tap again to erase your changes'; setTimeout(() => { ui.resetArmed = false; if (a.isConnected) a.textContent = 'Reset all app data'; }, 4000); break; }
      { const keep = S().profile; await api.reset(); if (keep.ownerId) { S().profile = keep; store.save(); } } Object.assign(ui, { conv: null, chatOpen: false, calMonth: null, selDate: todayISO(), openPlace: null, typing: {} });
      closeModal(); renderMe(); render(); toast('App data reset to the sample'); break;

    case 'pick-sport': saveUI('playSport', id); go('play'); break;
    case 'play-filter': saveUI('playSport', id); render(); break;
    case 'play-person': saveUI('playSport', 'all'); ui.focus = id; closeModal(); go('play'); break;
    case 'retry-play': render(); break;
    case 'swipe': doSwipe(a.dataset.dir); break;
    case 'reset-passes': try { await api.resetPasses(); render(); } catch (error) { toast(error.message || 'Passed players could not be restored.'); } break;

    case 'open-conv': openConv(id); break;
    case 'open-conv-with': { const c = s.conversations.find(x => x.with === id); if (c) openConv(c.id); break; }
    case 'conv-back': ui.chatOpen = false; V.messages(); break;
    case 'suggest': { const i = $('#chatInput'); if (i) { i.value = a.dataset.text; i.focus(); } break; }

    case 'add-game': openGameModal({ withId: a.dataset.with, place: a.dataset.place, date: a.dataset.date, sport: a.dataset.sport }); break;
    case 'del-game': { const g = await api.removeGame(id); render(); if (g) toast('Game removed', { label: 'Undo', run: async () => { await api.restoreGame(g); render(); } }); break; }
    case 'cal-prev': case 'cal-next': ui.calMonth = new Date(ui.calMonth.getFullYear(), ui.calMonth.getMonth() + (a.dataset.action === 'cal-next' ? 1 : -1), 1); render(); break;
    case 'cal-today': { const t = today0(); ui.calMonth = new Date(t.getFullYear(), t.getMonth(), 1); ui.selDate = iso(t); render(); break; }
    case 'cal-day': { ui.selDate = id; const d = parseISO(id); if (d.getMonth() !== ui.calMonth.getMonth()) ui.calMonth = new Date(d.getFullYear(), d.getMonth(), 1); render(); break; }

    case 'place-filter': saveUI('placeSport', id); ui.openPlace = null; render(); break;
    case 'toggle-place': ui.openPlace = ui.openPlace === id ? null : id; render(); break;

    case 'reel-filter': saveUI('reelSport', id); render(); break;
    case 'reel-tab': saveUI('reelTab', id); render(); break;
    case 'reel-like': await api.toggleReel('liked', id); render(); break;
    case 'reel-save': { const on = await api.toggleReel('saved', id); render(); toast(on ? 'Saved to your reels' : 'Removed from saved'); break; }
    case 'reel-follow': { const on = await api.toggleReel('following', id); render(); toast(on ? `Following ${id}` : `Unfollowed ${id}`); break; }
    case 'reel-comments': openComments(id); break;
    case 'reel-share': {
      const r = (await api.reels({})).find(x => x.id === id), text = `${r.title} by ${r.creator} on Rally Provo`;
      try { await navigator.clipboard.writeText(text); toast('Copied to share'); } catch (err) { toast('Couldn’t copy here. Long-press the title to share it.'); }
      break; }
    case 'reel-report': await api.hideReel(id, true); render(); toast('Reel reported and hidden', { label: 'Undo', run: async () => { await api.hideReel(id, false); render(); } }); break;
    case 'post-reel': openComposer(); break;

    case 'complete-challenge': { const rec = await api.completeChallenge(); render(); if (rec) challengeToast(rec); break; }
    case 'swap-challenge': await api.swapChallenge(id); render(); toast('Today’s challenge swapped'); break;
    case 'share-challenge': {
      const t = todaysChallenge();
      try { await navigator.clipboard.writeText(`Today’s Rally challenge: ${t.title}. Join me?`); toast('Challenge copied to share'); } catch (err) { toast('Couldn’t copy here.'); }
      break; }

    case 'stats-range': saveUI('statsRange', id); render(); break;
  }
});

document.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'chatForm') {
    const i = $('#chatInput'), text = i.value.trim(); if (!text) return;
    i.value = ''; sendMessage(f.dataset.conv, text);
  }
  if (f.id === 'gameForm') {
    const g = { sport: $('#g-sport').value, place: $('#g-place').value, date: $('#g-date').value, time: $('#g-time').value, with: $('#g-with').value ? [$('#g-with').value] : [], met: Math.max(0, Number($('#g-met').value) || 0), note: $('#g-note').value.trim() };
    if (!g.date || !g.time) return toast('Add a date and a time to save the game.');
    const notify = $('#g-notify').checked, res = await api.addGame(g);
    if (res.error) return toast('Could not save the game. Check your connection and try again.');
    closeModal();
    const past = g.date < todayISO();
    if (g.with[0] && notify) {
      const c = S().conversations.find(x => x.with === g.with[0]);
      if (c) { const r = await api.send(c.id, `${past ? 'Logged our game' : 'Added a game'}: ${sport(g.sport).name} on ${fmtDay(g.date)} at ${fmtTime(g.time)}, ${place(g.place).name}.`, 'game'); if (!past) setTimeout(async () => { await api.demoReply(c.id, ui.route === 'messages' && ui.conv === c.id); if (ui.route === 'messages') renderChat(); updateBadges(); }, 1500); if (r.done && !res.done) res.done = r.done; }
    }
    ui.selDate = g.date; const d = parseISO(g.date); ui.calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    render();
    if (res.done) challengeToast(res.done);
    else toast(past ? 'Game logged. Your stats are updated.' : `Added for ${fmtDay(g.date)} at ${fmtTime(g.time)}`, ui.route !== 'calendar' ? { label: 'View', run: () => go('calendar') } : null);
  }
  if (f.id === 'profileForm' || f.id === 'onboardForm') {
    const pre = f.id === 'onboardForm' ? 'o' : 'p', setup = pre === 'o';
    const msg = $(`#${pre}-msg`), fail = (text, el) => { msg.textContent = text; msg.hidden = false; if (el) el.focus(); };
    msg.hidden = true;
    const name = $(`#${pre}-name`).value.trim(), sports = readSports(pre), avail = readAvail(f), bio = $(`#${pre}-bio`).value.trim();
    if (setup && !pendingPhoto.o) return fail('Add a profile photo so players know who they’re meeting.', $('[data-pick-photo="o"]'));
    if (setup && !name) return fail('Add your first name.', $('#o-name'));
    if (!Object.keys(sports).length) return fail('Pick at least one sport and your level in it.', $(`#${pre}-sp-${SPORTS[0].id}`));
    if (!avail.length) return fail('Pick at least one time you’re usually free.', $('.slot input', f));
    const btn = $('button[type="submit"]', f); btn.disabled = true;
    try {
      const user = window.RallyAuth && window.RallyAuth.user();
      await api.saveProfile({ ...S().profile, name, photo: pendingPhoto[pre] || '', bio, sports, avail, ownerId: setup && user ? user.id : S().profile.ownerId });
    } catch (err) { btn.disabled = false; return fail('Your profile could not be saved. ' + (err.message || 'Try again.')); }
    if (setup) { finishOnboarding(); toast('Profile created. Welcome to Rally Provo!'); }
    else { closeModal(); renderMe(); render(); toast('Profile saved. Your matches are updated.'); }
  }
  if (f.id === 'reelForm') {
    await api.postReel({ title: $('#r-title').value.trim(), sport: $('#r-sport').value, cat: $('#r-cat').value, caption: $('#r-caption').value.trim() });
    saveUI('reelTab', 'for-you'); saveUI('reelSport', 'all'); closeModal(); render(); toast('Posted to the Provo feed');
  }
  if (f.id === 'commentForm') {
    const text = $('#c-text').value.trim(); if (!text) return;
    await api.addComment(f.dataset.id, text); openComments(f.dataset.id); render();
  }
});

document.addEventListener('click', e => {
  const b = e.target.closest('[data-pick-photo]'); if (b) $(`#${b.dataset.pickPhoto}-photo`).click();
});
document.addEventListener('change', async e => {
  const pre = e.target.dataset && e.target.dataset.photo;
  if (pre) {
    const msg = $(`#${pre}-msg`);
    try {
      const src = await loadPhoto(e.target.files[0]); pendingPhoto[pre] = src;
      $(`#${pre}-photo-preview`).innerHTML = `<img src="${src}" alt="Your profile photo">`;
      $(`[data-pick-photo="${pre}"]`).textContent = 'Change photo';
      if (msg) msg.hidden = true;
    } catch (err) { if (msg) { msg.textContent = err.message; msg.hidden = false; } }
    e.target.value = '';
    return;
  }
  if (e.target.id === 'g-sport') $('#g-place').innerHTML = placeOptions(e.target.value, $('#g-place').value);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); else closeSheet(); return; }
  if (ui.route !== 'play' || !$('#modal').hidden || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight') doSwipe('like');
  if (e.key === 'ArrowLeft') doSwipe('pass');
});

window.addEventListener('hashchange', () => { const r = location.hash.slice(1); if (r && r !== ui.route) go(r); });
window.matchMedia('(min-width: 821px)').addEventListener('change', () => { if (ui.route === 'messages') V.messages(); });

/* =====================================================================
   9. Boot
   ===================================================================== */
let started = false;
function startApp() {
  if (started) return; started = true;
  buildNav();
  go((location.hash || '').slice(1) || 'home');
  api.syncGames().then(({ error }) => { render(); if (error) toast('Could not reach the database. Showing what is cached.'); });
}
// Nothing renders until auth.js reports a signed-in player, and a new
// player sets up their profile before seeing the app.
async function boot(user) {
  try { await api.profile(); }
  catch (error) {
    const el = $('#onboard');
    $('#app').hidden = true;
    el.hidden = false;
    el.innerHTML = `<div class="onboard-inner"><h1>Could not load your profile</h1><p class="auth-msg" role="alert">${esc(error.message || 'Please try again.')}</p><div class="row"><button class="btn" type="button" data-action="retry-profile">Try again</button><button class="btn ghost" type="button" data-auth="sign-out">Log out</button></div></div>`;
    return;
  }
  if (needsProfile(user)) showOnboarding(user); else startApp();
}
if (window.RallyAuth) window.RallyAuth.whenSignedIn(boot); else startApp();
})();
