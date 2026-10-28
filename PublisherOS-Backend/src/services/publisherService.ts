/**
 * Publisher service.
 *
 * Manages publisher details, staff, and invitations.
 */

import argon2 from 'argon2';
import { prisma } from '../db';
import { NotFoundError, ConflictError } from '../lib/errors';

// ── Publisher ─────────────────────────────────────────────────────────────────

export async function getPublisher(publisherId: string) {
  const publisher = await prisma.publisher.findUnique({
    where: { id: publisherId },
  });

  if (!publisher) {
    throw new NotFoundError('Publisher not found');
  }

  return publisher;
}

export async function updatePublisher(
  publisherId: string,
  input: { name?: string; website?: string | null; description?: string | null },
) {
  const publisher = await prisma.publisher.update({
    where: { id: publisherId },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.website !== undefined && { website: input.website }),
      ...(input.description !== undefined && { description: input.description }),
    },
  });

  return publisher;
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export async function getStaff(publisherId: string) {
  const staff = await prisma.user.findMany({
    where: {
      publisherId,
      publisherRole: 'PUBLISHER_STAFF',
    },
    select: {
      id: true,
      name: true,
      email: true,
      publisherRole: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return staff;
}

export async function createStaff(
  publisherId: string,
  input: { name: string; email: string; password: string },
) {
  const normalizedEmail = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError('A user with this email already exists');
  }

  const passwordHash = await argon2.hash(input.password);

  const staff = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      publisherId,
      publisherRole: 'PUBLISHER_STAFF',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      publisherRole: true,
      status: true,
      createdAt: true,
    },
  });

  return staff;
}

// ── Custom domain ─────────────────────────────────────────────────────────────

export async function setCustomDomain(publisherId: string, domain: string | null) {
  if (domain !== null) {
    const normalized = domain.toLowerCase().trim();

    // Check uniqueness — another publisher may already own this domain
    const existing = await prisma.publisher.findFirst({
      where: { customDomain: normalized, NOT: { id: publisherId } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictError('This domain is already in use by another publisher');
    }

    return prisma.publisher.update({
      where: { id: publisherId },
      data: { customDomain: normalized, customDomainVerifiedAt: null },
    });
  }

  // null → clear the domain
  return prisma.publisher.update({
    where: { id: publisherId },
    data: { customDomain: null, customDomainVerifiedAt: null },
  });
}

export async function removeStaff(publisherId: string, targetUserId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      publisherId,
      publisherRole: 'PUBLISHER_STAFF',
    },
    select: { id: true },
  });

  if (!user) {
    throw new NotFoundError('Staff member not found');
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { status: 'SUSPENDED' },
  });
}
