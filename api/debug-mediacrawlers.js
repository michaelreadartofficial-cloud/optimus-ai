// Quick probe of mediacrawlers' Instagram API to figure out which endpoint
// paths + param names actually work on the user's subscription.
//
// Open in browser: /api/debug-mediacrawlers?handle=cesare_shapable

const HOST = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com";

export default async function handler(req, res) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return res.json({ error: "No RAPIDAPI_KEY set" });
  const handle = (req.query.handle || "cesare_shapable").replace(/^@/, "").toLowerCase();
  const headers = { "x-rapidapi-host": HOST, "x-rapidapi-key": rapidApiKey };

  const log = {};

  // Step 1: try to resolve username → user_id using several likely paths
  const idPaths = [
    `/username_to_id?username=${encodeURIComponent(handle)}`,
    `/user_id_by_username?username=${encodeURIComponent(handle)}`,
    `/user_id?username=${encodeURIComponent(handle)}`,
    `/get_user_id?username=${encodeURIComponent(handle)}`,
    `/userid?username=${encodeURIComponent(handle)}`,
    `/username?username=${encodeURIComponent(handle)}`,
  ];
  log.id_attempts = [];
  let userId = null;
  for (const p of idPaths) {
    try {
      const r = await fetch(`https://${HOST}${p}`, { headers });
      const t = await r.text();
      const entry = { path: p, status: r.status, preview: t.substring(0, 200) };
      if (r.ok) {
        try {
          const j = JSON.parse(t);
          const id = j?.user_id || j?.data?.user_id || j?.id || j?.data?.id || j?.UserID || j?.data?.id_str;
          if (id) { entry.userId = String(id); userId = String(id); }
        } catch {}
      }
      log.id_attempts.push(entry);
      if (userId) break;
    } catch (e) {
      log.id_attempts.push({ path: p, error: e.message });
    }
  }

  if (!userId) return res.json({ handle, log, note: "Could not resolve handle to user_id. Check all id_attempts entries for the one that succeeded in the actual API console and we'll wire it in." });

  log.userId = userId;

  // Step 2: try profile endpoints
  const profilePaths = [
    `/profile?user_id=${encodeURIComponent(userId)}`,
    `/user_profile?user_id=${encodeURIComponent(userId)}`,
    `/user?user_id=${encodeURIComponent(userId)}`,
    `/get_user_profile?user_id=${encodeURIComponent(userId)}`,
    `/profile?username=${encodeURIComponent(handle)}`,
  ];
  log.profile_attempts = [];
  for (const p of profilePaths) {
    try {
      const r = await fetch(`https://${HOST}${p}`, { headers });
      const t = await r.text();
      let hasBio = false, bioPreview = null, keys = null;
      try {
        const j = JSON.parse(t);
        const u = j?.data || j?.user || j;
        const bio = u?.biography || u?.bio || "";
        hasBio = !!bio;
        bioPreview = bio ? bio.substring(0, 100) : null;
        keys = u && typeof u === "object" ? Object.keys(u).slice(0, 15) : null;
      } catch {}
      log.profile_attempts.push({ path: p, status: r.status, hasBio, bioPreview, keys, preview: t.substring(0, 150) });
    } catch (e) {
      log.profile_attempts.push({ path: p, error: e.message });
    }
  }

  // Step 3: try similar-accounts endpoints
  const simPaths = [
    `/similar_accounts?user_id=${encodeURIComponent(userId)}`,
    `/similar_account_recommendations?user_id=${encodeURIComponent(userId)}`,
    `/user/similar_accounts?user_id=${encodeURIComponent(userId)}`,
    `/similar_accounts_recommendations?user_id=${encodeURIComponent(userId)}`,
    `/similar?user_id=${encodeURIComponent(userId)}`,
    `/user/similar?user_id=${encodeURIComponent(userId)}`,
    `/recommendations?user_id=${encodeURIComponent(userId)}`,
    `/related_profiles?user_id=${encodeURIComponent(userId)}`,
    `/related?user_id=${encodeURIComponent(userId)}`,
    `/suggested?user_id=${encodeURIComponent(userId)}`,
  ];
  log.similar_attempts = [];
  for (const p of simPaths) {
    try {
      const r = await fetch(`https://${HOST}${p}`, { headers });
      const t = await r.text();
      let listLen = 0, topKeys = null, firstUsername = null;
      try {
        const j = JSON.parse(t);
        const l = Array.isArray(j) ? j : (j?.data || j?.users || j?.similar_users || j?.accounts || j?.results || []);
        listLen = Array.isArray(l) ? l.length : 0;
        topKeys = j && typeof j === "object" && !Array.isArray(j) ? Object.keys(j).slice(0, 10) : null;
        if (listLen > 0) firstUsername = (l[0]?.user || l[0])?.username || null;
      } catch {}
      log.similar_attempts.push({ path: p, status: r.status, listLen, topKeys, firstUsername, preview: t.substring(0, 200) });
    } catch (e) {
      log.similar_attempts.push({ path: p, error: e.message });
    }
  }

  return res.json({ handle, log });
}
