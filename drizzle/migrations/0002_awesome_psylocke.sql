CREATE TABLE "mailing_list_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100),
	"subscribed_at" timestamp with time zone DEFAULT now(),
	"unsubscribed_at" timestamp with time zone,
	"is_active" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "mailing_list_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "mailing_list_email_idx" ON "mailing_list_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "mailing_list_is_active_idx" ON "mailing_list_subscribers" USING btree ("is_active");