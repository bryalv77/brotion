-- Drop the Task 1 placeholder table; the real domain models begin here.
DROP TABLE IF EXISTS "HealthCheck";

-- User
CREATE TABLE "users" (
    "id"            TEXT NOT NULL,
    "email"         TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name"          TEXT,
    "avatar_url"    TEXT,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Session (refresh-token tracking / revocation)
CREATE TABLE "sessions" (
    "id"                 TEXT NOT NULL,
    "user_id"            TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at"         TIMESTAMP(3) NOT NULL,
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at"         TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sessions_user_id_idx"            ON "sessions"("user_id");
CREATE INDEX "sessions_refresh_token_hash_idx" ON "sessions"("refresh_token_hash");

ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
