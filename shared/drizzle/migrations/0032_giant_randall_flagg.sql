CREATE TABLE "custom_code_snippets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" varchar(20) NOT NULL,
	"html" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "custom_code_snippets_location_idx" ON "custom_code_snippets" USING btree ("location");--> statement-breakpoint
CREATE INDEX "custom_code_snippets_is_enabled_idx" ON "custom_code_snippets" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "custom_code_snippets_sort_order_idx" ON "custom_code_snippets" USING btree ("sort_order");