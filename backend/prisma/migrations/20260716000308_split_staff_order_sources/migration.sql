-- AlterTable
ALTER TABLE "StaffUser" ADD COLUMN     "customerScannedOrders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "manualOrdersLogged" INTEGER NOT NULL DEFAULT 0;
