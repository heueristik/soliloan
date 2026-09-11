-- Allow FAQ articles without a category again (shown at the top of the tree).
ALTER TABLE "FaqArticle" DROP CONSTRAINT "FaqArticle_categoryId_fkey";

ALTER TABLE "FaqArticle" ALTER COLUMN "categoryId" DROP NOT NULL;

ALTER TABLE "FaqArticle" ADD CONSTRAINT "FaqArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FaqCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
