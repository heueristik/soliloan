-- CreateTable
CREATE TABLE "ForumThreadMute" (
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumThreadMute_pkey" PRIMARY KEY ("userId","threadId")
);

-- CreateIndex
CREATE INDEX "ForumThreadMute_threadId_idx" ON "ForumThreadMute"("threadId");

-- AddForeignKey
ALTER TABLE "ForumThreadMute" ADD CONSTRAINT "ForumThreadMute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThreadMute" ADD CONSTRAINT "ForumThreadMute_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
