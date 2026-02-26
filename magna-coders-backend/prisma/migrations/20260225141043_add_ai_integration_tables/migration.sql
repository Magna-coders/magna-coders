-- CreateTable
CREATE TABLE "ai_interactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "session_id" VARCHAR(255) NOT NULL,
    "query_summary" TEXT,
    "tools_used" JSONB,
    "response_summary" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_ai_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "ai_personality" VARCHAR(50) NOT NULL DEFAULT 'professional',
    "response_length" VARCHAR(50) NOT NULL DEFAULT 'medium',
    "enable_suggestions" BOOLEAN NOT NULL DEFAULT true,
    "enable_learning_tips" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "user_ai_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_interactions_user_id_idx" ON "ai_interactions"("user_id");

-- CreateIndex
CREATE INDEX "ai_interactions_session_id_idx" ON "ai_interactions"("session_id");

-- CreateIndex
CREATE INDEX "ai_interactions_created_at_idx" ON "ai_interactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_ai_preferences_user_id_key" ON "user_ai_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ai_preferences" ADD CONSTRAINT "user_ai_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
