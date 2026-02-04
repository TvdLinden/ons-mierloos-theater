CREATE TABLE "application_defined_scopes"
(
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"scope" varchar(128) NOT NULL,
	"description" text,
	"created_at" timestamp
	with time zone DEFAULT now
	() NOT NULL
);
	--> statement-breakpoint
	CREATE TABLE "granted_permissions"
	(
		"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
		"granted_to_application_id" uuid NOT NULL,
		"defined_scope_id" uuid NOT NULL,
		"created_at" timestamp
		with time zone DEFAULT now
		() NOT NULL
);
		--> statement-breakpoint
		ALTER TABLE "application_defined_scopes" ADD CONSTRAINT "application_defined_scopes_application_id_client_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."client_applications"("id") ON DELETE cascade ON UPDATE no action;
		--> statement-breakpoint
		ALTER TABLE "granted_permissions" ADD CONSTRAINT "granted_permissions_granted_to_application_id_client_applications_id_fk" FOREIGN KEY ("granted_to_application_id") REFERENCES "public"."client_applications"("id") ON DELETE cascade ON UPDATE no action;
		--> statement-breakpoint
		ALTER TABLE "granted_permissions" ADD CONSTRAINT "granted_permissions_defined_scope_id_application_defined_scopes_id_fk" FOREIGN KEY ("defined_scope_id") REFERENCES "public"."application_defined_scopes"("id") ON DELETE cascade ON UPDATE no action;
		--> statement-breakpoint
		CREATE INDEX "application_defined_scopes_application_id_idx" ON "application_defined_scopes" USING btree
		("application_id");
		--> statement-breakpoint
		CREATE INDEX "granted_permissions_granted_to_application_id_idx" ON "granted_permissions" USING btree
		("granted_to_application_id");
		--> statement-breakpoint
		CREATE INDEX "granted_permissions_defined_scope_id_idx" ON "granted_permissions" USING btree
		("defined_scope_id");
		--> statement-breakpoint
		DROP TABLE IF EXISTS "client_scopes";