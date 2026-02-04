ALTER TABLE "client_secrets" DROP CONSTRAINT "client_secrets_client_application_id_client_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "client_secrets" ADD CONSTRAINT "client_secrets_client_application_id_client_applications_id_fk" FOREIGN KEY ("client_application_id") REFERENCES "public"."client_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_scopes" DROP COLUMN "id";