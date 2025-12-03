CREATE TYPE "public"."performance_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar(255),
	"mimetype" varchar(100),
	"data" "bytea",
	"uploaded_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "performance_tags" (
	"performance_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "performance_tags_performance_id_tag_id_pk" PRIMARY KEY("performance_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "performances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255),
	"slug" varchar(255) NOT NULL,
	"date" timestamp with time zone,
	"description" text,
	"image_id" uuid,
	"thumbnail_image_id" uuid,
	"price" numeric(8, 2),
	"status" "performance_status" DEFAULT 'draft',
	"publication_date" timestamp with time zone,
	"depublication_date" timestamp with time zone,
	CONSTRAINT "performances_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ticket_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"performance_id" uuid,
	"user_id" uuid,
	"quantity" integer,
	"purchase_date" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100),
	"email" varchar(255),
	"password_hash" varchar(255),
	"role" varchar(32) DEFAULT 'user',
	"created_at" timestamp with time zone DEFAULT now(),
	"last_signin" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "performance_tags" ADD CONSTRAINT "performance_tags_performance_id_performances_id_fk" FOREIGN KEY ("performance_id") REFERENCES "public"."performances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_tags" ADD CONSTRAINT "performance_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performances" ADD CONSTRAINT "performances_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performances" ADD CONSTRAINT "performances_thumbnail_image_id_images_id_fk" FOREIGN KEY ("thumbnail_image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_sales" ADD CONSTRAINT "ticket_sales_performance_id_performances_id_fk" FOREIGN KEY ("performance_id") REFERENCES "public"."performances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_sales" ADD CONSTRAINT "ticket_sales_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "performance_tags_performance_id_idx" ON "performance_tags" USING btree ("performance_id");--> statement-breakpoint
CREATE INDEX "performance_tags_tag_id_idx" ON "performance_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "performances_title_idx" ON "performances" USING btree ("title");--> statement-breakpoint
CREATE INDEX "performances_slug_idx" ON "performances" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "performances_status_idx" ON "performances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "performances_date_idx" ON "performances" USING btree ("date");--> statement-breakpoint
CREATE INDEX "performances_publication_date_idx" ON "performances" USING btree ("publication_date");--> statement-breakpoint
CREATE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "ticket_sales_performance_id_idx" ON "ticket_sales" USING btree ("performance_id");--> statement-breakpoint
CREATE INDEX "ticket_sales_user_id_idx" ON "ticket_sales" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ticket_sales_purchase_date_idx" ON "ticket_sales" USING btree ("purchase_date");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");