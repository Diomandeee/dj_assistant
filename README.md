# DJ Assistant - AI-Powered Playlist Generation

A sophisticated Next.js application that uses AI to analyze music tracks and generate optimized playlists for DJs. The system analyzes tempo, key, energy levels, and other musical features to create seamless transitions between tracks.

## Features

- 🎵 **Audio Analysis**: Extracts tempo, key, energy, and spectral features from uploaded tracks
- 🤖 **AI-Powered Matching**: Uses advanced algorithms to find compatible tracks
- 📝 **Playlist Generation**: Creates optimized playlists from a single seed track
- 🎚️ **Transition Optimization**: Provides mixing suggestions and optimal transition points
- 💾 **Track Library**: Persistent storage of tracks and their analyzed features
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Audio Processing**: Web Audio API, Tone.js, TensorFlow.js
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Git

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd dj-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dj_assistant"

# Optional: Redis for caching
REDIS_URL="redis://localhost:6379"

# Security
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment to Vercel

### Option 1: Deploy from GitHub

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect it's a Next.js project

3. **Set Environment Variables**:
   In your Vercel dashboard, add:
   - `DATABASE_URL` (use Vercel Postgres or external provider)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel domain)

4. **Deploy**: Vercel will automatically build and deploy

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to configure your project
```

### Database Options for Production

#### Vercel Postgres (Recommended)
```bash
# In your Vercel dashboard, add Vercel Postgres
# The DATABASE_URL will be automatically configured
```

#### External Providers
- **Supabase**: Full PostgreSQL with additional features
- **PlanetScale**: MySQL-compatible serverless database
- **Railway**: Simple PostgreSQL hosting

## Project Structure

```
dj-assistant/
├── src/
│   ├── app/
│   │   ├── api/                 # API routes
│   │   │   ├── tracks/          # Track management
│   │   │   └── playlists/       # Playlist generation
│   │   ├── components/          # React components
│   │   │   └── ui/              # UI components
│   │   └── page.tsx             # Main page
│   ├── lib/
│   │   ├── audio/               # Audio analysis utilities
│   │   └── database/            # Database connection
│   └── types/                   # TypeScript definitions
├── prisma/
│   └── schema.prisma            # Database schema
├── public/                      # Static assets
└── package.json
```

## Key Components

### Audio Analysis
- **Beat Detection**: Identifies tempo and beat positions
- **Key Detection**: Determines musical key using harmonic analysis
- **Energy Analysis**: Calculates track energy and dynamics
- **Structural Analysis**: Identifies intro, verse, chorus sections

### Track Comparison
- **Tempo Compatibility**: Scores based on BPM differences
- **Key Compatibility**: Uses circle of fifths for harmonic matching
- **Energy Matching**: Compares energy levels for smooth transitions
- **Spectral Analysis**: Analyzes frequency content for timbral similarity

### Playlist Generation
- **Seed-Based**: Starts with user-selected track
- **Compatibility Scoring**: Ranks tracks by multiple factors
- **Flow Optimization**: Orders tracks for optimal energy progression

## API Endpoints

- `POST /api/tracks/upload` - Upload and create track record
- `GET /api/tracks` - Fetch all tracks
- `POST /api/tracks/[id]/analyze` - Store audio analysis results
- `POST /api/playlists/generate` - Generate playlist from seed track

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

### Phase 2: Advanced Audio Analysis
- [ ] Implement sophisticated BPM detection algorithms
- [ ] Add advanced key detection using machine learning
- [ ] Improve structural analysis with onset detection

### Phase 3: Enhanced Compatibility
- [ ] Add vocal detection for better transition points
- [ ] Implement harmonic progression analysis
- [ ] Add genre-aware compatibility scoring

### Phase 4: Transition Optimization
- [ ] Beat alignment analysis
- [ ] Phrase boundary detection
- [ ] Automatic cue point suggestion

### Phase 5: User Experience
- [ ] Waveform visualization
- [ ] Real-time audio preview
- [ ] Drag-and-drop playlist reordering

### Phase 6: Advanced Features
- [ ] User preference learning
- [ ] Collaborative playlists
- [ ] Export to DJ software formats

## Troubleshooting

### Common Issues

1. **Audio Context Error**
   - Ensure user interaction before audio processing
   - Check browser compatibility for Web Audio API

2. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Ensure database is running (for local development)

3. **Build Errors**
   - Run `npm run db:generate` after schema changes
   - Clear `.next` folder and rebuild

4. **Vercel Deployment Issues**
   - Check environment variables are set
   - Verify database is accessible from Vercel
   - Review function timeout limits for audio processing

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact the development team.
