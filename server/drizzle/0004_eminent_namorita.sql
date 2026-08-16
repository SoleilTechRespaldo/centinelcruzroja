CREATE TABLE `map_markers` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_markers_incident` ON `map_markers` (`incident_id`);--> statement-breakpoint
CREATE INDEX `idx_markers_type` ON `map_markers` (`type`);