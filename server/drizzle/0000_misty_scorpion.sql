CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`details` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_user` ON `audit_log` (`user_id`);--> statement-breakpoint
CREATE TABLE `bie_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`docx_template_key` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bie_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`template_id` text,
	`data` text,
	`docx_key` text,
	`pdf_key` text,
	`generated_by` text,
	`approved_by` text,
	`approved_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_id`) REFERENCES `bie_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`generated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bie_incident` ON `bie_versions` (`incident_id`);--> statement-breakpoint
CREATE TABLE `comunas` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`province` text,
	`region_id` text NOT NULL,
	`ine_code` text,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `event_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`icon` text,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_types_slug_unique` ON `event_types` (`slug`);--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`source_id` text,
	`kind` text NOT NULL,
	`file_key` text,
	`file_name` text,
	`mime_type` text,
	`size_bytes` integer,
	`caption` text,
	`url` text,
	`captured_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_evidence_incident` ON `evidence` (`incident_id`);--> statement-breakpoint
CREATE TABLE `incident_comunas` (
	`incident_id` text NOT NULL,
	`comuna_id` text NOT NULL,
	PRIMARY KEY(`incident_id`, `comuna_id`),
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`comuna_id`) REFERENCES `comunas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `incident_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`personas_afectadas` integer,
	`voluntarios` integer,
	`metrics` text,
	`voluntarios_por_filial` text,
	`reported_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_by` text,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_reports_incident` ON `incident_reports` (`incident_id`);--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`event_type_id` text,
	`status` text DEFAULT 'monitoring' NOT NULL,
	`alert_senapred` text DEFAULT 'none' NOT NULL,
	`alert_cruz_roja` text DEFAULT 'green' NOT NULL,
	`description` text,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`event_type_id`) REFERENCES `event_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `incidents_code_unique` ON `incidents` (`code`);--> statement-breakpoint
CREATE INDEX `idx_incidents_status` ON `incidents` (`status`);--> statement-breakpoint
CREATE INDEX `idx_incidents_event_type` ON `incidents` (`event_type_id`);--> statement-breakpoint
CREATE INDEX `idx_incidents_started` ON `incidents` (`started_at`);--> statement-breakpoint
CREATE TABLE `regions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `source_orgs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`official_url` text,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_orgs_slug_unique` ON `source_orgs` (`slug`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`source_org_id` text,
	`title` text,
	`url` text,
	`content` text,
	`captured_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_org_id`) REFERENCES `source_orgs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sources_incident` ON `sources` (`incident_id`);--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`happened_at` integer NOT NULL,
	`entry_type` text DEFAULT 'note' NOT NULL,
	`description` text NOT NULL,
	`source_id` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_timeline_incident` ON `timeline_events` (`incident_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'operator' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);