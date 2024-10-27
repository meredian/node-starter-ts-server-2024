CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phoneNumber" varchar(32),
	"meta" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_index" ON "users" USING btree ("email");
