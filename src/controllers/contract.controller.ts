import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { sendSuccess } from "../utils/response";
import { createError } from "../middleware/errorHandler";

export const getAllContracts = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const contracts = await prisma.contract.findMany({
      orderBy: { startDate: "desc" },
    });

    sendSuccess(res, contracts);
  } catch (error) {
    next(error);
  }
};

export const getActiveContract = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const contract = await prisma.contract.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
    });
    if (!contract) return next(createError("No active contract found", 404));

    const today = new Date();
    const start = new Date(contract.startDate);
    const end = contract.endDate ? new Date(contract.endDate) : null;

    const daysElapsed = Math.floor(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysRemaining = end
      ? Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    sendSuccess(res, { ...contract, daysElapsed, daysRemaining });
  } catch (error) {
    next(error);
  }
};

export const getContract = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
    });
    if (!contract) return next(createError("Contract not found", 404));
    sendSuccess(res, contract);
  } catch (error) {
    next(error);
  }
};

export const createContract = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      jobTitle,
      employer,
      salaryAmount,
      currency,
      startDate,
      endDate,
      note,
    } = req.body;

    if (!jobTitle || !employer || !salaryAmount || !startDate) {
      return next(
        createError(
          "jobTitle, employer, salaryAmount, and startDate are required",
        ),
      );
    }
    if (Number(salaryAmount) <= 0)
      return next(createError("salaryAmount must be positive"));

    await prisma.contract.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const newContract = await prisma.contract.create({
      data: {
        jobTitle,
        employer,
        salaryAmount: Number(salaryAmount),
        currency: currency || "RWF",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        note,
        isActive: true,
      },
    });

    sendSuccess(
      res,
      newContract,
      "Contract created and set as active successfully",
      201,
    );
  } catch (error) {
    next(error);
  }
};

export const updateContract = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      jobTitle,
      employer,
      salaryAmount,
      currency,
      startDate,
      endDate,
      isActive,
      note,
    } = req.body;

    if(isActive === true) {
      await prisma.contract.updateMany({
        where: { isActive: true, NOT: { id: req.params.id } },
        data: { isActive: false },
      });
    }

    const contract = await prisma.contract.update({
      where: { id: req.params.id },
      data: {
        jobTitle,
        employer,
        salaryAmount: salaryAmount || Number(salaryAmount),
        currency,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
        note,
      },
    });
    sendSuccess(res, contract, "Contract updated successfully");
  } catch (error) {
    next(error);
  }
};


export const deleteContract = async (req: Request, res: Response, next:NextFunction) => {
  try {
    await prisma.contract.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, "Contract deleted successfully");
  } catch (error) {
    next(error);
  }
}
