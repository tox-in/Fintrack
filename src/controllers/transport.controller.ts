import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { sendPaginated, sendSuccess } from "../utils/response";
import { createError } from "../middleware/errorHandler";

export const getAllCards = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;
  if (!userId) return next(createError("Unauthorized", 401));

  try {
    const cards = await prisma.transportCard.findMany({
      where: { userId },
      include: {
        _count: { select: { usages: true, recharges: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    sendSuccess(res, cards);
  } catch (error) {
    next(error);
  }
};

export const getCard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;
  if (!userId) return next(createError("Unauthorized", 401));

  try {
    const card = await prisma.transportCard.findFirst({
      where: { id: req.params.id, userId },
      include: {
        usages: {
          orderBy: { usedAt: "desc" },
          take: 10,
          include: { wallet: { select: { name: true, type: true } } },
        },
      },
    });
    if (!card) return next(createError("Card not found", 404));
    sendSuccess(res, card);
  } catch (error) {
    next(error);
  }
};

export const createCard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;
  if (!userId) return next(createError("Unauthorized", 401));

  try {
    const { name, balance } = req.body;
    const card = await prisma.transportCard.create({
      data: { userId, name: name || "Transport Card", balance: balance || 0 },
    });
    sendSuccess(res, card, "Transport card created", 201);
  } catch (error) {
    next(error);
  }
};

export const getAllUsages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;
  if (!userId) return next(createError("Unauthorized", 401));

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { card: { userId } };
    if (req.query.cardId) where.cardId = req.query.cardId;
    if (req.query.from || req.query.to) {
      where.usedAt = {
        ...(req.query.from && { gte: new Date(req.query.from as string) }),
        ...(req.query.to && { lte: new Date(req.query.to as string) }),
      };
    }

    const [usages, total] = await Promise.all([
      prisma.transportUsage.findMany({
        where,
        include: { card: { select: { id: true, name: true } } },
        orderBy: { usedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transportUsage.count({ where }),
    ]);

    sendPaginated(res, usages, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const recordUsage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;
  if (!userId) return next(createError("Unauthorized", 401));

  try {
    const { cardId, amount, route, note, usedAt } = req.body;

    if (!cardId || !amount)
      return next(createError("cardId and amount are required"));
    if (Number(amount) <= 0)
      return next(createError("amount must be positive"));

    const card = await prisma.transportCard.findFirst({ where: { id: cardId, userId } });
    if (!card) return next(createError("Card not found", 404));
    if (Number(card.balance) < Number(amount)) {
      return next(createError(`Insufficient card balance. Card has ${card.balance} RWF. Please recharge.`));
    }

    const result = await prisma.$transaction(async (tx) => {
      const usage = await tx.transportUsage.create({
        data: {
          cardId,
          amount,
          route,
          note,
          usedAt: usedAt ? new Date(usedAt) : new Date(),
        },
        include: { card: true },
      });

      await tx.transportCard.update({
        where: { id: cardId },
        data: { balance: { decrement: Number(amount) } },
      });

      return usage;
    });

    sendSuccess(res, result, "Transport usage recorded", 201);
  } catch (error) {
    next(error);
  }
};


export const getAllRecharges = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return next(createError("Unauthorized", 401));

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where = { card: { userId } };

    const [recharges, total] = await Promise.all([
      prisma.transportRecharge.findMany({
        where,
        include: {
          card: { select: { id: true, name: true } },
          wallet: { select: { id: true, name: true, type: true } },
        },
        orderBy: { rechargedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transportRecharge.count({ where }),
    ]);

    sendPaginated(res, recharges, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const recordRecharge = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return next(createError("Unauthorized", 401));

  try {
    const { cardId, walletId, amount, note, rechargedAt } = req.body;

    if (!cardId || !walletId || !amount) {
      return next(createError("cardId, walletId and amount are required"));
    }
    if (Number(amount) <= 0) return next(createError("amount must be positive"));

    const [card, wallet] = await Promise.all([
      prisma.transportCard.findFirst({ where: { id: cardId, userId } }),
      prisma.wallet.findFirst({ where: { id: walletId, userId } }),
    ]);

    if (!card) return next(createError("Card not found", 404));
    if (!wallet) return next(createError("Wallet not found", 404));
    if (Number(wallet.balance) < Number(amount)) {
      return next(createError(`Insufficient wallet balance. Wallet ${wallet.name} has ${wallet.balance} ${wallet.currency}.`));
    }

    const result = await prisma.$transaction(async (tx) => {
      const recharge = await tx.transportRecharge.create({
        data: {
          cardId,
          walletId,
          amount,
          note,
          rechargedAt: rechargedAt ? new Date(rechargedAt) : new Date(),
        },
        include: {
          card: true,
          wallet: { select: { name: true, type: true } },
        },
      });

      await tx.transportCard.update({
        where: { id: cardId },
        data: { balance: { increment: Number(amount) } },
      });

      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: Number(amount) } },
      });

      await tx.cashFlow.create({
        data: {
          type: "OUTFLOW",
          amount,
          category: "RECHARGE",
          description: `Transport card recharge - ${card.name}`,
          walletId,
          userId,
          transportRechargeId: recharge.id,
          occurredAt: rechargedAt ? new Date(rechargedAt) : new Date(),
        },
      });
      return recharge;
    });

    sendSuccess(res, result, "Transport card recharged, wallet updated, and cash flow logged", 201);
  } catch (error) {
    next(error);
  }
};


export const getTransportStats = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return next(createError("Unauthorized", 401));

  try {
    const [usageAgg, rechargeAgg, cards] = await Promise.all([
      prisma.transportUsage.aggregate({
        where: { card: { userId } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transportRecharge.aggregate({
        where: { card: { userId } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transportCard.findMany({ where: { userId }, select: { name: true, balance: true } }),
    ]);
    sendSuccess(res, {
      totalSpent: usageAgg._sum.amount || 0,
      totalTrips: usageAgg._count,
      totalRecharged: rechargeAgg._sum.amount || 0,
      totalRecharges: rechargeAgg._count,
      cards,
    });
  } catch (error) {
    next(error);
  }
};