/**
 * PublisherOS — Database seed script
 *
 * Creates:
 *   - 1 Super Admin  (admin@publisheros.com / Admin1234!)
 *   - Publisher A    owner: owner-a@publisheros-test.com / Owner1234!
 *   - Publisher B    owner: owner-b@publisheros-test.com / Owner1234!
 *
 * Each publisher also gets one staff member for isolation testing.
 *
 * Usage:
 *   cd PublisherOS-Backend
 *   npx ts-node prisma/seed.ts
 *   # or with tsx:
 *   npx tsx prisma/seed.ts
 */

import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { slugify } from '../src/lib/slug.js';

const prisma = new PrismaClient();

async function hashPw(pw: string) {
  return argon2.hash(pw);
}

async function main() {
  console.log('Seeding PublisherOS database…');

  // ── Super Admin ─────────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@publisheros.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@publisheros.com',
      passwordHash: await hashPw('Admin1234!'),
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      systemRole: 'SUPER_ADMIN',
    },
  });
  console.log(`  ✔ Super Admin: ${superAdmin.email}`);

  // ── Publisher A ─────────────────────────────────────────────────────────────
  const slugA = slugify('Alpha Press');
  const publisherA = await prisma.publisher.upsert({
    where: { slug: slugA },
    update: {},
    create: {
      name: 'Alpha Press',
      slug: slugA,
      status: 'ACTIVE',
      website: 'https://alphapress.localhost',
      description: 'A test publisher for local development.',
      // Local custom-domain simulation: add "127.0.0.1 alphapress.localhost"
      // to /etc/hosts, then set CORS_ORIGINS to include http://alphapress.localhost:5173
      customDomain: 'alphapress.localhost',
    },
  });
  console.log(`  ✔ Publisher A: ${publisherA.name} (slug: ${publisherA.slug})`);

  const ownerA = await prisma.user.upsert({
    where: { email: 'owner-a@publisheros-test.com' },
    update: {},
    create: {
      name: 'Alice Owner',
      email: 'owner-a@publisheros-test.com',
      passwordHash: await hashPw('Owner1234!'),
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      publisherId: publisherA.id,
      publisherRole: 'PUBLISHER_OWNER',
    },
  });
  console.log(`  ✔ Publisher A owner: ${ownerA.email}`);

  const staffA = await prisma.user.upsert({
    where: { email: 'staff-a@publisheros-test.com' },
    update: {},
    create: {
      name: 'Alice Staff',
      email: 'staff-a@publisheros-test.com',
      passwordHash: await hashPw('Staff1234!'),
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      publisherId: publisherA.id,
      publisherRole: 'PUBLISHER_STAFF',
    },
  });
  console.log(`  ✔ Publisher A staff: ${staffA.email}`);

  // ── Publisher B ─────────────────────────────────────────────────────────────
  const slugB = slugify('Beta Books');
  const publisherB = await prisma.publisher.upsert({
    where: { slug: slugB },
    update: {},
    create: {
      name: 'Beta Books',
      slug: slugB,
      status: 'ACTIVE',
      website: 'https://betabooks.localhost',
      description: 'A second test publisher for isolation testing.',
      customDomain: 'betabooks.localhost',
    },
  });
  console.log(`  ✔ Publisher B: ${publisherB.name} (slug: ${publisherB.slug})`);

  const ownerB = await prisma.user.upsert({
    where: { email: 'owner-b@publisheros-test.com' },
    update: {},
    create: {
      name: 'Bob Owner',
      email: 'owner-b@publisheros-test.com',
      passwordHash: await hashPw('Owner1234!'),
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      publisherId: publisherB.id,
      publisherRole: 'PUBLISHER_OWNER',
    },
  });
  console.log(`  ✔ Publisher B owner: ${ownerB.email}`);

  const staffB = await prisma.user.upsert({
    where: { email: 'staff-b@publisheros-test.com' },
    update: {},
    create: {
      name: 'Bob Staff',
      email: 'staff-b@publisheros-test.com',
      passwordHash: await hashPw('Staff1234!'),
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      publisherId: publisherB.id,
      publisherRole: 'PUBLISHER_STAFF',
    },
  });
  console.log(`  ✔ Publisher B staff: ${staffB.email}`);

  console.log('\nSeed complete. Test accounts:');
  console.log('  Super Admin : admin@publisheros.com          / Admin1234!');
  console.log('  Publisher A owner: owner-a@publisheros-test.com / Owner1234!');
  console.log('  Publisher A staff: staff-a@publisheros-test.com / Staff1234!');
  console.log('  Publisher B owner: owner-b@publisheros-test.com / Owner1234!');
  console.log('  Publisher B staff: staff-b@publisheros-test.com / Staff1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
