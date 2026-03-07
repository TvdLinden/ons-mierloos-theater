ALTER TABLE "news_articles" ADD COLUMN "slug" varchar(255);--> statement-breakpoint
CREATE INDEX "news_articles_slug_idx" ON "news_articles" USING btree ("slug");