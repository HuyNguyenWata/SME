-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "has_been_out" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "low_stock_threshold" INTEGER NOT NULL DEFAULT 10;
