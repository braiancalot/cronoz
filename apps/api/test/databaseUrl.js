const SERVER_URL = "postgresql://cronoz:cronoz@localhost:5432";

export const TEST_DATABASE_NAME = "cronoz_test";
export const TEST_DATABASE_URL = `${SERVER_URL}/${TEST_DATABASE_NAME}`;

// globalSetup creates the test database, so it MUST connect elsewhere first.
export const ADMIN_DATABASE_URL = `${SERVER_URL}/postgres`;
