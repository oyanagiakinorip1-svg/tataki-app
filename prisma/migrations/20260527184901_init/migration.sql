/*
  Warnings:

  - Added the required column `content` to the `datas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "datas" ADD COLUMN     "content" TEXT NOT NULL;
