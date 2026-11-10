-- DropIndex
DROP INDEX "Lead_workspaceId_stageId_idx";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Lead_workspaceId_stageId_position_idx" ON "Lead"("workspaceId", "stageId", "position");
