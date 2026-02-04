CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"line_item_id" uuid NOT NULL,
	"performance_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"ticket_number" varchar(50) NOT NULL,
	"row_letter" varchar(2) NOT NULL,
	"seat_number" integer NOT NULL,
	"qr_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"scanned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tickets_ticket_number_unique" UNIQUE("ticket_number"),
	CONSTRAINT "tickets_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
ALTER TABLE "performances" ADD COLUMN "rows" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "performances" ADD COLUMN "seats_per_row" integer DEFAULT 20;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_line_item_id_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."line_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_performance_id_performances_id_fk" FOREIGN KEY ("performance_id") REFERENCES "public"."performances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tickets_line_item_id_idx" ON "tickets" USING btree ("line_item_id");--> statement-breakpoint
CREATE INDEX "tickets_performance_id_idx" ON "tickets" USING btree ("performance_id");--> statement-breakpoint
CREATE INDEX "tickets_order_id_idx" ON "tickets" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "tickets_qr_token_idx" ON "tickets" USING btree ("qr_token");--> statement-breakpoint
CREATE INDEX "tickets_ticket_number_idx" ON "tickets" USING btree ("ticket_number");