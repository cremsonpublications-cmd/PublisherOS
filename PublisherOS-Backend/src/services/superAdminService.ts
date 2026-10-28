/**
 * Super-admin service.
 *
 * Platform-wide management: stats, publisher listing, user listing, audit logs.
 */

import { prisma } from '../db';
import { NotFoundError } from '../lib/errors';
import type { PublisherStatus } from '@prisma/client';

const DEFAULT_PAGE_SIZE = 20;

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getStats() {
  const [
    totalPublishers,
    activePublishers,
    suspendedPublishers,
    totalUsers,
    recentLoginEvents,
    recentFailedLogins,
  ] = await Promise.all([
    prisma.publisher.count(),
    prisma.publisher.count({ where: { status: 'ACTIVE' } }),
    prisma.publisher.count({ where: { status: 'SUSPENDED' } }),
    prisma.user.count(),
    prisma.auditEvent.findMany({
      where: { event: 'auth.login_success' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.auditEvent.findMany({
      where: { event: 'auth.login_failure' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return {
    totalPublishers,
    activePublishers,
    suspendedPublishers,
    totalUsers,
    recentLoginEvents,
    recentFailedLogins,
  };
}

// ── Publishers ────────────────────────────────────────────────────────────────

export async function listPublishers(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const skip = (page - 1) * pageSize;

  const [total, publishers] = await Promise.all([
    prisma.publisher.count(),
    prisma.publisher.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true } },
      },
    }),
  ]);

  return { publishers, total, page, pageSize };
}

export async function getPublisherDetails(publisherId: string) {
  const publisher = await prisma.publisher.findUnique({
    where: { id: publisherId },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          publisherRole: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!publisher) {
    throw new NotFoundError('Publisher not found');
  }

  return publisher;
}

export async function setPublisherStatus(publisherId: string, status: PublisherStatus) {
  const publisher = await prisma.publisher.findUnique({
    where: { id: publisherId },
    select: { id: true },
  });

  if (!publisher) {
    throw new NotFoundError('Publisher not found');
  }

  return prisma.publisher.update({
    where: { id: publisherId },
    data: { status },
  });
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function listUsers(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const skip = (page - 1) * pageSize;

  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        systemRole: true,
        publisherRole: true,
        publisherId: true,
        createdAt: true,
        publisher: {
          select: { name: true },
        },
      },
    }),
  ]);

  return { users, total, page, pageSize };
}

// ── Audit Events ──────────────────────────────────────────────────────────────

export async function listAuditEvents(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const skip = (page - 1) * pageSize;

  const [total, events] = await Promise.all([
    prisma.auditEvent.count(),
    prisma.auditEvent.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
        publisher: {
          select: { name: true },
        },
      },
    }),
  ]);

  return { events, total, page, pageSize };
}
