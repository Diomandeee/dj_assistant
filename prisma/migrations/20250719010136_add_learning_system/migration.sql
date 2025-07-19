-- CreateTable
CREATE TABLE "tracks" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "title" TEXT,
    "artist" TEXT,
    "duration" DOUBLE PRECISION,
    "file_path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_features" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "tempo" DOUBLE PRECISION,
    "musical_key" TEXT,
    "energy_level" DOUBLE PRECISION,
    "loudness" DOUBLE PRECISION,
    "danceability" DOUBLE PRECISION,
    "valence" DOUBLE PRECISION,
    "spectral_centroid" DOUBLE PRECISION,
    "spectral_rolloff" DOUBLE PRECISION,
    "zero_crossing_rate" DOUBLE PRECISION,
    "mfcc" JSONB,
    "chroma" JSONB,
    "beat_positions" JSONB,
    "structure_segments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preferred_genres" JSONB NOT NULL DEFAULT '[]',
    "tempo_range" JSONB NOT NULL DEFAULT '{"min": 100, "max": 140}',
    "energy_profile" JSONB NOT NULL DEFAULT '{"morning": 0.6, "afternoon": 0.7, "evening": 0.8, "night": 0.5}',
    "key_preferences" JSONB NOT NULL DEFAULT '[]',
    "transition_style" TEXT NOT NULL DEFAULT 'smooth',
    "average_session_length" INTEGER NOT NULL DEFAULT 30,
    "skip_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "favorite_artists" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_actions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "target_track_id" TEXT,
    "context" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "seed_track_id" TEXT NOT NULL,
    "track_order" JSONB,
    "transition_instructions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "track_features_track_id_key" ON "track_features"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "track_features" ADD CONSTRAINT "track_features_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_seed_track_id_fkey" FOREIGN KEY ("seed_track_id") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
