-- Add Company.code and support Super Admin users (employeeId nullable)

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- 1) Company.code
ALTER TABLE "Company" ADD COLUMN "code" TEXT;
UPDATE "Company"
SET "code" = COALESCE(UPPER("subdomain"), 'COMPANY_' || SUBSTR("id", 1, 8))
WHERE "code" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Company_code_key" ON "Company"("code");

-- 2) User: make employeeId nullable + add isSuperAdmin
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_User" ("id", "employeeId", "username", "passwordHash", "createdAt", "updatedAt")
SELECT "id", "employeeId", "username", "passwordHash", "createdAt", "updatedAt"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

-- Recreate indexes for User
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

COMMIT;
PRAGMA foreign_keys=ON;

