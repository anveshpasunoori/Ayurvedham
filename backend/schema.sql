-- PostgreSQL initial schema; deploy only after security review.
CREATE TABLE accounts (id uuid PRIMARY KEY, auth_subject text UNIQUE NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE subscriptions (account_id uuid PRIMARY KEY REFERENCES accounts(id), plan text NOT NULL CHECK(plan IN ('student','pro','institution')), status text NOT NULL CHECK(status IN ('active','trialing','unpaid','cancelled','expired')), expires_at timestamptz NOT NULL, provider_subscription_id text UNIQUE);
CREATE TABLE institutions (id uuid PRIMARY KEY, name text NOT NULL, owner_id uuid NOT NULL REFERENCES accounts(id));
CREATE TABLE institution_members (institution_id uuid REFERENCES institutions(id), account_id uuid REFERENCES accounts(id), role text NOT NULL CHECK(role IN ('admin','faculty','student')), PRIMARY KEY(institution_id,account_id));
CREATE TABLE practitioner_profiles (account_id uuid PRIMARY KEY REFERENCES accounts(id), display_name text NOT NULL, registration_authority text NOT NULL, registration_number text NOT NULL, verification_status text NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending','verified','rejected','revoked')), verified_at timestamptz, UNIQUE(registration_authority,registration_number));
CREATE TABLE payment_events (provider text NOT NULL, event_id text NOT NULL, processed_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(provider,event_id));
-- No public database access. Application must enforce account ownership and institution isolation.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
