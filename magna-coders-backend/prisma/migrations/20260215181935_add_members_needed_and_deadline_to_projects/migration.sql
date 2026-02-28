-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "deadline" TIMESTAMPTZ(6),
ADD COLUMN     "members_needed" INTEGER DEFAULT 0;
