CREATE TABLE "name_rankings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"count" integer NOT NULL,
	"rank" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_name_rankings_year_name" ON "name_rankings" USING btree ("year","name");--> statement-breakpoint
CREATE INDEX "idx_name_rankings_year_rank" ON "name_rankings" USING btree ("year","rank");