import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { sendSuccess, sendPaginated } from "../utils/response";
import { FlowType, TransactionCategory } from "@prisma/client";
import { type } from './../../node_modules/.prisma/client/index.d';
import { createError } from "../middleware/errorHandler";

export const getAllCashFlows = async (req: Request, res: Response, next: NextFunction ) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (req.query.type) where.type = req.query.type;
        if (req.query.walletId) where.walletId = req.query.walletId;
        if (req.query.category) where.category = req.query.category;
        if (req.query.from || req.query.to) {
            where.occuredAt = {
                ...(req.query.from && { gte: new Date(req.query.from as string) }),
                ...(req.query.to && { lte: new Date(req.query.to as string) }),
            };
        }

        const [cashFlows, total] = await Promise.all([
            prisma.cashFlow.findMany({
                where,
                include: {
                    wallet: { select: { id: true, name: true, type: true }},
                    expense: { select: { id: true, title: true }},
                    transportRecharge: { select: { id: true, card: { select: { name: true }}}},
                },
                orderBy: { occuredAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.cashFlow.count({ where }),
        ]);
        sendPaginated(res, cashFlows, total, page, limit);
    } catch (error) {
        next(error);
    }
};


export const getCashFlowSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const from = req.query.from ? new Date(req.query.from as string) : undefined;
        const to = req.query.to ? new Date(req.query.to as string) : undefined;

        const dateFilter = from || to ? { occuredAt: { ...(from && { gte: from }), ...(to && { lte: to })}}: {};

        const [inflow, outflow, byCategory] = await Promise.all([
            prisma.cashFlow.aggregate({
                where: { type: FlowType.INFLOW, ...dateFilter },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.cashFlow.aggregate({
                where: { type: FlowType.OUTFLOW, ...dateFilter },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.cashFlow.groupBy({
                by: ["category", "type"],
                where: dateFilter,
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
    } catch (error) {
        next(error);
    }
};


export const getCashFlow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const flow = await prisma.cashFlow.findUnique({
            where: { id: req.params.id },
            include: {
                wallet: true,
                expense: true,
                transportRecharge: true,
            },
        });
        if (!flow) return next(createError("Cash flow entry not found", 404));
        sendSuccess(res, flow);
    } catch (error) {
        next(error);
    }
};

export const createCashFlow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, amount, category, description, walletId, occurredAt } = req.body;

    if (!type || !amount || !description || !walletId) {
      return next(createError("type, amount, description, and walletId are required"));
    }
    if (!Object.values(FlowType).includes(type)) {
      return next(createError(`type must be INFLOW or OUTFLOW`));
    }
    if (Number(amount) <= 0) return next(createError("amount must be positive"));

    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) return next(createError("Wallet not found", 404));

    // For manual outflows, check balance
    if (type === FlowType.OUTFLOW && Number(wallet.balance) < Number(amount)) {
      return next(
        createError(`Insufficient balance. ${wallet.name} has ${wallet.balance} ${wallet.currency}`)
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
          occurredAt: occurredAt ? new Date(occurredAt) : undefined,
        },
        include: { wallet: { select: { name: true, type: true } } },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance:
            type === FlowType.INFLOW
              ? { increment: Number(amount) }
              : { decrement: Number(amount) },
        },
      });

      return flow;
    });

    sendSuccess(res, result, `Cash ${type.toLowerCase()} recorded and wallet updated`, 201);
  } catch (err) {
    next(err);
  }
};


export const reverseCashFlow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.$transaction(async (tx) => {
      const flow = await tx.cashFlow.findUnique({ where: { id: req.params.id } });
      if (!flow) throw createError("Cash flow entry not found", 404);

      if (flow.expenseId || flow.transportRechargeId) {
        throw createError(
          "Cannot delete auto-generated cash flow. Delete the source expense or recharge instead.",
          400
        );
      }

      // Reverse wallet balance
      await tx.wallet.update({
        where: { id: flow.walletId },
        data: {
          balance:
            flow.type === FlowType.INFLOW
              ? { decrement: Number(flow.amount) }
              : { increment: Number(flow.amount) },
        },
      });

      await tx.cashFlow.delete({ where: { id: req.params.id } });
    });

    sendSuccess(res, null, "Cash flow entry deleted and wallet balance reversed");
  } catch (err) {
    next(err);
  }
};
