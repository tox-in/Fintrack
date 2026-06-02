import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import prisma from "../utils/prisma";
import { UnauthorizedError } from "../utils/errors/UnauthorizedError";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                name?: string;
            };
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError("No token provided. Please login.");
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new UnauthorizedError('Invalid token format.');
        }

        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
                userId: string;
                email: string;
                iat?: number;
                exp?: number;
            };
        } catch (jwtError) {
            if (jwtError instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedError('Token expired. Please login again.');
            } else if (jwtError instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedError('Invalid token. Please login again.');
            }
            throw new UnauthorizedError('Authentication failed. Please login again.');
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true, email: true, name: true } });
        if (!user) {
            throw new UnauthorizedError('User not found. Please login again.');
        }

        req.user = { id: user.id, email: user.email, name: user.name };
        next();
    } catch (error) {
        next(error);
    }
};

// export const requireRole = (roles: string[]) => {
//     return async (req: Request, res: Response, next: NextFunction) => {
//         try {
//             if (!req.user) {
//                 throw new UnauthorizedError('Authentication required');
//             }

//             // You can extend User model with role if needed
//             // const user = await prisma.user.findUnique({ where: { id: req.user.id } });
//             // if (!roles.includes(user.role)) {
//             //     throw new ForbiddenError('Insufficient permissions');
//             // }
            
//             next();
//         } catch (error) {
//             next(error);
//         }
//     };
// };