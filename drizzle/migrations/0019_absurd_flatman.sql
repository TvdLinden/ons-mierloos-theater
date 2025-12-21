ALTER TABLE "mailing_list_subscribers" ADD COLUMN "unsubscribe_token" varchar(255);--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "blocks" jsonb;--> statement-breakpoint
CREATE INDEX "mailing_list_unsubscribe_token_idx" ON "mailing_list_subscribers" USING btree ("unsubscribe_token");