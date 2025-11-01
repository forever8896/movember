# Based Movember 🥸

A Farcaster mini-app that helps participants track their Movember journey through daily mustache photos, compete on leaderboards, and support men's health through crypto donations.

## Overview

Based Movember is built on the Base blockchain and integrates with Farcaster to create an engaging experience for Movember participants. Users can document their 30-day mustache growth journey, share progress with the community, and donate to men's health initiatives through [Endaoment](https://endaoment.org).

## Features

### 🐦 Early Bird Mode (Pre-November)
- Commit to Movember before it starts
- Optional friend tagging
- Early Bird badge for committed participants

### 📸 Daily Progress Tracking (During November)
- Post daily mustache selfies
- Track your 30-day journey
- Share progress to Farcaster
- View your personal gallery calendar

### 🏆 Leaderboard
- See top donors supporting men's health
- Track total community donations
- Monitor donation statistics

### 💙 Crypto Donations
- Donate using Base-native tokens
- Powered by [Endaoment](https://endaoment.org)
- Transparent donation tracking
- Support men's health research

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Blockchain**: Base (Coinbase L2)
- **SDK**: OnchainKit, Farcaster MiniApp SDK
- **Database**: Vercel Postgres
- **Styling**: CSS Modules
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ and npm
- [Farcaster](https://farcaster.xyz/) account
- [Vercel](https://vercel.com/) account (for deployment)
- [Coinbase Developer Platform](https://portal.cdp.coinbase.com/) API Key

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/forever8896/movember.git
cd movember
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your values:

```bash
# Required
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_PROJECT_NAME=Based Movember
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key

# Database (after setting up Vercel Postgres)
POSTGRES_URL=your_postgres_url

# Database initialization secret
INIT_DB_SECRET=your_random_secret
```

Get your OnchainKit API key from the [Coinbase Developer Portal](https://portal.cdp.coinbase.com/).

### 4. Set Up Database

This app uses Vercel Postgres for data storage. You'll need to:

1. Create a Vercel Postgres database in your Vercel project
2. Copy the connection string to your `.env.local`
3. Initialize the database schema:

```bash
# Make sure your INIT_DB_SECRET is set in .env.local
curl http://localhost:3000/api/init-db?secret=your_random_secret
```

Or visit `http://localhost:3000/api/init-db?secret=your_random_secret` in your browser.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment

### Deploy to Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fforever8896%2Fmovember)

1. Click the "Deploy" button above
2. Connect your GitHub account
3. Configure environment variables in Vercel:
   - `NEXT_PUBLIC_URL` - Your production URL
   - `NEXT_PUBLIC_PROJECT_NAME` - Based Movember
   - `NEXT_PUBLIC_ONCHAINKIT_API_KEY` - Your API key
   - `INIT_DB_SECRET` - Random secret for database setup

4. After deployment, set up Vercel Postgres:
   - Go to your project in Vercel dashboard
   - Navigate to Storage → Create Database → Postgres
   - Database environment variables are automatically added

5. Initialize the database:
   - Visit `https://your-app.vercel.app/api/init-db?secret=your_secret`

### Configure Farcaster Manifest

Update `minikit.config.ts` with your production URL and account association:

1. Go to [Farcaster Manifest Tool](https://farcaster.xyz/~/developers/mini-apps/manifest)
2. Enter your domain (e.g., `your-app.vercel.app`)
3. Generate account association by signing with your Farcaster wallet
4. Copy the `accountAssociation` object to `minikit.config.ts`

## Project Structure

```
movember/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication
│   │   ├── donate/        # Donation endpoints
│   │   ├── init-db/       # Database initialization
│   │   ├── leaderboard/   # Leaderboard data
│   │   └── progress/      # User progress tracking
│   ├── donate/            # Donation page
│   ├── gallery/           # User progress gallery
│   ├── journey/           # Public journey pages
│   ├── leaderboard/       # Leaderboard page
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility functions
│   ├── db.ts             # Database functions
│   ├── endaoment-*       # Endaoment integration
│   ├── farcaster.ts      # Farcaster helpers
│   └── movember.ts       # Date/status utilities
├── public/               # Static assets
└── minikit.config.ts     # Farcaster manifest config
```

## Environment Variables

See `.env.example` for all required and optional environment variables.

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_URL` | Your app's production URL | Set after deployment |
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY` | Coinbase Developer Platform API key | [CDP Portal](https://portal.cdp.coinbase.com/) |
| `NEXT_PUBLIC_PROJECT_NAME` | App name (Based Movember) | N/A |
| `INIT_DB_SECRET` | Secret for database initialization | Generate random string |

### Database Variables (Auto-set by Vercel Postgres)

- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

## Database Schema

The app uses the following tables:

- **users** - Farcaster user information
- **user_progress** - Daily photo submissions
- **early_birds** - Pre-November commitments
- **donations** - Donation records

See `app/api/init-db/route.ts` for the complete schema.

## Contributing

This is an open-source project! Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## About Endaoment

All donations are processed through [Endaoment](https://endaoment.org), a nonprofit that enables crypto donations to charitable causes. Endaoment ensures donations are converted to fiat and delivered to the Movember Foundation to support men's health research.

## About Movember

Movember is the leading global organization committed to changing the face of men's health. Learn more at [movember.com](https://movember.com).

## License

This project is open source and available under the [MIT License](LICENSE).

## Links

- **Live App**: [https://movember-lime.vercel.app](https://movember-lime.vercel.app)
- **GitHub**: [https://github.com/forever8896/movember](https://github.com/forever8896/movember)
- **Endaoment**: [https://endaoment.org](https://endaoment.org)
- **Base**: [https://base.org](https://base.org)
- **Farcaster**: [https://farcaster.xyz](https://farcaster.xyz)

## Support

If you encounter any issues or have questions:

1. Check the [GitHub Issues](https://github.com/forever8896/movember/issues)
2. Join the discussion on [Farcaster](https://warpcast.com/basedmovember)
3. Review the [Base Documentation](https://docs.base.org)

---

Built with ❤️ for men's health on [Base](https://base.org)
