-- Brute-force guard for OTP verification: count failed attempts per code
-- (OWASP A07 — identification and authentication failures).
ALTER TABLE "PhoneVerificationToken" ADD COLUMN "failedAttempts" INTEGER NOT NULL DEFAULT 0;
