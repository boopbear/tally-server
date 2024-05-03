import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Prisma, Role, User } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../server";
import * as OTPAuth from "otpauth";
import { RES_STATUS, PAGINATION, qrMessage, EXPIRATION, SIGNER_EMAIL } from "../constants";

const GetDepartments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string);
        const size = parseInt(req.query.size as string);
        const departmentName = req.query.departmentName as string;
        const archived = req.query.active as string === "false";

        const departmentNameSearch = departmentName && departmentName !== "undefined" ? departmentName : '';
        const skip = ((page || PAGINATION.default.page) - 1) * (size || PAGINATION.default.size);
        const finalSize = size || PAGINATION.default.size;

        const departments = await prisma.department.findMany({
            where: {
                isArchived: archived,
                isHidden: false,
                name: {
                    contains: departmentNameSearch
                }
            },
            // ...(page && size ? { skip, take: finalSize } : {})
        });

        if (!departments) {
            return res.status(404).json({
                status: RES_STATUS.fail,
                message: "No information found",
            });
        }

        return res.status(200).json({
            status: RES_STATUS.success,
            departments
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const CreateDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const name = req.body.name as string;
        const location = req.body.location as string;

        await prisma.department.create({
            data: {
                name,
                location
            },
        });

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Created a new department successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const UpdateDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.departmentId);
        const name = req.body.name as string;
        const location = req.body.location as string;

        await prisma.department.update({
            where: {
                id
            },
            data: {
                name,
                location
            },
        });

        return res.status(200).json({
            status: RES_STATUS.success,
            message: "Item details has been updated"
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const ArchiveDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.departmentId);

        await prisma.department.update({
            where: {
                id
            },
            data: {
                isArchived: true
            },
        });

        return res.status(200).json({
            status: RES_STATUS.success,
            message: "Item has been archived"
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const UnarchiveDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.departmentId);

        await prisma.department.update({
            where: {
                id
            },
            data: {
                isArchived: false
            },
        });

        return res.status(200).json({
            status: RES_STATUS.success,
            message: "Item has been enabled"
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const HideDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.departmentId);

        await prisma.department.update({
            where: {
                id
            },
            data: {
                isArchived: true,
                isHidden: true
            },
        });

        return res.status(200).json({
            status: RES_STATUS.success,
            message: "Item has been removed"
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

export default {
    GetDepartments,
    CreateDepartment,
    UpdateDepartment,
    ArchiveDepartment,
    UnarchiveDepartment,
    HideDepartment
};
