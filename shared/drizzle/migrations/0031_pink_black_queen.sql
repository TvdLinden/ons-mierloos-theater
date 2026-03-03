ALTER TABLE "tickets" RENAME COLUMN "row_letter" TO "row_number";--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "row_number" TYPE integer USING (ascii("row_number") - 64);
