import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../utils/errors/BadRequestError';
import { ConflictError } from '../utils/errors/ConflictError';
import { catchAsync } from '../middleware/errorHandler';
import { UnauthorizedError } from '../utils/errors/UnauthorizedError';
import { NotFoundError } from '../utils/errors/NotFoundError';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email, password, name, phoneNumber} = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            throw new ConflictError('Email is already registered');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phoneNumber
            },
            select: {
                id: true,
                email: true,
                name: true,
                phoneNumber: true,
                createdAt: true,
            }
        });

        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '3h' });

        sendSuccess(res, {user, token} , "User registered successfully", 201);
    } catch (error) {
       next(error);
    }
};

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '3h' });

    sendSuccess(res, { user: { id: user.id, email: user.email, name: user.name, phoneNumber: user.phoneNumber }, token }, "Login successful");
});

export const getCurrentUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            phoneNumber: true,
            password: false,
            createdAt: true,
            updatedAt: true,
        }
    });

    if (!user) {
        throw new NotFoundError('User not found');
    }

    sendSuccess(res, user, "User profile retrieved successfully");
});