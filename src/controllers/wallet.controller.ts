import { NextFunction, Request, Response } from "express";
import prisma from "../utils/prisma";
import { sendSuccess } from "../utils/response";
import { createError } from "../middleware/errorHandler";
import { WalletType } from "@prisma/client";

export const getAllWallets = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    sendSuccess(res, wallets);
  } catch (err) {}
};

export const getWallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const wallet = await prisma.wallet.findUnique({
            where: { id: req.params.id },
            include: {
                expenses: { take: 10, orderBy: {spentAt:"desc"}},
                cashFlows: { take: 10, orderBy: {occuredAt: "desc"}},
            },
        });
        if (!wallet) return next(createError("Wallet not found", 404));
        sendSuccess(res, wallet);
    } catch (err) {
        next(err);
    }
};

export const getWalletSummary = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const wallets = await prisma.wallet.findMany({ where: { isActive: true } });

        const summary = {
            total: wallets.reduce((sum, w) => sum + Number(w.balance), 0),
            byType: {} as Record<WalletType, number>,
        };

        for ( const type of Object.values(WalletType)) {
            summary.byType[type] = wallets
            .filter((w) => w.type === type)
            .reduce((sum, w) => sum + Number(w.balance), 0);
        }

        sendSuccess(res, {wallets, summary});
    } catch (err) {
        next(err);
    }
};

export const createWallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, type, balance, currency, description } = req.body;

        if (!name || !type) return next(createError("name and type are required"));
        if(!Object.values(WalletType).includes(type)){
            return next(createError(`type must be one of: ${Object.values(WalletType). join(",")}`));
        }

        const wallet = await prisma.wallet.create({
            data: { name, type, balance: balance || 0, currency: currency || "RWF", description },
        });

        sendSuccess(res, WalletType, "Wallet created", 201);
    } catch (err) {
        next(err);
    }
};


export const updateWallet = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const {name, description, isActive, currency} = req.body;

        const wallet = await prisma.wallet.update({
            where: { id: req.params.id },
            data: { name, description, isActive, currency },
        });

        sendSuccess(res, wallet, "Wallet updated");
    } catch (err) {
        next(err);
    }
}

export const deleteWallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.wallet.update({
            where: { id: req.params.id },
            data: { isActive: false },
        });
        sendSuccess(res, null, "Wallet deactivated");
    } catch (err) {
        next(err);
    }
}