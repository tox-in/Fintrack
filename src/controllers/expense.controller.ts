import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { sendPaginated, sendSuccess } from "../utils/response";
import { createError } from "./../middleware/errorHandler";
import { TransactionCategory } from "@prisma/client";

export const getAllExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (req.query.walletId) where.walletId = req.query.walletId;
    if (req.query.category) where.category = req.query.category;
    if (req.query.from || req.query.to) {
      where.spentAt = {
        ...(req.query.from && { gte: new Date(req.query.from as string) }),
        ...(req.query.to && { lte: new Date(req.query.to as string) }),
      };
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { wallet: { select: { id: true, name: true, type: true } } },
        orderBy: { spentAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    sendPaginated(res, expenses, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const getDailySummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const date = req.query.date
      ? new Date(req.query.date as string)
      : new Date();
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const expenses = await prisma.expense.findMany({
      where: { spentAt: { gte: startOfDay, lte: endOfDay } },
      include: { wallet: { select: { name: true, type: true } } },
      orderBy: { spentAt: "asc" },
    });

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const byCategory = expenses.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    sendSuccess(res, { date: startOfDay, total, byCategory, expenses });
  } catch (error) {
    next(error);
  }
};

export const getExpense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: { wallet: true, cashFlow: true },
    });

    if (!expense) return next(createError("Expense not found", 404));
    sendSuccess(res, expense);
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { title, amount, category, walletId, note, spentAt } = req.body;

    if (!title || !amount || !walletId) {
      return next(createError("Title, amount, and walletId are required"));
    }
    if (Number(amount) <= 0)
      return next(createError("amount must be positive"));

    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) return next(createError("Wallet not found", 404));
    if (Number(wallet.balance) < Number(amount)) {
      return next(
        createError(
          `Insufficient balance. Wallet has ${wallet.balance} ${wallet.currency}`,
        ),
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          title,
          amount,
          category: category || TransactionCategory.OTHER,
          walletId,
          note,
          spentAt: spentAt ? new Date(spentAt) : new Date(),
        },
        include: { wallet: true },
      });

      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: amount } },
      });

      await tx.cashFlow.create({
        data: {
          type: "OUTFLOW",
          amount,
          category: category || TransactionCategory.OTHER,
          description: `Expense: ${title}`,
          walletId,
          occurredAt: spentAt ? new Date(spentAt) : new Date(),
        },
      });

      return expense;
    });

    sendSuccess(res, result, "Expense recorded and wallet updated", 201);
  } catch (error) {
    next(error);
  }
};

export const reverseExpense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({
        where: { id: req.params.id },
        include: { wallet: true, cashFlow: true },
      });

      if (!expense) return next(createError("Expense not found", 404));

      await tx.wallet.update({
        where: { id: expense.walletId },
        data: { balance: { increment: Number(expense.amount) } },
      });

      if (expense.cashFlow) {
        await tx.cashFlow.delete({ where: { id: expense.cashFlow.id } });
      }

      await tx.expense.delete({ where: { id: req.params.id } });
    });

    sendSuccess(res, null, "Expense reversed and wallet balance restored");
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
    await prisma.expense.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, "Expense deleted");
}
