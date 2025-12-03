CREATE TYPE "public"."coupon_discount_type" AS ENUM('percentage', 'fixed', 'free_tickets');--> statement-breakpoint
CREATE TABLE "coupon_performances" (
	"coupon_id" uuid NOT NULL,
	"performance_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "coupon_performances_coupon_id_performance_id_pk" PRIMARY KEY("coupon_id","performance_id")
);
--> statement-breakpoint
CREATE TABLE "coupon_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid,
	"discount_amount" numeric(10, 2) NOT NULL,
	"used_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"discount_type" "coupon_discount_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_order_amount" numeric(10, 2),
	"max_uses" integer,
	"max_uses_per_user" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "coupon_performances" ADD CONSTRAINT "coupon_performances_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_performances" ADD CONSTRAINT "coupon_performances_performance_id_performances_id_fk" FOREIGN KEY ("performance_id") REFERENCES "public"."performances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coupon_performances_coupon_id_idx" ON "coupon_performances" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_performances_performance_id_idx" ON "coupon_performances" USING btree ("performance_id");--> statement-breakpoint
CREATE INDEX "coupon_usages_coupon_id_idx" ON "coupon_usages" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_usages_order_id_idx" ON "coupon_usages" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "coupon_usages_user_id_idx" ON "coupon_usages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupon_usages_used_at_idx" ON "coupon_usages" USING btree ("used_at");--> statement-breakpoint
CREATE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupons_is_active_idx" ON "coupons" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "coupons_valid_from_idx" ON "coupons" USING btree ("valid_from");--> statement-breakpoint
CREATE INDEX "coupons_valid_until_idx" ON "coupons" USING btree ("valid_until");