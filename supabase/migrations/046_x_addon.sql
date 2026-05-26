-- Optional X/Twitter add-on per subscription.
-- Tracked separately from billing_plan because it is an independent Paddle price item.
ALTER TABLE users ADD COLUMN x_addon_enabled boolean NOT NULL DEFAULT false;
