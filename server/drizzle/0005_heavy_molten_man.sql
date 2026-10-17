ALTER TABLE `users` ADD `username` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_username` ON `users` (`username`);