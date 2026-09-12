-- AlterTable
ALTER TABLE "User" ADD COLUMN "forumDigestDelayMinutes" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "User" ADD COLUMN "forumDigestDueAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_forumDigestDueAt_idx" ON "User"("forumDigestDueAt");

-- CreateTable
CREATE TABLE "ForumThreadSubscription" (
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumThreadSubscription_pkey" PRIMARY KEY ("userId","threadId")
);

-- CreateTable
CREATE TABLE "ForumBoardSubscription" (
    "userId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumBoardSubscription_pkey" PRIMARY KEY ("userId","boardId")
);

-- CreateTable
CREATE TABLE "ForumThreadMailCursor" (
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "lastNotifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumThreadMailCursor_pkey" PRIMARY KEY ("userId","threadId")
);

-- CreateIndex
CREATE INDEX "ForumThreadSubscription_threadId_idx" ON "ForumThreadSubscription"("threadId");

-- CreateIndex
CREATE INDEX "ForumBoardSubscription_boardId_idx" ON "ForumBoardSubscription"("boardId");

-- CreateIndex
CREATE INDEX "ForumThreadMailCursor_threadId_idx" ON "ForumThreadMailCursor"("threadId");

-- AddForeignKey
ALTER TABLE "ForumThreadSubscription" ADD CONSTRAINT "ForumThreadSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThreadSubscription" ADD CONSTRAINT "ForumThreadSubscription_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumBoardSubscription" ADD CONSTRAINT "ForumBoardSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumBoardSubscription" ADD CONSTRAINT "ForumBoardSubscription_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ForumBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThreadMailCursor" ADD CONSTRAINT "ForumThreadMailCursor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThreadMailCursor" ADD CONSTRAINT "ForumThreadMailCursor_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
