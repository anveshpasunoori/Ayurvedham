-- Proposed migration. Requires transactional slot locking, authenticated API and privacy review.
CREATE TABLE appointments (id uuid PRIMARY KEY, patient_id uuid NOT NULL REFERENCES accounts(id), doctor_id uuid NOT NULL REFERENCES practitioner_profiles(account_id), starts_at timestamptz NOT NULL, status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','confirmed','declined','cancelled')), CHECK(patient_id<>doctor_id));
CREATE UNIQUE INDEX appointments_confirmed_start ON appointments(doctor_id,starts_at) WHERE status='confirmed';
REVOKE ALL ON appointments FROM PUBLIC;
