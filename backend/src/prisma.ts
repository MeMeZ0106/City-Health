import { PrismaClient } from '../generated/client/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// The connection string for MySQL/MariaDB
const databaseUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/city_health';

// In Prisma 7, PrismaMariaDb is a factory that takes the connection config
// We pass the FACTORY itself to the PrismaClient constructor
const adapter = new PrismaMariaDb(databaseUrl);

const prisma = new PrismaClient({ adapter });

export default prisma;
