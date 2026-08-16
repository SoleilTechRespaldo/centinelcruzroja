CREATE TABLE `indicios` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text,
	`channel` text NOT NULL,
	`status` text DEFAULT 'por_verificar' NOT NULL,
	`source_org_id` text,
	`title` text NOT NULL,
	`summary` text,
	`content` text,
	`url` text,
	`sender` text,
	`external_ref` text,
	`is_official` integer DEFAULT true NOT NULL,
	`occurred_at` integer,
	`received_at` integer DEFAULT (unixepoch()) NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`review_note` text,
	`promoted_source_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_org_id`) REFERENCES `source_orgs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`promoted_source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_indicios_status` ON `indicios` (`status`);--> statement-breakpoint
CREATE INDEX `idx_indicios_incident` ON `indicios` (`incident_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_indicios_dedup` ON `indicios` (`channel`,`external_ref`);