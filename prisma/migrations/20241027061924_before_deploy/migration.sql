/*
  Warnings:

  - You are about to drop the column `user_id` on the `manager` table. All the data in the column will be lost.
  - Added the required column `user_created_id` to the `manager` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_manager_id` to the `manager` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "manager" DROP CONSTRAINT "manager_user_id_fkey";

-- AlterTable
ALTER TABLE "manager" DROP COLUMN "user_id",
ADD COLUMN     "user_created_id" INTEGER NOT NULL,
ADD COLUMN     "user_manager_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "bank" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_success" INTEGER NOT NULL DEFAULT 0,
    "count_month" INTEGER DEFAULT 1,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "bank_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "manager" ADD CONSTRAINT "manager_user_created_id_fkey" FOREIGN KEY ("user_created_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager" ADD CONSTRAINT "manager_user_manager_id_fkey" FOREIGN KEY ("user_manager_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank" ADD CONSTRAINT "bank_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
