import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { sendSuccess, sendPaginated } from "../utils/response";
import { FlowType, TransactionCategory } from "@prisma/client";
import { catchAsync, createError } from "../middleware/errorHandler";

export const getAllCashFlows = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) return next(createError("Unauthorized", 401));

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: userId };
    if (req.query.type) where.type = req.query.type;
    if (req.query.walletId) where.walletId = req.query.walletId;
    if (req.query.category) where.category = req.query.category;
    if (req.query.from || req.query.to) {
      where.occurredAt = {
        ...(req.query.from && { gte: new Date(req.query.from as string) }),
        ...(req.query.to && { lte: new Date(req.query.to as string) }),
      };
    }

    const [cashFlows, total] = await Promise.all([
      prisma.cashFlow.findMany({
        where,
        include: {
          wallet: { select: { id: true, name: true, type: true } },
          expense: { select: { id: true, title: true } },
          transportRecharge: {
            select: { id: true, card: { select: { name: true } } },
          },
        },
        orderBy: { occurredAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.cashFlow.count({ where }),
    ]);
    sendPaginated(res, cashFlows, total, page, limit);
  },
);

export const getCashFlowSummary = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id;

      if (!userId) return next(createError("Unauthorized", 401));

      const from = req.query.from
        ? new Date(req.query.from as string)
        : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;

      const dateFilter =
        from || to
          ? {
              occurredAt: {
                ...(from && { gte: from }),
                ...(to && { lte: to }),
              },
            }
          : {};

      const [inflow, outflow, byCategory] = await Promise.all([
        prisma.cashFlow.aggregate({
          where: {
            userId: userId,
            type: FlowType.INFLOW,
            ...dateFilter,
          },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.cashFlow.aggregate({
          where: {
            userId: userId,
            type: FlowType.OUTFLOW,
            ...dateFilter,
          },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.cashFlow.groupBy({
          by: ["category", "type"],
          where: {
            userId: userId,
            ...dateFilter,
          },
          _sum: { amount: true },
          _count: true,
          orderBy: { _sum: { amount: "desc" } },
        }),
      ]);

      const totalInflow = Number(inflow._sum.amount || 0);
      const totalOutflow = Number(outflow._sum.amount || 0);
      const netBalance = totalInflow - totalOutflow;

      sendSuccess(res, {
        totalInflow,
        totalOutflow,
        netBalance,
        inflowCount: inflow._count,
        outflowCount: outflow._count,
        byCategory,
      });
  },
);

export const getCashFlow = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
    const userId = req.user?.id;

    if (!userId) return next(createError("Unauthorized", 401));
    const flow = await prisma.cashFlow.findFirst({
      where: { id: req.params.id, userId: userId },
      include: {
        wallet: true,
        expense: true,
        transportRecharge: true,
      },
    });
    if (!flow) return next(createError("Cash flow entry not found", 404));
    sendSuccess(res, flow);
});

export const createCashFlow = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;

  if (!userId) return next(createError("Unauthorized", 401));
    const { type, amount, category, description, walletId, occurredAt } =
      req.body;

    if (!type || !amount || !description || !walletId) {
      return next(
        createError("type, amount, description, and walletId are required"),
      );
    }
    if (!Object.values(FlowType).includes(type)) {
      return next(createError(`type must be INFLOW or OUTFLOW`));
    }
    if (Number(amount) <= 0)
      return next(createError("amount must be positive"));

    const wallet = await prisma.wallet.findFirst({ where: { id: walletId, userId: userId } });
    if (!wallet) return next(createError("Wallet not found", 404));

    // For manual outflows, check balance
    if (type === FlowType.OUTFLOW && Number(wallet.balance) < Number(amount)) {
      return next(
        createError(
          `Insufficient balance. ${wallet.name} has ${wallet.balance} ${wallet.currency}`,
        ),
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const flow = await tx.cashFlow.create({
        data: {
          type,
          amount,
          category: category || TransactionCategory.OTHER,
          description,
          walletId,
          userId: userId,
          occurredAt: occurredAt ? new Date(occurredAt) : undefined,
        },
        include: { wallet: { select: { name: true, type: true } } },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: walletId, userId: userId },
        data: {
          balance:
            type === FlowType.INFLOW
              ? { increment: Number(amount) }
              : { decrement: Number(amount) },
        },
      });

      return flow;
    });

    sendSuccess(
      res,
      result,
      `Cash ${type.toLowerCase()} recorded and wallet updated`,
      201,
    );
});

export const reverseCashFlow = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
const userId = req.user?.id;

if (!userId) return next(createError("Unauthorized", 401));
  
    await prisma.$transaction(async (tx) => {
      const flow = await tx.cashFlow.findFirst({
        where: { id: req.params.id, userId:userId },
      });
      if (!flow) throw createError("Cash flow entry not found", 404);

      if (flow.expenseId || flow.transportRechargeId) {
        throw createError(
          "Cannot delete auto-generated cash flow. Delete the source expense or recharge instead.",
          400,
        );
      }

      // Reverse wallet balance
      await tx.wallet.update({
        where: { id: flow.walletId, userId: userId },
        data: {
          balance:
            flow.type === FlowType.INFLOW
              ? { decrement: Number(flow.amount) }
              : { increment: Number(flow.amount) },
        },
      });

      await tx.cashFlow.delete({ where: { id: req.params.id } });
    });

    sendSuccess(
      res,
      null,
      "Cash flow entry deleted and wallet balance reversed",
    );
});
