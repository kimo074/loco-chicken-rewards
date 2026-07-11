-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "coinBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffUser_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "coinsAwarded" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME NOT NULL,
    "claimedAt" DATETIME,
    "claimedByCustomerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleCode_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SaleCode_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "StaffUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SaleCode_claimedByCustomerId_fkey" FOREIGN KEY ("claimedByCustomerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "costCoins" INTEGER NOT NULL,
    "maxValueCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "costCoins" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME NOT NULL,
    "fulfilledAt" DATETIME,
    "fulfilledByStaffId" TEXT,
    "fulfilledAtLocationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Redemption_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Redemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Redemption_fulfilledByStaffId_fkey" FOREIGN KEY ("fulfilledByStaffId") REFERENCES "StaffUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Redemption_fulfilledAtLocationId_fkey" FOREIGN KEY ("fulfilledAtLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoinTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "locationId" TEXT,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "relatedSaleCodeId" TEXT,
    "relatedRedemptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoinTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CoinTransaction_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CoinTransaction_relatedSaleCodeId_fkey" FOREIGN KEY ("relatedSaleCodeId") REFERENCES "SaleCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CoinTransaction_relatedRedemptionId_fkey" FOREIGN KEY ("relatedRedemptionId") REFERENCES "Redemption" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SaleCode_token_key" ON "SaleCode"("token");

-- CreateIndex
CREATE INDEX "SaleCode_status_expiresAt_idx" ON "SaleCode"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Redemption_token_key" ON "Redemption"("token");

-- CreateIndex
CREATE INDEX "Redemption_status_expiresAt_idx" ON "Redemption"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoinTransaction_relatedSaleCodeId_key" ON "CoinTransaction"("relatedSaleCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "CoinTransaction_relatedRedemptionId_key" ON "CoinTransaction"("relatedRedemptionId");

-- CreateIndex
CREATE INDEX "CoinTransaction_customerId_createdAt_idx" ON "CoinTransaction"("customerId", "createdAt");
