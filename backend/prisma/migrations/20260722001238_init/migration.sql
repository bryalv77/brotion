-- CreateTable
CREATE TABLE "HealthCheck" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthCheck_pkey" PRIMARY KEY ("id")
);
