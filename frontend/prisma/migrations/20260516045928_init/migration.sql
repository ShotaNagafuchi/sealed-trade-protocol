-- CreateEnum
CREATE TYPE "Category" AS ENUM ('REAL_ESTATE', 'PATENT_IP', 'EQUITY_STOCK', 'COMMODITY', 'DIGITAL_ASSET', 'OTHER');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'MATCHED', 'SETTLED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "assetHash" TEXT NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxDealValue" BIGINT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Listing_tradeId_key" ON "Listing"("tradeId");

-- CreateIndex
CREATE INDEX "Listing_category_idx" ON "Listing"("category");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_sellerAddress_idx" ON "Listing"("sellerAddress");

-- CreateIndex
CREATE INDEX "Listing_createdAt_idx" ON "Listing"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_walletAddress_idx" ON "ApiKey"("walletAddress");
