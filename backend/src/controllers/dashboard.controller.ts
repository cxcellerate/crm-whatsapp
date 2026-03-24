import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export async function getDashboardStats(_req: AuthRequest, res: Response) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [
    totalLeads,
    leadsThisMonth,
    leadsThisWeek,
    leadsBySource,
    leadsByStage,
    recentMessages,
    totalValue,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.lead.count({ where: { createdAt: { gte: weekStart, lte: weekEnd } } }),
    prisma.lead.groupBy({ by: ['source'], _count: { _all: true } }),
    prisma.lead.groupBy({
      by: ['stageId'],
      _count: { _all: true },
      _sum: { value: true },
    }),
    prisma.message.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.lead.aggregate({ _sum: { value: true } }),
  ]);

  res.json({
    totalLeads,
    leadsThisMonth,
    leadsThisWeek,
    totalValue: totalValue._sum.value || 0,
    leadsBySource,
    leadsByStage,
    recentMessages,
  });
}
