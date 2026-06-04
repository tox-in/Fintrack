import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { sendSuccess } from "../utils/response";
import { catchAsync, createError } from "../middleware/errorHandler";

export const getAllContracts = catchAsync(
  async (_req: Request, res: Response, next: NextFunction) => {
    const userId = _req.user?.id;

    if (!userId) return next(createError("Unauthorized", 401));

    const contracts = await prisma.contract.findMany({
      where: { userId: userId },
      orderBy: { startDate: "desc" },
    });

    sendSuccess(res, contracts);
  },
);

export const getActiveContract = catchAsync(
  async (_req: Request, res: Response, next: NextFunction) => {
    const userId = _req.user?.id;

    if (!userId) return next(createError("Unauthorized", 401));

    const contract = await prisma.contract.findFirst({
      where: { isActive: true, userId: userId },
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
  },
);

export const getContract = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) return next(createError("Unauthorized", 401));
    const contract = await prisma.contract.findFirst({
      where: { id: req.params.id, userId: userId },
    });
    if (!contract) return next(createError("Contract not found", 404));
    sendSuccess(res, contract);
  },
);

export const createContract = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) return next(createError("Unauthorized", 401));

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

    //Deactivate any existing active contracts
    await prisma.contract.updateMany({
      where: { isActive: true, userId: userId },
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
        userId: userId,
      },
    });

    sendSuccess(
      res,
      newContract,
      "Contract created and set as active successfully",
      201,
    );
  },
);

export const updateContract = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return next(createError("Unauthorized", 401));

    const existingContract = await prisma.contract.findFirst({
      where: { id, userId },
    });

    if (!existingContract) return next(createError("Contract not found", 404));

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

    if (isActive === true) {
      await prisma.contract.updateMany({
        where: { isActive: true, userId: userId, NOT: { id: req.params.id } },
        data: { isActive: false },
      });
    }

    const updateData: any = {};
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (employer !== undefined) updateData.employer = employer;
    if (salaryAmount !== undefined)
      updateData.salaryAmount = Number(salaryAmount);
    if (currency !== undefined) updateData.currency = currency;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined)
      updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (note !== undefined) updateData.note = note;

    const contract = await prisma.contract.update({
      where: { id: req.params.id },
      data: updateData,
    });
    sendSuccess(res, contract, "Contract updated successfully");
  },
);

export const deleteContract = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return next(createError("Unauthorized", 401));

    const existingContract = await prisma.contract.findFirst({
      where: { id: id, userId: userId },
    });

    if (!existingContract) {
      return next(createError("Contract not found", 404));
    }

    await prisma.contract.delete({ 
      where: { id: id } 
    });
    sendSuccess(res, null, "Contract deleted successfully");
  },
);


export const getContractStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) return next(createError("Unauthorized", 401));

    const stats = await prisma.contract.aggregate({
      where: { userId },
      _count: { id: true },
      _avg: { salaryAmount: true },
      _max: { salaryAmount: true },
      _min: { salaryAmount: true },
    });

    const activeContract = await prisma.contract.findFirst({
      where: { userId, isActive: true },
    });

    sendSuccess(res, {
      totalContracts: stats._count.id,
      averageSalary: stats._avg.salaryAmount,
      maxSalary: stats._max.salaryAmount,
      minSalary: stats._min.salaryAmount,
      activeContract: activeContract || null,
    });
  },
);