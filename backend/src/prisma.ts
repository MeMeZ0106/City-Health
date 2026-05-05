import { PrismaClient } from '../generated/client/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required. Set it in the environment.');
}

// In Prisma 7, PrismaMariaDb is a factory that takes the connection config
// We pass the FACTORY itself to the PrismaClient constructor
const adapter = new PrismaMariaDb(databaseUrl);

const prisma = new PrismaClient({ adapter });

export default prisma;
