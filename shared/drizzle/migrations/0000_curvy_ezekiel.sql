CREATE TYPE "public"."link_location" AS ENUM('header', 'footer');--> statement-breakpoint
CREATE TYPE "public"."page_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."coupon_discount_type" AS ENUM('percentage', 'fixed', 'free_tickets');--> statement-breakpoint
CREATE TYPE "public"."performance_status" AS ENUM('draft', 'published', 'sold_out', 'cancelled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."show_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'contributor');--> statement-breakpoint
CREATE TYPE "public"."blocked_seat_type" AS ENUM('reserved', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."sponsor_tier" AS ENUM('gold', 'silver', 'bronze');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "homepage_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intro_title" varchar(255),
	"intro_text" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mailing_list_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100),
	"unsubscribe_token" varchar(255),
	"subscribed_at" timestamp with time zone DEFAULT now(),
	"unsubscribed_at" timestamp with time zone,
	"is_active" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "mailing_list_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "navigation_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(100) NOT NULL,
	"href" varchar(500) NOT NULL,
	"location" "link_location" NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"image_id" uuid,
	"published_at" timestamp with time zone,
	"active" integer DEFAULT 1 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "news_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text,
	"blocks" jsonb,
	"status" "page_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "social_media_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(50) NOT NULL,
	"url" varchar(500) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
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
	"discount_type" "coupon_discount_type" DEFAULT 'fixed' NOT NULL,
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
CREATE TABLE "image_usages" (
	"image_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	CONSTRAINT "image_usages_image_id_entity_type_entity_id_pk" PRIMARY KEY("image_id","entity_type","entity_id")
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar(255),
	"mimetype" varchar(100),
	"r2_url" text NOT NULL,
	"original_width" integer,
	"original_height" integer,
	"focal_points" jsonb,
	"uploaded_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "performances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"price" numeric(8, 2),
	"rows" integer DEFAULT 5,
	"seats_per_row" integer DEFAULT 20,
	"total_seats" integer DEFAULT 100,
	"available_seats" integer DEFAULT 100,
	"status" "performance_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" varchar(255),
	"slug" varchar(255) NOT NULL,
	"blocks" jsonb,
	"image_id" uuid,
	"base_price" numeric(8, 2),
	"status" "show_status" DEFAULT 'draft' NOT NULL,
	"publication_date" timestamp with time zone,
	"depublication_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "shows_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "show_tags" (
	"show_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "show_tags_show_id_tag_id_pk" PRIMARY KEY("show_id","tag_id")
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
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100),
	"email" varchar(255),
	"password_hash" varchar(255),
	"role" "user_role" DEFAULT 'user',
	"email_verified" timestamp with time zone,
	"verification_token" varchar(255),
	"reset_token" varchar(255),
	"reset_token_expiry" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_signin" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
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
CREATE TABLE "line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"performance_id" uuid,
	"user_id" uuid,
	"quantity" integer,
	"price_per_ticket" numeric(8, 2),
	"purchase_date" timestamp with time zone DEFAULT now(),
	"wheelchair_access" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"customer_name" varchar(100) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"invoice_number" serial NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"line_item_id" uuid NOT NULL,
	"performance_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"ticket_number" varchar(50) NOT NULL,
	"row_number" integer NOT NULL,
	"seat_number" integer NOT NULL,
	"wheelchair_access" boolean DEFAULT false NOT NULL,
	"qr_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"scanned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tickets_ticket_number_unique" UNIQUE("ticket_number"),
	CONSTRAINT "tickets_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(50),
	"payment_provider" varchar(50),
	"provider_transaction_id" varchar(255),
	"provider_payment_url" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_id" uuid,
	"website" varchar(500),
	"tier" "sponsor_tier" DEFAULT 'bronze' NOT NULL,
	"display_order" integer DEFAULT 0,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
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
	"font_display" varchar(50),
	"font_body" varchar(50),
	"smtp_host" varchar(255),
	"smtp_port" integer,
	"smtp_user" varchar(255),
	"smtp_password" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "application_defined_scopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"scope" varchar(128) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"client_id" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_applications_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "client_secrets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_application_id" uuid NOT NULL,
	"secret_hash" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "granted_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"granted_to_application_id" uuid NOT NULL,
	"defined_scope_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 0,
	"data" jsonb NOT NULL,
	"result" jsonb,
	"error_message" text,
	"execution_count" integer DEFAULT 0,
	"next_retry_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_performances" ADD CONSTRAINT "coupon_performances_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_performances" ADD CONSTRAINT "coupon_performances_performance_id_performances_id_fk" FOREIGN KEY ("performance_id") REFERENCES "public"."performances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_usages" ADD CONSTRAINT "image_usages_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performances" ADD CONSTRAINT "performances_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shows" ADD CONSTRAINT "shows_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_tags" ADD CONSTRAINT "show_tags_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_tags" ADD CONSTRAINT "show_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_seats" ADD CONSTRAINT "blocked_seats_performance_id_performances_id_fk" FOREIGN KEY ("performance_id") REFERENCES "public"."performances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_seats" ADD CONSTRAINT "blocked_seats_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_performance_id_performances_id_fk" FOREIGN KEY ("performance_id") REFERENCES "public"."performances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_line_item_id_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."line_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_performance_id_performances_id_fk" FOREIGN KEY ("performance_id") REFERENCES "public"."performances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_logo_id_images_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_image_id_images_id_fk" FOREIGN KEY ("logo_image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_image_id_images_id_fk" FOREIGN KEY ("favicon_image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_defined_scopes" ADD CONSTRAINT "application_defined_scopes_application_id_client_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."client_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_secrets" ADD CONSTRAINT "client_secrets_client_application_id_client_applications_id_fk" FOREIGN KEY ("client_application_id") REFERENCES "public"."client_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "granted_permissions" ADD CONSTRAINT "granted_permissions_granted_to_application_id_client_applications_id_fk" FOREIGN KEY ("granted_to_application_id") REFERENCES "public"."client_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "granted_permissions" ADD CONSTRAINT "granted_permissions_defined_scope_id_application_defined_scopes_id_fk" FOREIGN KEY ("defined_scope_id") REFERENCES "public"."application_defined_scopes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mailing_list_email_idx" ON "mailing_list_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "mailing_list_unsubscribe_token_idx" ON "mailing_list_subscribers" USING btree ("unsubscribe_token");--> statement-breakpoint
CREATE INDEX "mailing_list_is_active_idx" ON "mailing_list_subscribers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "navigation_links_location_idx" ON "navigation_links" USING btree ("location");--> statement-breakpoint
CREATE INDEX "navigation_links_display_order_idx" ON "navigation_links" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "navigation_links_active_idx" ON "navigation_links" USING btree ("active");--> statement-breakpoint
CREATE INDEX "news_articles_published_at_idx" ON "news_articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "news_articles_active_idx" ON "news_articles" USING btree ("active");--> statement-breakpoint
CREATE INDEX "news_articles_display_order_idx" ON "news_articles" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "news_articles_slug_idx" ON "news_articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "pages_title_idx" ON "pages" USING btree ("title");--> statement-breakpoint
CREATE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "social_media_links_display_order_idx" ON "social_media_links" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "social_media_links_active_idx" ON "social_media_links" USING btree ("active");--> statement-breakpoint
CREATE INDEX "coupon_performances_coupon_id_idx" ON "coupon_performances" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_performances_performance_id_idx" ON "coupon_performances" USING btree ("performance_id");--> statement-breakpoint
CREATE INDEX "coupon_usages_coupon_id_idx" ON "coupon_usages" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_usages_order_id_idx" ON "coupon_usages" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "coupon_usages_user_id_idx" ON "coupon_usages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupon_usages_used_at_idx" ON "coupon_usages" USING btree ("used_at");--> statement-breakpoint
CREATE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupons_is_active_idx" ON "coupons" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "coupons_valid_from_idx" ON "coupons" USING btree ("valid_from");--> statement-breakpoint
CREATE INDEX "coupons_valid_until_idx" ON "coupons" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "image_usages_entity_idx" ON "image_usages" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "performances_show_id_idx" ON "performances" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX "performances_date_idx" ON "performances" USING btree ("date");--> statement-breakpoint
CREATE INDEX "performances_status_idx" ON "performances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shows_title_idx" ON "shows" USING btree ("title");--> statement-breakpoint
CREATE INDEX "shows_slug_idx" ON "shows" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "shows_status_idx" ON "shows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shows_publication_date_idx" ON "shows" USING btree ("publication_date");--> statement-breakpoint
CREATE INDEX "show_tags_show_id_idx" ON "show_tags" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX "show_tags_tag_id_idx" ON "show_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "blocked_seats_performance_id_idx" ON "blocked_seats" USING btree ("performance_id");--> statement-breakpoint
CREATE INDEX "line_items_order_id_idx" ON "line_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "line_items_performance_id_idx" ON "line_items" USING btree ("performance_id");--> statement-breakpoint
CREATE INDEX "line_items_user_id_idx" ON "line_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "line_items_purchase_date_idx" ON "line_items" USING btree ("purchase_date");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_customer_email_idx" ON "orders" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tickets_line_item_id_idx" ON "tickets" USING btree ("line_item_id");--> statement-breakpoint
CREATE INDEX "tickets_performance_id_idx" ON "tickets" USING btree ("performance_id");--> statement-breakpoint
CREATE INDEX "tickets_order_id_idx" ON "tickets" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "tickets_qr_token_idx" ON "tickets" USING btree ("qr_token");--> statement-breakpoint
CREATE INDEX "tickets_ticket_number_idx" ON "tickets" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_provider_transaction_id_idx" ON "payments" USING btree ("provider_transaction_id");--> statement-breakpoint
CREATE INDEX "sponsors_tier_idx" ON "sponsors" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "sponsors_active_idx" ON "sponsors" USING btree ("active");--> statement-breakpoint
CREATE INDEX "sponsors_display_order_idx" ON "sponsors" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "custom_code_snippets_location_idx" ON "custom_code_snippets" USING btree ("location");--> statement-breakpoint
CREATE INDEX "custom_code_snippets_is_enabled_idx" ON "custom_code_snippets" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "custom_code_snippets_sort_order_idx" ON "custom_code_snippets" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "application_defined_scopes_application_id_idx" ON "application_defined_scopes" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "granted_permissions_granted_to_application_id_idx" ON "granted_permissions" USING btree ("granted_to_application_id");--> statement-breakpoint
CREATE INDEX "granted_permissions_defined_scope_id_idx" ON "granted_permissions" USING btree ("defined_scope_id");--> statement-breakpoint
CREATE INDEX "jobs_type_status_idx" ON "jobs" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "jobs_next_retry_at_idx" ON "jobs" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "jobs_created_at_idx" ON "jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");