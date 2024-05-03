import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../server";
import { RES_STATUS } from "../constants";

export const verifyLoginToken = (req: Request, res: Response, next: NextFunction) => {
    const authcookie = req.cookies.authcookie;

    try {
        if (!process.env.API_LOGIN_SECRET) {
            return res.status(500).json({
                status: "fail",
                message: "Missing environment variable",
            });
        }

        if (authcookie !== undefined && authcookie != null) {
            jwt.verify(authcookie, process.env.API_LOGIN_SECRET, async (error: any, data: any) => {
                if (error || !data) {
                    return res.status(403).json({
                        status: "fail",
                        message: "Unauthorized cookie",
                        error
                    });
                }

                const user = await prisma.user.findFirst({
                    select: {
                        id: true,
                        email: true
                    },
                    where: {
                        sharedId: data,
                        isArchived: false
                    }
                });

                if (!user) {
                    return res.status(404).json({
                        status: RES_STATUS.fail,
                        message: "User does not exists",
                    });
                }

                res.locals.userId = user.id;
                res.locals.sharedId = data;
                res.locals.email = user.email;

                next();
            })
        } else {
            return res.status(403).json({
                status: "fail",
                message: "Missing credentials",
            });
        }
    } catch (error: any) {
        return res.status(401).json({
            status: "error",
            message: "Server error",
            error
        });
    }
}

export const verifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
    // const bearerHeader = req.headers['authorization'];
    const authcookie = req.cookies.authcookie;

    try {
        if (!process.env.API_ACCESS_SECRET) {
            return res.status(500).json({
                status: "fail",
                message: "Missing environment variable",
            });
        }

        if (authcookie !== undefined && authcookie != null) {
            // const bearer = bearerHeader.split(' ');
            // const bearerToken = bearer[1];

            jwt.verify(authcookie, process.env.API_ACCESS_SECRET, async (error: any, data: any) => {
                if (error || !data) {
                    return res.status(403).json({
                        status: "fail",
                        message: "Unauthorized cookie",
                        error
                    });
                }

                const user = await prisma.user.findFirst({
                    select: {
                        id: true,
                        email: true,
                        role: true
                    },
                    where: {
                        sharedId: data,
                        isArchived: false
                    }
                });

                if (!user) {
                    return res.status(404).json({
                        status: RES_STATUS.fail,
                        message: "User does not exists",
                    });
                }

                res.locals.userId = user.id;
                res.locals.sharedId = data;
                res.locals.email = user.email;
                res.locals.role = user.role;

                next();
            })
        } else {
            return res.status(403).json({
                status: "fail",
                message: "Missing credentials",
            });
        }
    } catch (error: any) {
        return res.status(401).json({
            status: "error",
            message: "Server error",
            error
        });
    }
}