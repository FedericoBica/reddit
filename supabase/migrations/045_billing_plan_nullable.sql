-- Allow billing_plan to be NULL to represent a canceled subscription.
-- All three plans (startup, growth, professional) are paid; NULL means no active plan.
ALTER TABLE users ALTER COLUMN billing_plan DROP NOT NULL;
ALTER TABLE users ALTER COLUMN billing_plan SET DEFAULT NULL;
