export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, page } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Please provide a search query" });
  }

  // Pagination: `page` is 0-based. Each page runs a different slice of query
  // variations so subsequent pages return genuinely new accounts, not the
  // same core set plus one or two new.
  const pageNum = Math.max(0, parseInt(page) || 0);

  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    return res.status(500).json({
      error: "RapidAPI key not configured. Add RAPIDAPI_KEY in Vercel environment variables."
    });
  }

  try {
    // Search with multiple query variations to widen the pool of creators.
    // RapidAPI's Instagram search returns a limited set per call, so we run
    // MANY related queries in parallel and dedupe.
    //
    // IMPORTANT: for multi-word queries we keep the FULL phrase as primary
    // and never fan out on a single word alone — that pulls in off-topic
    // accounts (e.g. searching "online fitness coach" and getting
    // "toponlineshop" because "online" matched).
    const q = query.trim();
    const words = q.split(/\s+/);

    // Three tiers of query variations. Page 0 runs tier A, page 1 runs tier B,
    // page 2 runs tier C — so "Load more" clicks actually return genuinely new
    // accounts each time instead of the same saturated set.
    const suffixesCore = ["coach", "tips", "daily", "pro", "guru", "reels", "official"];
    const suffixesExtra = ["life", "motivation", "hq", "journey", "academy", "fit", "hub", "world"];
    const prefixesCore = ["the", "real", "best", "top", "daily"];
    const prefixesExtra = ["mr", "ms", "your", "coach", "dr", "official"];
    const niches = ["online", "1on1", "elite", "performance", "premium", "global"];

    const tier = { A: new Set([q]), B: new Set(), C: new Set() };

    if (words.length > 1) {
      const joined = words.join("");
      const lastTwo = words.slice(-2).join("");
      tier.A.add(joined); tier.A.add(lastTwo);
      for (const s of suffixesCore) { tier.A.add(joined + s); tier.A.add(lastTwo + s); }
      for (const p of prefixesCore) { tier.B.add(p + joined); tier.B.add(p + lastTwo); }
      for (const s of suffixesExtra) { tier.B.add(joined + s); tier.B.add(lastTwo + s); }
      for (const p of prefixesExtra) { tier.C.add(p + joined); tier.C.add(p + lastTwo); }
      for (const n of niches) { tier.C.add(n + lastTwo); tier.C.add(lastTwo + n); }
    } else {
      tier.A.add(q);
      for (const s of suffixesCore) tier.A.add(q + s);
      for (const p of prefixesCore) tier.A.add(p + q);
      for (const s of suffixesExtra) tier.B.add(q + s);
      for (const p of prefixesExtra) tier.B.add(p + q);
      tier.B.add(q + "s"); tier.B.add(q + "er");
      for (const n of niches) { tier.C.add(n + q); tier.C.add(q + n); }
      tier.C.add(q + "girl"); tier.C.add(q + "guy");
      tier.C.add(q + "life"); tier.C.add(q + "world");
    }

    // Pick the tier for this page (page 2+ still gets C, just returns less new)
    const tierKey = pageNum === 0 ? "A" : pageNum === 1 ? "B" : "C";
    const searchTermsArr = Array.from(tier[tierKey]);

    const allUsers = [];
    const seenUsernames = new Set();

    // Run searches in parallel for speed
    const searchPromises = searchTermsArr.map(term =>
      fetchInstagramSearch(term, rapidApiKey).catch(() => [])
    );
    const results = await Promise.all(searchPromises);

    for (const users of results) {
      for (const item of users) {
        const user = item.user || item;
        const username = user.username || "";
        if (username && !seenUsernames.has(username)) {
          seenUsernames.add(username);
          allUsers.push(user);
        }
      }
    }

    if (allUsers.length === 0) {
      return res.json({ creators: [] });
    }

    // Format results — proxy the profile image URL so it actually loads.
    // Return ALL deduped users (no slice cap) so the frontend can decide
    // how many to show and can page for more.
    const creators = allUsers.map((user) => {
      const followersText = user.search_social_context || "";
      const followerCount = parseFollowers(followersText);
      const rawPic = user.profile_pic_url || "";
      // Proxy the image through our API to avoid CORS / CDN blocks
      const thumbnail = rawPic
        ? `/api/proxy-image?url=${encodeURIComponent(rawPic)}`
        : "";

      return {
        id: user.pk || user.id || "",
        name: user.full_name || user.username || "",
        username: user.username || "",
        // Only include the actual biography. Do NOT fall back to follower
        // text — the frontend matches against this field for relevance and
        // "773K followers" would pollute results.
        description: user.biography || "",
        thumbnail,
        platform: "Instagram Reels",
        subscribers: followersText || "N/A",
        subscriberCount: followerCount,
        totalViews: "N/A",
        videoCount: 0,
        isVerified: user.is_verified || false,
      };
    });

    // Sort by follower count descending
    creators.sort((a, b) => b.subscriberCount - a.subscriberCount);

    // Tell the client there are more pages available (only tiers A and B have
    // a well-defined "next" tier; after C we've exhausted our variations).
    const hasNextPage = pageNum < 2;
    return res.json({ creators, page: pageNum, hasNextPage });
  } catch (err) {
    console.error("Instagram search error:", err);
    return res.status(500).json({
      error: err.message || "Failed to search Instagram creators",
    });
  }
}

async function fetchInstagramSearch(query, apiKey) {
  try {
    const searchRes = await fetch(
      "https://instagram-scraper-stable-api.p.rapidapi.com/search_ig.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
        body: `search_query=${encodeURIComponent(query)}`,
      }
    );

    const text = await searchRes.text();
    console.log("Instagram API response status:", searchRes.status, "body length:", text.length);

    if (!searchRes.ok) {
      console.error("Instagram API error:", text.substring(0, 300));
      return [];
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Instagram API returned non-JSON:", text.substring(0, 300));
      return [];
    }

    return data.users || [];
  } catch (e) {
    console.error("Instagram fetch failed:", e.message);
    return [];
  }
}

// Parse follower count strings like "3M followers", "336K followers", "1,234 followers"
function parseFollowers(text) {
  if (!text) return 0;
  const match = text.match(/([\d,.]+)\s*(M|K)?\s*followers/i);
  if (!match) return 0;
  let num = parseFloat(match[1].replace(/,/g, ""));
  if (match[2] && match[2].toUpperCase() === "M") num *= 1000000;
  if (match[2] && match[2].toUpperCase() === "K") num *= 1000;
  return Math.round(num);
}
