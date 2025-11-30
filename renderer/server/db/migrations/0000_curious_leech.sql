CREATE TABLE "pc_info" (
	"user_id" text PRIMARY KEY NOT NULL,
	"hostname" text NOT NULL,
	"os" text NOT NULL,
	"os_version" text NOT NULL,
	"cpu" text NOT NULL,
	"cpu_cores" integer NOT NULL,
	"total_memory" text NOT NULL,
	"free_memory" text NOT NULL,
	"memory_type" text NOT NULL,
	"platform" text NOT NULL,
	"arch" text NOT NULL,
	"username" text NOT NULL,
	"gpu" jsonb NOT NULL,
	"storage" jsonb NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
