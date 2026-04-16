# Optimus.AI â Project Context

## WHAT THIS IS
Optimus.AI is a clone of Sandcastles.ai (https://app.sandcastles.ai) â a SaaS for discovering and analyzing viral short-form video content (TikTok, Instagram Reels, YouTube Shorts).

**Live:** https://optimus-ai-five.vercel.app  
**Repo:** https://github.com/michaelreadartofficial-cloud/optimus-ai (branch: main)  
**Deploy:** Vercel auto-deploys on push to main

## TECH STACK
- React 18 + Vite 5 + Tailwind CSS 3
- lucide-react v0.383.0 for icons
- Inter font via Google Fonts
- Vercel serverless functions in /api/
- APIs: YouTube Data API, RapidAPI (Instagram + TikTok scrapers), Anthropic API

## CURRENT STATE (April 2026)
The app has been upgraded with:
- **Real API integration** â Channels search calls /api/search-creators, search-creators-instagram, search-creators-tiktok
- **Videos page** fetches from /api/creator-videos and /api/discover-videos
- **Scripts page** has full AI generation UI using /api/generate-script and /api/generate-hooks
- **localStorage persistence** for watchlist, saved videos, saved scripts
- **Loading states** and error handling throughout
- **Sample/fallback data** when APIs are unavailable

## WHAT STILL NEEDS WORK
1. Ideas page (placeholder)
2. Video detail modal (click a video â see analysis, transcript, hook breakdown)
3. Authentication / user accounts
4. Responsive/mobile design
5. Split App.jsx into separate component files
6. Better error handling for API rate limits
7. Visual polish to match Sandcastles.ai exactly

## ENV VARS (set in Vercel dashboard)
- YOUTUBE_API_KEY
- RAPIDAPI_KEY  
- ANTHROPIC_API_KEY

## DEV COMMANDS
```bash
npm install && npm run dev     # Frontend only (localhost:5173)
npx vercel dev                  # Frontend + API routes
git add -A && git commit -m "msg" && git push origin main  # Deploy
```

## DESIGN REFERENCE
Match https://app.sandcastles.ai â clean white/gray UI, left sidebar nav, 9:16 video grid, toggleable filter sidebar, tab-based page navigation.
