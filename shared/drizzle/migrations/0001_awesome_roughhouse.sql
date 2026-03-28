CREATE TYPE "public"."refund_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'refund_pending';--> statement-breakpoint
CREATE TABLE "order_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"mollie_refund_id" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"description" text,
	"status" "refund_status" DEFAULT 'pending' NOT NULL,
	"ticket_ids_to_cancel" text,
	"requested_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_refunds_order_id_idx" ON "order_refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_refunds_mollie_refund_id_idx" ON "order_refunds" USING btree ("mollie_refund_id");--> statement-breakpoint
CREATE INDEX "order_refunds_status_idx" ON "order_refunds" USING btree ("status");