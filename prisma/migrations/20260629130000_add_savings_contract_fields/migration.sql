-- CreateEnum
CREATE TYPE "SavingsRateType" AS ENUM ('FIXED', 'VARYING');

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "isSavingsContract" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "savingsRateType" "SavingsRateType",
ADD COLUMN     "savingsMonthlyAmount" DOUBLE PRECISION,
ADD COLUMN     "savingsPaymentCount" INTEGER,
ADD COLUMN     "savingsFirstPaymentDate" TIMESTAMP(3);
