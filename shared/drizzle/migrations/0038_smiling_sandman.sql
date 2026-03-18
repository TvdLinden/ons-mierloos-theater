CREATE TYPE "public"."blocked_seat_type" AS ENUM('reserved', 'unavailable');--> statement-breakpoint
CREATE TABLE "blocked_seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"performance_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"seat_number" integer NOT NULL,
	"type" "blocked_seat_type" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "blocked_seats_performance_seat_unique" UNIQUE("performance_id","row_number","seat_number")
);
--> statement-breakpoint
ALTER TABLE "blocked_seats" ADD CONSTRAINT "blocked_seats_performance_id_performances_id_fk" FOREIGN KEY ("performance_id") REFERENCES "public"."performances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_seats" ADD CONSTRAINT "blocked_seats_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blocked_seats_performance_id_idx" ON "blocked_seats" USING btree ("performance_id");