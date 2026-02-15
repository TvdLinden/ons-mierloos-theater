CREATE TABLE "image_usages" (
	"image_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	CONSTRAINT "image_usages_image_id_entity_type_entity_id_pk" PRIMARY KEY("image_id","entity_type","entity_id")
);
--> statement-breakpoint
ALTER TABLE "image_usages" ADD CONSTRAINT "image_usages_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "image_usages_entity_idx" ON "image_usages" USING btree ("entity_type","entity_id");