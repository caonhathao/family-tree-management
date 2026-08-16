export const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

export const INVALID_UUID = 'invalid-uuid-format';

export const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000';

export const generateTestEmail = (role: string): string =>
  `test.${role}.${Date.now()}@example.com`;

export const generateRandomSuffix = (): string =>
  `${Date.now()}_${Math.random().toString(36).substring(7)}`;
