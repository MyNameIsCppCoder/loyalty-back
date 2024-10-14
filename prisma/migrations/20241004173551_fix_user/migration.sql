/*
  Warnings:

  - You are about to drop the `Manager` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Manager" DROP CONSTRAINT "Manager_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- DropTable
DROP TABLE "Manager";

-- CreateTable
CREATE TABLE "manager" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "manager_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manager_username_key" ON "manager"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "manager" ADD CONSTRAINT "manager_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
