import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { sendPaginated, sendSuccess } from "../utils/response";
import { createError } from "../middleware/errorHandler";

export const getAllWastedMoney = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            prisma.wastedMoney.findMany({
                orderBy: { wastedAt: "desc" },
                skip,
                take: limit
            }),
            prisma.wastedMoney.count()
        ]);

        const totalWasted = await prisma.wastedMoney.aggregate({
            _sum: { amount: true }
        });

        sendPaginated(res, records, total, page, limit);
    } catch (error) {
        next(error);
    }
};


export const getWastedStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const agg = await prisma.wastedMoney.aggregate({
            _sum: { amount: true },
            _avg: { amount: true },
            _count: true,
        });

        sendSuccess(res, {
            totalWasted: agg._sum.amount || 0,
            averageWasted: agg._avg.amount || 0,
            occurences: agg._count,
        });
    } catch (error) {
        next(error);
    }
};


export const getWastedMoneyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const record = await prisma.wastedMoney.findUnique({ where: { id: req.params.id } });
        if(!record) return next(createError("Record not found", 404));
        sendSuccess(res, record);
    } catch (error) {
        next(error);
    }
};

export const createWastedMoney = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { amount, reason, keyTakeaway, wastedAt } = req.body;

        if(!amount || !reason || !keyTakeaway) {
            return next(createError("Amount, reason and key takeaway are required", 400));
        }
        if(Number(amount) <= 0) return next(createError("amount must be positive"));

        const record = await prisma.wastedMoney.create({
            data: { amount, reason, keyTakeaway, wastedAt: wastedAt ? new Date(wastedAt) : new Date()},
        });

        sendSuccess(res, record, "Wated money entry logged", 201);
    } catch (error) {
        next(error);
    }
};

 export const updateWastedMoney = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { amount, reason, keyTakeaway, wastedAt } = req.body;

        const record = await prisma.wastedMoney.update({
            where: { id: req.params.id },
            data: { amount, reason, keyTakeaway, wastedAt: wastedAt ? new Date(wastedAt) : undefined },
        });
        sendSuccess(res, record, "Wasted money entry updated");
    } catch (error) {
        next(error);
    }
 }

 export const deleteWastedMoney = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.wastedMoney.delete({ where: { id: req.params.id } });
        sendSuccess(res, null, "Wasted money entry deleted");
    } catch (error) {
        next(error);
    }
 }