ALTER TABLE "ticket_sales" RENAME TO "line_items";--> statement-breakpoint
ALTER TABLE "line_items" DROP CONSTRAINT "ticket_sales_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "line_items" DROP CONSTRAINT "ticket_sales_performance_id_performances_id_fk";
--> statement-breakpoint
ALTER TABLE "line_items" DROP CONSTRAINT "ticket_sales_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "ticket_sales_order_id_idx";--> statement-breakpoint
DROP INDEX "ticket_sales_performance_id_idx";--> statement-breakpoint
DROP INDEX "ticket_sales_user_id_idx";--> statement-breakpoint
DROP INDEX "ticket_sales_purchase_date_idx";--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_performance_id_performances_id_fk" FOREIGN KEY ("performance_id") REFERENCES "public"."performances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "line_items_order_id_idx" ON "line_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "line_items_performance_id_idx" ON "line_items" USING btree ("performance_id");--> statement-breakpoint
CREATE INDEX "line_items_user_id_idx" ON "line_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "line_items_purchase_date_idx" ON "line_items" USING btree ("purchase_date");