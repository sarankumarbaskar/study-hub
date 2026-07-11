# PlayZone - Free Online Games & Quizzes

A modern web app for casual games and quizzes, monetized with Google AdSense.

## Features

- **3 Games**: Snake, 2048, Memory Match
- **5 Quiz Categories**: General Knowledge, Science, Movies, Tech, Sports (50+ questions)
- **Leaderboard**: Local high-score tracking across all games
- **Google AdSense**: Banner, interstitial, and in-feed ad placements
- **Social Sharing**: WhatsApp, Twitter/X, and copy-link sharing
- **SEO Optimized**: Meta tags, structured data, semantic HTML
- **Responsive**: Works on desktop, tablet, and mobile
- **Dark Mode**: Automatic based on system preference

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Google AdSense**

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Google AdSense Setup

1. Sign up at [Google AdSense](https://www.google.com/adsense/)
2. Get your Publisher ID (format: `ca-pub-XXXXXXXXXXXXXXXX`)
3. Create a `.env.local` file:

```
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

4. In AdSense, create ad units and replace the `slot` props in `AdBanner` components with your actual ad slot IDs.

During development, ad placeholders are shown instead of real ads.

## Deployment (Vercel - Free)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import the repository
4. Add environment variable: `NEXT_PUBLIC_ADSENSE_CLIENT_ID`
5. Deploy!

## Earning Strategy

| Traffic Level | RPM | Monthly Estimate |
|--------------|-----|-----------------|
| 10K views    | $3-5 | $30-50         |
| 100K views   | $4-6 | $400-600       |
| 500K views   | $5-8 | $2,500-4,000   |
| 1M views     | $5-8 | $5,000-8,000   |

### Tips to Grow Traffic
- Share quizzes on social media (they're viral by nature)
- Add new games and quiz categories regularly
- Optimize for SEO keywords like "free online games", "trivia quiz"
- Create shareable quiz results that drive friends to the site

## Project Structure

```
src/
  app/
    page.tsx              # Landing page
    layout.tsx            # Root layout with AdSense
    games/
      page.tsx            # Games listing
      snake/page.tsx      # Snake game
      2048/page.tsx       # 2048 game
      memory/page.tsx     # Memory Match game
    quiz/
      page.tsx            # Quiz categories
      [category]/page.tsx # Quiz game
    leaderboard/page.tsx  # Leaderboard
    privacy/page.tsx      # Privacy policy (required for AdSense)
    terms/page.tsx        # Terms of service
    contact/page.tsx      # Contact page
  components/
    Navbar.tsx            # Navigation bar
    Footer.tsx            # Footer
    AdBanner.tsx          # Google AdSense component
    GameCard.tsx          # Game listing card
    ShareButtons.tsx      # Social sharing
  data/
    quizzes.ts            # Quiz questions database
  lib/
    leaderboard.ts        # Local leaderboard utilities
```
