import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
    public statusCode?: number;
    public isOperational?: boolean;
    public errors?: any[];

    constructor(message: string) {
        super(message);
        this.name = 'AppError';
        this.statusCode = 500;
        this.isOperational = true;
    }
}

export const errorHandler = (
    err: AppError | Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        handlePrismaError(err, res);
        return;
    }

    const statusCode = err instanceof AppError ? (err.statusCode || 500) : 500;
    const message = err.message || "Internal Server Error";

    if (statusCode >= 500) {
        console.error(`[ERROR] ${statusCode} - ${message}`);
        if (process.env.NODE_ENV === "development") {
            console.error(err.stack);
        }
    } else {
        console.warn(`[WARN] ${statusCode} - ${message}`);
    }

    const response: any = {
        success: false,
        message,
        statusCode,
    };

    if (err instanceof AppError && err.errors && err.errors.length > 0) {
        response.errors = err.errors;
    }

    if (process.env.NODE_ENV === "development" && err.stack) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

function handlePrismaError(err: Prisma.PrismaClientKnownRequestError, res: Response) {
    let statusCode = 500;
    let message = "Database operation failed";

    switch (err.code) {
        case 'P2002':
            statusCode = 409;
            const target = err.meta?.target as string[];
            message = `A record with this ${target?.join(', ')} already exists`;
            break;
        case 'P2003':
            statusCode = 400;
            message = "Related record not found";
            break;
        case 'P2025':
            statusCode = 404;
            message = "Record not found";
            break;
        case 'P2016':
            statusCode = 400;
            message = "Invalid query format";
            break;
    }

    res.status(statusCode).json({
        success: false,
        message,
        statusCode,
        code: err.code,
        ...(process.env.NODE_ENV === "development" && { meta: err.meta })
    });
}

export const createError = (message: string, statusCode = 400): AppError => {
    const error = new AppError(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};

export const catchAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};