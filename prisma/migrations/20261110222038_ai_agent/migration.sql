-- CreateTable
CREATE TABLE "AiAgent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "handoffRules" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiAgent_workspaceId_key" ON "AiAgent"("workspaceId");

-- AddForeignKey
ALTER TABLE "AiAgent" ADD CONSTRAINT "AiAgent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
