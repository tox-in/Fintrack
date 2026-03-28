import { Response } from "express";

export const sendSuccess = <T> (
    res: Response,
    data: T,
    message = "Success",
    statusCode = 200
): void => {
    res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

export const sendPaginated = <T> (
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number
) : void => {
    res.status(200).json({
        success: true,
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
};