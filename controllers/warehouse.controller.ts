import { Request, Response, NextFunction } from "express";
import { prisma } from "../server";
import { RES_STATUS } from "../constants";

const GetWarehouseItemCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await prisma.warehouseItemCategory.findMany();

        return res.status(200).json({
            status: RES_STATUS.success,
            categories
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const GetWarehouseItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categoryId = parseInt(req.query.categoryId as string) || 0;
        const itemCode = req.query.itemCode as string;
        const sortBy = req.query.sortBy as string;
        const archived = req.query.active as string === "false";

        const itemCodeSearch = itemCode && itemCode !== "undefined" ? itemCode : null;
        const sortBySearch = sortBy && sortBy !== "undefined" ? sortBy : null;

        const warehouseItems = await prisma.warehouseItem.findMany({
            where: {
                isArchived: archived,
                isHidden: false,
                ...(categoryId > 0 ? { categoryId: categoryId } : {}),
                ...(itemCodeSearch ? { itemCode: { contains: itemCodeSearch } } : {})
            },
            ...(sortBySearch ? {
                ...(sortBySearch === "itemCode" ? { orderBy: { itemCode: 'asc' } } : {}),
                ...(sortBySearch === "description" ? { orderBy: { description: 'asc' } } : {}),
                ...(sortBySearch === "oum" ? { orderBy: { oum: 'asc' } } : {}),
                ...(sortBySearch === "totalQty" ? { orderBy: { totalQty: 'asc' } } : {}),
                ...(sortBySearch === "remQty" ? { orderBy: { remQty: 'asc' } } : {}),
                ...(sortBySearch === "location" ? { orderBy: { location: 'asc' } } : {}),
                ...(sortBySearch === "pendingOrder" ? { orderBy: { pendingOrder: 'asc' } } : {}),
                ...(sortBySearch === "poNumber" ? { orderBy: { poNumber: 'asc' } } : {})
            } : {})
        });

        return res.status(200).json({
            status: RES_STATUS.success,
            warehouseItems
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const CreateWarehouseItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categoryId = parseInt(req.body.categoryId as string) || 1;
        const itemCode = req.body.itemCode as string;
        const description = req.body.description as string;
        const oum = req.body.oum as string;
        const totalQty = parseInt(req.body.totalQty as string) || 0;
        const location = req.body.location as string;
        const pendingOrder = req.body.pendingOrder as string;
        const poNumber = req.body.poNumber as string;

        await prisma.warehouseItem.create({
            data: {
                itemCode,
                description,
                oum,
                totalQty,
                remQty: totalQty,
                location,
                pendingOrder,
                poNumber,
                categoryId
            },
        });

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Added an item successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const UpdateWarehouseItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.itemId as string);
        const categoryId = parseInt(req.body.categoryId as string) || 1;
        const itemCode = req.body.itemCode as string;
        const description = req.body.description as string;
        const oum = req.body.oum as string;
        const totalQty = parseInt(req.body.totalQty as string) || 0;
        const location = req.body.location as string;
        const pendingOrder = req.body.pendingOrder as string;
        const poNumber = req.body.poNumber as string;

        await prisma.warehouseItem.update({
            where: {
                id
            },
            data: {
                itemCode,
                description,
                oum,
                totalQty,
                remQty: totalQty,
                location,
                pendingOrder,
                poNumber,
                categoryId
            },
        });

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Updated an item successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const ArchiveWarehouseItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.itemId as string);

        await prisma.warehouseItem.update({
            where: {
                id
            },
            data: {
                isArchived: true
            },
        });

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Archived an item successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const UnarchiveWarehouseItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.itemId as string);

        await prisma.warehouseItem.update({
            where: {
                id
            },
            data: {
                isArchived: false
            },
        });

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Enabled an item successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const HideWarehouseItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.itemId as string);
        const reasonHide = req.body.reasonHide as string;

        await prisma.warehouseItem.update({
            where: {
                id
            },
            data: {
                isArchived: true,
                isHidden: true,
                reasonHide
            },
        });

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Removed an item successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const GetWarehouseLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const itemCode = req.query.itemCode as string;
        const sortBy = req.query.sortBy as string;
        const archived = req.query.active as string === "false";

        const itemCodeSearch = itemCode && itemCode !== "undefined" ? itemCode : null;
        const sortBySearch = sortBy && sortBy !== "undefined" ? sortBy : null;

        const warehouseLogs = await prisma.warehouseLogs.findMany({
            where: {
                isArchived: archived,
                isHidden: false,
                ...(itemCodeSearch ? { itemCode: { contains: itemCodeSearch } } : {})
            },
            ...(sortBySearch ? {
                ...(sortBySearch === "itemCode" ? { orderBy: { itemCode: 'asc' } } : {}),
                ...(sortBySearch === "description" ? { orderBy: { description: 'asc' } } : {}),
                ...(sortBySearch === "oum" ? { orderBy: { oum: 'asc' } } : {}),
                ...(sortBySearch === "quantity" ? { orderBy: { quantity: 'asc' } } : {}),
                ...(sortBySearch === "dateReceived" ? { orderBy: { dateReceived: 'asc' } } : {}),
                ...(sortBySearch === "affiliation" ? { orderBy: { affiliation: 'asc' } } : {})
            } : {})
        });

        return res.status(200).json({
            status: RES_STATUS.success,
            warehouseLogs
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const TransactWarehouseItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = parseInt(res.locals.userId as string);
        const itemId = parseInt(req.body.itemId as string);
        const quantity = parseInt(req.body.quantity as string) || 0;
        const dateReceived = req.body.dateReceived as Date || null;
        const affiliation = req.body.affiliation as string;
        const reason = req.body.reason as string;

        const warehouseItem = await prisma.warehouseItem.findFirst({
            where: {
                isArchived: false,
                id: itemId
            }
        });

        if (!warehouseItem) {
            return res.status(404).json({
                status: RES_STATUS.fail,
                message: "No warehouse item found",
            });
        }

        const remQty = warehouseItem.remQty - quantity;

        if (remQty < 0) {
            return res.status(404).json({
                status: RES_STATUS.fail,
                message: `Requested quantity (${quantity}) is more than the current supply (${warehouseItem.remQty})`
            });
        }

        await prisma.warehouseLogs.create({
            data: {
                itemCode: warehouseItem?.itemCode,
                description: warehouseItem?.description,
                oum: warehouseItem?.oum,
                quantity,
                dateReceived,
                affiliation,
                reason
            },
        });

        await prisma.warehouseItem.update({
            where: {
                isArchived: false,
                id: itemId
            },
            data: {
                remQty
            }
        });

        const isHalfBelow = (warehouseItem.totalQty / 2) >= remQty;
        if (isHalfBelow) {
            const newNotif = await prisma.notification.create({
                data: {
                    title: "Warehouse Threshold Limit Alert",
                    description: `${warehouseItem.itemCode} has reached below 50% capacity. Remaining quantity is ${remQty}.`,
                    createdById: userId
                }
            })

            const superAdmins = await prisma.user.findMany({
                where: {
                    isArchived: false,
                    isHidden: false,
                    role: "SUPER_ADMIN"
                }
            });

            const notifUsers = superAdmins.map((admin) => ({ notificationId: newNotif.id, notifiedUserId: admin.id }));

            await prisma.notificationUserAction.createMany({
                data: notifUsers
            });
        }

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Request applied successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const ArchiveWarehouseTransactLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.requisitionId as string);

        await prisma.warehouseLogs.update({
            where: {
                id
            },
            data: {
                isArchived: true
            },
        });

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Archived a log successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const UnarchiveWarehouseTransactLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.requisitionId as string);

        await prisma.warehouseLogs.update({
            where: {
                id
            },
            data: {
                isArchived: false
            },
        });

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Showed a log successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const HideWarehouseTransactLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.requisitionId as string);
        const reasonHide = req.body.reasonHide as string;

        await prisma.warehouseLogs.update({
            where: {
                id
            },
            data: {
                isArchived: true,
                isHidden: true,
                reasonHide
            },
        });

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Removed a log successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

export default {
    GetWarehouseItemCategories,
    GetWarehouseItems,
    CreateWarehouseItem,
    UpdateWarehouseItem,
    ArchiveWarehouseItem,
    UnarchiveWarehouseItem,
    HideWarehouseItem,
    GetWarehouseLogs,
    TransactWarehouseItem,
    ArchiveWarehouseTransactLog,
    UnarchiveWarehouseTransactLog,
    HideWarehouseTransactLog
};
