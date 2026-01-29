import * as faker from 'faker';
import { GENDER } from '@prisma/client';

/**
 * Generates a random user object for testing.
 * @returns A user object with random data.
 */
export const generateRandomUser = () => ({
  email: faker.internet.email(),
  password: faker.internet.password(),
  fullName: faker.name.findName(),
});

/**
 * Generates a random family object for testing.
 * @returns A family object with a random name and description.
 */
export const generateRandomFamily = () => ({
  name: faker.company.companyName(),
  description: faker.lorem.sentence(),
});

/**
 * Generates a random family member object for testing.
 * @param familyId - The ID of the family this member belongs to.
 * @returns A family member object with random data.
 */
export const generateRandomMember = (familyId: string) => ({
  familyId,
  fullName: faker.name.findName(),
  gender: faker.random.arrayElement([GENDER.MALE, GENDER.FEMALE, GENDER.OTHER]),
  dateOfBirth: faker.date.past(50),
  dateOfDeath: null,
  isAlive: true,
  biography: faker.lorem.paragraph(),
  generation: faker.datatype.number({ min: 1, max: 5 }),
});
