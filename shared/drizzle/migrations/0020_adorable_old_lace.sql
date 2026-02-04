CREATE TABLE "client_applications"
(
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"client_id" varchar(64) NOT NULL,
	"created_at" timestamp
	with time zone DEFAULT now
	() NOT NULL,
	"updated_at" timestamp
	with time zone DEFAULT now
	() NOT NULL,
	CONSTRAINT "client_applications_client_id_unique" UNIQUE
	("client_id")
);
	--> statement-breakpoint
	CREATE TABLE "client_scopes"
	(
		"client_application_id" uuid NOT NULL,
		"target_application_id" uuid NOT NULL,
		"scope" varchar(128) NOT NULL,
		"created_at" timestamp
		with time zone DEFAULT now
		() NOT NULL,
	CONSTRAINT "client_scopes_client_application_id_target_application_id_scope_pk" PRIMARY KEY
		("client_application_id","target_application_id","scope")
);
		--> statement-breakpoint
		CREATE TABLE "client_secrets"
		(
			"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
			"client_application_id" uuid NOT NULL,
			"secret_hash" varchar(255) NOT NULL,
			"active" boolean DEFAULT true NOT NULL,
			"created_at" timestamp
			with time zone DEFAULT now
			() NOT NULL,
	"last_used_at" timestamp
			with time zone
);
			--> statement-breakpoint
			ALTER TABLE "client_scopes" ADD CONSTRAINT "client_scopes_client_application_id_client_applications_id_fk" FOREIGN KEY ("client_application_id") REFERENCES "public"."client_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
			ALTER TABLE "client_scopes" ADD CONSTRAINT "client_scopes_target_application_id_client_applications_id_fk" FOREIGN KEY ("target_application_id") REFERENCES "public"."client_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
			ALTER TABLE "client_secrets" ADD CONSTRAINT "client_secrets_client_application_id_client_applications_id_fk" FOREIGN KEY ("client_application_id") REFERENCES "public"."client_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
			CREATE INDEX "client_scopes_client_application_id_idx" ON "client_scopes" USING btree
			("client_application_id");--> statement-breakpoint
			CREATE INDEX "client_scopes_target_application_id_idx" ON "client_scopes" USING btree
			("target_application_id");