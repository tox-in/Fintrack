import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { sendSuccess, sendPaginated } from "../utils/response";
import { createError } from "../middleware/errorHandler";
import { ReceivableDirection, ReceivableStatus, FlowType } from "@prisma/client";

const computeStatus = (paid: number, original: number): ReceivableStatus => {
  if (paid <= 0) return ReceivableStatus.PENDING;
  if (paid >= original) return ReceivableStatus.SETTLED;
  return ReceivableStatus.PARTIAL;
};


export const getAllReceivables = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (req.query.direction) where.direction = req.query.direction;
    if (req.query.status) where.status = req.query.status;
    if (req.query.personName) {
      where.personName = { contains: req.query.personName as string, mode: "insensitive" };
    }

    const [receivables, total] = await Promise.all([
      prisma.receivable.findMany({
        where,
        include: { payments: { orderBy: { paidAt: "desc" } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.receivable.count({ where }),
    ]);

    sendPaginated(res, receivables, total, page, limit);
  } catch (err) {
    next(err);
  }
};


export const getReceivableSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [owedToMe, iOwe, overdue] = await Promise.all([
      // Total others owe me (pending + partial)
      prisma.receivable.aggregate({
        where: {
          direction: ReceivableDirection.THEY_OWE_ME,
          status: { in: [ReceivableStatus.PENDING, ReceivableStatus.PARTIAL] },
        },
        _sum: { remainingAmount: true },
        _count: true,
      }),
      // Total I owe others
      prisma.receivable.aggregate({
        where: {
          direction: ReceivableDirection.I_OWE_THEM,
          status: { in: [ReceivableStatus.PENDING, ReceivableStatus.PARTIAL] },
        },
        _sum: { remainingAmount: true },
        _count: true,
      }),
      // Overdue (past dueDate, not settled)
      prisma.receivable.count({
        where: {
          dueDate: { lt: new Date() },
          status: { in: [ReceivableStatus.PENDING, ReceivableStatus.PARTIAL] },
        },
      }),
    ]);

    sendSuccess(res, {
      totalOwedToMe: owedToMe._sum.remainingAmount || 0,
      owedToMeCount: owedToMe._count,
      totalIOwe: iOwe._sum.remainingAmount || 0,
      iOweCount: iOwe._count,
      overdueCount: overdue,
      netPosition:
        Number(owedToMe._sum.remainingAmount || 0) - Number(iOwe._sum.remainingAmount || 0),
    });
  } catch (err) {
    next(err);
  }
};


export const getReceivable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const receivable = await prisma.receivable.findUnique({
      where: { id: req.params.id },
      include: {
        payments: {
          include: { wallet: { select: { name: true, type: true } } },
          orderBy: { paidAt: "desc" },
        },
      },
    });
    if (!receivable) return next(createError("Receivable not found", 404));
    sendSuccess(res, receivable);
  } catch (err) {
    next(err);
  }
};


export const createReceivable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { personName, phoneNumber, direction, originalAmount, reason, dueDate, note, currency } =
      req.body;

    if (!personName || !direction || !originalAmount || !reason) {
      return next(createError("personName, direction, originalAmount, and reason are required"));
    }
    if (!Object.values(ReceivableDirection).includes(direction)) {
      return next(createError("direction must be THEY_OWE_ME or I_OWE_THEM"));
    }
    if (Number(originalAmount) <= 0) return next(createError("originalAmount must be positive"));

    const receivable = await prisma.receivable.create({
      data: {
        personName,
        phoneNumber,
        direction,
        originalAmount,
        remainingAmount: originalAmount,
        reason,
        dueDate: dueDate ? new Date(dueDate) : null,
        note,
        currency: currency || "RWF",
        status: ReceivableStatus.PENDING,
      },
    });

    sendSuccess(res, receivable, "Receivable created", 201);
  } catch (err) {
    next(err);
  }
};


export const updateReceivable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { personName, phoneNumber, reason, dueDate, note, status } = req.body;

    // Only allow writing off manually; paid amounts are managed via payments
    if (status && !Object.values(ReceivableStatus).includes(status)) {
      return next(createError("Invalid status"));
    }

    const receivable = await prisma.receivable.update({
      where: { id: req.params.id },
      data: {
        personName,
        phoneNumber,
        reason,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        note,
        ...(status === ReceivableStatus.WRITTEN_OFF && { status: ReceivableStatus.WRITTEN_OFF }),
      },
    });

    sendSuccess(res, receivable, "Receivable updated");
  } catch (err) {
    next(err);
  }
};


export const deleteReceivable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Delete payments and cash flows first
    const payments = await prisma.receivablePayment.findMany({
      where: { receivableId: req.params.id },
      include: { cashFlow: true },
    });

    await prisma.$transaction(async (tx) => {
      for (const payment of payments) {
        if (payment.cashFlow) {
          await tx.cashFlow.delete({ where: { id: payment.cashFlow.id } });
        }
        await tx.receivablePayment.delete({ where: { id: payment.id } });
      }
      await tx.receivable.delete({ where: { id: req.params.id } });
    });

    sendSuccess(res, null, "Receivable and all payments deleted");
  } catch (err) {
    next(err);
  }
};


export const recordPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, walletId, note, paidAt } = req.body;

    if (!amount) return next(createError("amount is required"));
    if (Number(amount) <= 0) return next(createError("amount must be positive"));

    const receivable = await prisma.receivable.findUnique({
      where: { id: req.params.id },
    });
    if (!receivable) return next(createError("Receivable not found", 404));
    if (receivable.status === ReceivableStatus.SETTLED) {
      return next(createError("This receivable is already fully settled"));
    }
    if (receivable.status === ReceivableStatus.WRITTEN_OFF) {
      return next(createError("This receivable has been written off"));
    }
    if (Number(amount) > Number(receivable.remainingAmount)) {
      return next(
        createError(
          `Payment of ${amount} exceeds remaining amount of ${receivable.remainingAmount}`
        )
      );
    }

    // If a wallet is involved, validate it
    let wallet = null;
    if (walletId) {
      wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet) return next(createError("Wallet not found", 404));

      // If I_OWE_THEM and I'm paying out → check I have enough
      if (
        receivable.direction === ReceivableDirection.I_OWE_THEM &&
        Number(wallet.balance) < Number(amount)
      ) {
        return next(
          createError(`Insufficient balance. ${wallet.name} has ${wallet.balance} ${wallet.currency}`)
        );
      }
    }

    const newPaid = Number(receivable.paidAmount) + Number(amount);
    const newRemaining = Number(receivable.originalAmount) - newPaid;
    const newStatus = computeStatus(newPaid, Number(receivable.originalAmount));

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.receivablePayment.create({
        data: {
          receivableId: receivable.id,
          amount,
          walletId: walletId || null,
          note,
          paidAt: paidAt ? new Date(paidAt) : undefined,
        },
      });

      // Update receivable totals & status
      await tx.receivable.update({
        where: { id: receivable.id },
        data: {
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newStatus,
        },
      });

      // Update wallet balance and create cash flow if wallet involved
      if (walletId && wallet) {
        // THEY_OWE_ME paying me → money INFLOW into my wallet
        // I_OWE_THEM paying them → money OUTFLOW from my wallet
        const flowType =
          receivable.direction === ReceivableDirection.THEY_OWE_ME
            ? FlowType.INFLOW
            : FlowType.OUTFLOW;

        await tx.wallet.update({
          where: { id: walletId },
          data: {
            balance:
              flowType === FlowType.INFLOW
                ? { increment: Number(amount) }
                : { decrement: Number(amount) },
          },
        });

        await tx.cashFlow.create({
          data: {
            type: flowType,
            amount,
            category: "OTHER",
            description:
              receivable.direction === ReceivableDirection.THEY_OWE_ME
                ? `${receivable.personName} repaid debt`
                : `Paid debt to ${receivable.personName}`,
            walletId,
            receivablePaymentId: payment.id,
            occurredAt: paidAt ? new Date(paidAt) : undefined,
          },
        });
      }

      return { payment, newStatus, newPaid, newRemaining };
    });

    sendSuccess(res, result, "Payment recorded", 201);
  } catch (err) {
    next(err);
  }
};


export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await prisma.receivablePayment.findMany({
      where: { receivableId: req.params.id },
      include: {
        wallet: { select: { name: true, type: true } },
        cashFlow: { select: { type: true } },
      },
      orderBy: { paidAt: "desc" },
    });
    sendSuccess(res, payments);
  } catch (err) {
    next(err);
  }
};