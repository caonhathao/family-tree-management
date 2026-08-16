// @ts-expect-error @faker-js/faker is ESM-only; ts-jest resolves it via CommonJS semantics.
import { faker } from '@faker-js/faker';
import { GENDER } from '@prisma/client';

/**
 * Generates a random user object for testing.
 * @returns A user object with random data.
 */
export const generateRandomUser = () => ({
  email: faker.internet.email(),
  password: faker.internet.password(),
  fullName: faker.person.fullName(),
});

/**
 * Generates a random family object for testing.
 * @returns A family object with a random name and description.
 */
export const generateRandomFamily = () => ({
  name: faker.company.name(),
  description: faker.lorem.sentence(),
});

/**
 * Generates a random family member object for testing.
 * @param familyId - The ID of the family this member belongs to.
 * @returns A family member object with random data.
 */
export const generateRandomMember = (familyId: string) => ({
  familyId,
  fullName: faker.person.fullName(),
  gender: faker.helpers.arrayElement([
    GENDER.MALE,
    GENDER.FEMALE,
    GENDER.OTHER,
  ]),
  dateOfBirth: faker.date.past({ years: 50 }),
  dateOfDeath: null,
  isAlive: true,
  biography: faker.lorem.paragraph(),
  generation: faker.number.int({ min: 1, max: 5 }),
});
