CREATE TABLE "seo_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"default_title" varchar(255),
	"default_description" text,
	"default_keywords" text,
	"og_image" varchar(500),
	"og_type" varchar(50),
	"twitter_card" varchar(50),
	"twitter_site" varchar(100),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_name" varchar(255),
	"site_description" text,
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"contact_address" text,
	"logo_image_id" uuid,
	"favicon_image_id" uuid,
	"primary_color" varchar(7),
	"secondary_color" varchar(7),
	"smtp_host" varchar(255),
	"smtp_port" integer,
	"smtp_user" varchar(255),
	"smtp_password" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_image_id_images_id_fk" FOREIGN KEY ("logo_image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_image_id_images_id_fk" FOREIGN KEY ("favicon_image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;