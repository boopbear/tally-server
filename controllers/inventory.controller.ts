import fs from "fs";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../server";
import { RES_STATUS, PAGINATION } from "../constants";
import { RcFile, unlinkAsync } from "./posts.controller";
import { getDownloadURL, storage, storageRef, uploadBytes } from "../firebase/firebase.api";
import { UploadMetadata, deleteObject } from "firebase/storage";

const GetInventoryCategoriesWithStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const inventoryCategories = await prisma.inventoryCategory.findMany({
            include: {
                inventoryStatusList: true
            }
        });

        if (!inventoryCategories) {
            return res.status(404).json({
                status: RES_STATUS.fail,
                message: "No categories found",
            });
        }

        return res.status(200).json({
            status: RES_STATUS.success,
            inventoryCategories
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const GetInventoryAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categoryId = parseInt(req.query.categoryId as string) || 0;
        const assetStatusId = parseInt(req.query.assetStatusId as string);
        const page = parseInt(req.query.page as string);
        const size = parseInt(req.query.size as string);
        const assetCode = req.query.assetCode as string;
        const orderBy = req.query.orderBy as string;
        const archived = req.query.active as string === "false";

        const assetCodeSearch = assetCode && assetCode !== "undefined" ? assetCode : '';
        const orderBySearch = orderBy && orderBy !== "undefined" ? orderBy : 'desc';
        const skip = ((page || PAGINATION.default.page) - 1) * (size || PAGINATION.default.size);
        const finalSize = size || PAGINATION.default.size;

        const inventoryAssets = await prisma.inventoryAsset.findMany({
            where: {
                inventoryCategoryId: categoryId,
                isArchived: archived,
                assetCode: {
                    contains: assetCodeSearch
                },
                ...(assetStatusId ? { assetStatusId } : {})
            },
            orderBy: {
                id: orderBySearch === 'asc' ? 'asc' : 'desc',
            },
            include: {
                department: true,
                inventoryCategory: true,
                assetStatus: true,
                inventoryAssetUploads: {
                    select: {
                        attachment: true
                    }
                }
            },
            // ...(page && size ? { skip, take: finalSize } : {})
        });

        const rearrangeData = inventoryAssets.map((asset) => {
            const attachments = asset.inventoryAssetUploads.map((upload) => {
                return { ...upload.attachment };
            });
            return {
                ...asset,
                attachments
            };
        });

        return res.status(200).json({
            status: RES_STATUS.success,
            inventoryAssets: rearrangeData
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const GetInventoryAssetBySharedId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sharedId = req.query.sharedId as string;

        if (sharedId == null) {
            return res.status(404).json({
                status: RES_STATUS.fail,
                message: "Unable to read scanned asset"
            });
        }

        const inventoryAssets = await prisma.inventoryAsset.findMany({
            where: {
                sharedId: sharedId
            },
            include: {
                department: true,
                inventoryCategory: true,
                assetStatus: true,
                inventoryAssetUploads: {
                    select: {
                        attachment: true
                    }
                }
            }
        });

        const rearrangeData = inventoryAssets.map((asset) => {
            const attachments = asset.inventoryAssetUploads.map((upload) => {
                return { ...upload.attachment };
            });
            return {
                ...asset,
                attachments
            };
        });

        return res.status(200).json({
            status: RES_STATUS.success,
            inventoryAssets: rearrangeData
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const CreateAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assetCode = req.body.assetCode as string;
        const description = req.body.description as string;
        const inventoryCategoryId = parseInt(req.body.inventoryCategoryId as string) || 1;
        const serialNumber = req.body.serialNumber as string;
        const assetStatusId = parseInt(req.body.assetStatusId as string);
        const departmentId = parseInt(req.body.departmentId as string);
        const location = req.body.location as string;
        const owner = req.body.owner as string;
        const dateReceived = req.body.dateReceived as Date || null;
        const endUser = req.body.endUser as string;
        const poNumber = req.body.poNumber as string;
        const files = req.files as RcFile[];

        const newAsset = await prisma.inventoryAsset.create({
            data: {
                assetCode,
                description,
                inventoryCategoryId,
                serialNumber,
                assetStatusId,
                departmentId,
                location,
                owner,
                dateReceived,
                endUser,
                poNumber
            },
        });

        const promises: any[] = [];

        files && files.map((file) => {
            const buffer: Buffer = fs.readFileSync(file.path);
            const metaData: UploadMetadata = {
                contentType: file.mimetype
            };
            const pathString = `/attachments/images/${file.filename}`;

            const upBytes = uploadBytes(storageRef(storage, pathString), buffer, metaData).then(async (s) => {
                await getDownloadURL(s.ref).then(async (url) => {

                    const newAttachment = await prisma.attachment.create({
                        data: {
                            originalFileName: file.originalname,
                            fileType: file.mimetype,
                            imageSize: file.size,
                            storageLink: url,
                            pathString
                        }
                    });

                    await prisma.inventoryAssetUploads.create({
                        data: {
                            attachmentId: newAttachment.id,
                            inventoryAssetId: newAsset.id
                        }
                    });

                    await unlinkAsync(file.path);
                }).catch((e) => console.log(e));
            }).catch((e) => console.log(e));

            promises.push(upBytes);
        });

        Promise.all(promises).then(tasks => {
            return res.status(201).json({
                status: RES_STATUS.success,
                message: "Added an asset successfully",
            });
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const UpdateAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.assetId as string);
        const assetCode = req.body.assetCode as string;
        const description = req.body.description as string;
        const inventoryCategoryId = parseInt(req.body.inventoryCategoryId as string) || 1;
        const serialNumber = req.body.serialNumber as string;
        const assetStatusId = parseInt(req.body.assetStatusId as string);
        const departmentId = parseInt(req.body.departmentId as string);
        const location = req.body.location as string;
        const owner = req.body.owner as string;
        const dateReceived = req.body.dateReceived as Date || null;
        const endUser = req.body.endUser as string;
        const poNumber = req.body.poNumber as string;
        const files = req.files as RcFile[];
        const rawRetainedAttachmentIds = req.body.retainedAttachmentId || [];
        const retainedAttachmentIds = Array.isArray(rawRetainedAttachmentIds)
            ? rawRetainedAttachmentIds.filter(r => r !== "").map(r => { return parseInt(r); }).filter(r => !isNaN(r))
            : [parseInt(rawRetainedAttachmentIds)].filter(r => !isNaN(r));

        const updatedAsset = await prisma.inventoryAsset.update({
            where: {
                id,
                isArchived: false
            },
            data: {
                assetCode,
                description,
                inventoryCategoryId,
                serialNumber,
                assetStatusId,
                departmentId,
                location,
                owner,
                dateReceived,
                endUser,
                poNumber
            },
        });

        const currentUploads = await prisma.inventoryAssetUploads.findMany({
            where: {
                inventoryAssetId: updatedAsset.id,
                ...(retainedAttachmentIds ? {
                    NOT: {
                        attachmentId: {
                            in: retainedAttachmentIds
                        }
                    }
                } : {})
            },
            include: {
                attachment: true
            }
        });

        if (currentUploads.length > 0) {
            currentUploads.map(async (currentUpload) => {
                const fileRef = currentUpload.attachment?.pathString ?? currentUpload.attachment?.storageLink;

                if (fileRef != null) {
                    const fullRef = storageRef(storage, fileRef);

                    deleteObject(fullRef).then(() => {
                        console.log("File deleted");
                    }).catch((error) => {
                        console.log(error);
                    });
                }

                await prisma.attachment.delete({
                    where: {
                        id: currentUpload.attachment?.id
                    }
                });
            })

            await prisma.inventoryAssetUploads.deleteMany({
                where: {
                    inventoryAssetId: updatedAsset.id
                }
            })
        }

        const promises: any[] = [];

        files && files.map((file) => {
            const buffer: Buffer = fs.readFileSync(file.path);
            const metaData: UploadMetadata = {
                contentType: file.mimetype
            };
            const pathString = `/attachments/images/${file.filename}`;

            const upBytes = uploadBytes(storageRef(storage, pathString), buffer, metaData).then(async (s) => {
                await getDownloadURL(s.ref).then(async (url) => {

                    const newAttachment = await prisma.attachment.create({
                        data: {
                            originalFileName: file.originalname,
                            fileType: file.mimetype,
                            imageSize: file.size,
                            storageLink: url,
                            pathString
                        }
                    });

                    await prisma.inventoryAssetUploads.create({
                        data: {
                            attachmentId: newAttachment.id,
                            inventoryAssetId: updatedAsset.id
                        }
                    });

                    await unlinkAsync(file.path);
                }).catch((e) => console.log(e));
            }).catch((e) => console.log(e));

            promises.push(upBytes);
        });

        Promise.all(promises).then(tasks => {
            return res.status(201).json({
                status: RES_STATUS.success,
                message: "Updated an asset successfully",
            });
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const ArchiveAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.assetId as string);

        await prisma.inventoryAsset.update({
            where: {
                id
            },
            data: {
                isArchived: true
            },
        });

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Archived an asset successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const DestroyAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.assetId as string);
        const reasonDestroy = req.body.reasonDestroy as string;
        const userId = parseInt(res.locals.userId as string);

        const asset = await prisma.inventoryAsset.findFirst({
            where: {
                id
            },
            include: {
                assetStatus: {
                    include: {
                        inventoryCategory: true
                    }
                }
            }
        });

        const user = await prisma.user.findFirst({
            where: {
                id: userId
            },
            include: {
                profile: true,
                department: true
            }
        });

        const title =
            `Delete of ${asset?.assetCode}`;

        const details = {
            "Action": title,
            "Reason": reasonDestroy,
            ...(user?.department != null ? { "Unit/Department": user.department.name } : {})
        };

        await prisma.inventoryAssetLogs.create({
            data: {
                assetCodeBackup: asset?.assetCode,
                eventTitle: title,
                details: details,
                responsibleId: user?.id,
                inventoryCategoryId: asset?.assetStatus?.inventoryCategory?.id,
                assetStatusId: asset?.assetStatus?.id
            },
        });

        await prisma.inventoryAsset.delete({
            where: {
                id
            }
        });

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Permanently deleted an asset successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const UnarchiveAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.assetId as string);

        await prisma.inventoryAsset.update({
            where: {
                id
            },
            data: {
                isArchived: false
            },
        });

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Set an asset to active successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const TransactAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assetId = parseInt(req.body.assetId as string);
        const selectedStatusId = parseInt(req.body.selectedStatusId as string);
        const reason = req.body.reason as string;
        const otherReason = req.body.otherReason as string;
        const remarks = req.body.remarks as string;
        const owner = req.body.owner as string;
        const departmentId = parseInt(req.body.departmentId as string);
        const location = req.body.location as string;
        const repairedByName = req.body.repairedByName as string;
        const supplierName = req.body.supplierName as string;
        const beneficiaryName = req.body.beneficiaryName as string;
        const beneficiaryAddress = req.body.beneficiaryAddress as string;
        const pmfNo = req.body.pmfNo as string;
        const soldToMemberName = req.body.soldToMemberName as string;
        const soldToMemberIdNo = req.body.soldToMemberIdNo as string;
        const soldToMemberAffiliation = req.body.soldToMemberAffiliation as string;
        const soldToMemberPosition = req.body.soldToMemberPosition as string;
        const salePrice = req.body.salePrice as string;
        const soldReceiptNo = req.body.soldReceiptNo as string;
        const scrapBuyerName = req.body.scrapBuyerName as string;
        const scrapReceiptNo = req.body.scrapReceiptNo as string;
        const scrapSSFNo = req.body.scrapSSFNo as string;

        const hasOtherReason = otherReason != null && otherReason !== "" && !otherReason.includes("undefined");
        const sharedId = res.locals.sharedId as string;

        const user = await prisma.user.findFirst({
            where: { sharedId },
            select: {
                id: true,
                email: true,
                profile: {
                    select: {
                        fullName: true
                    }
                },
                department: true
            }
        });

        if (!user) {
            return res.status(404).json({
                status: RES_STATUS.fail,
                message: "User does not exists",
            });
        }

        const assetStatusOptions = await prisma.inventoryAssetStatus.findMany({
            include: {
                inventoryCategory: true
            }
        });

        switch (selectedStatusId) {
            // Transfer current
            case assetStatusOptions[0].id:
                const currentTransferAsset = await prisma.inventoryAsset.update({
                    where: {
                        id: assetId
                    },
                    data: {
                        owner,
                        assetStatusId: selectedStatusId
                    },
                    include: {
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                const currentTransferTitle =
                    `[${currentTransferAsset.assetStatus?.inventoryCategory?.name}] ${currentTransferAsset.assetStatus?.display}`;

                const currentTransferDetails = {
                    "Owner": owner,
                    "Action": currentTransferTitle,
                    ...(user.department != null ? { "Unit/Department": user.department.name } : {})
                };

                await prisma.inventoryAssetLogs.create({
                    data: {
                        inventoryAssetId: currentTransferAsset.id,
                        assetCodeBackup: currentTransferAsset.assetCode,
                        eventTitle: currentTransferTitle,
                        details: currentTransferDetails,
                        responsibleId: user.id,
                        inventoryCategoryId: currentTransferAsset.assetStatus?.inventoryCategory?.id,
                        assetStatusId: currentTransferAsset.assetStatus?.id
                    },
                });
                break;
            // Repair
            case assetStatusOptions[1].id:
                const repairAsset = await prisma.inventoryAsset.update({
                    where: {
                        id: assetId
                    },
                    data: {
                        assetStatusId: selectedStatusId
                    },
                    include: {
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                const repairTitle =
                    `[${repairAsset.assetStatus?.inventoryCategory?.name}] ${repairAsset.assetStatus?.display}`;

                const repairDetails = {
                    "Repaired By": repairedByName,
                    "Reason": hasOtherReason ? otherReason : reason,
                    "Remarks": remarks,
                    "Action": repairTitle,
                    ...(user.department != null ? { "Unit/Department": user.department.name } : {})
                };

                await prisma.inventoryAssetLogs.create({
                    data: {
                        inventoryAssetId: repairAsset.id,
                        assetCodeBackup: repairAsset.assetCode,
                        eventTitle: repairTitle,
                        details: repairDetails,
                        responsibleId: user.id,
                        inventoryCategoryId: repairAsset.assetStatus?.inventoryCategory?.id,
                        assetStatusId: repairAsset.assetStatus?.id
                    },
                });
                break;
            // Trade-in
            case assetStatusOptions[2].id:
                const tradeInAsset = await prisma.inventoryAsset.update({
                    where: {
                        id: assetId
                    },
                    data: {
                        assetStatusId: selectedStatusId
                    },
                    include: {
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                const tradeInTitle =
                    `[${tradeInAsset.assetStatus?.inventoryCategory?.name}] Trade-in to ${supplierName}`;

                const tradeInDetails = {
                    "Supplier": supplierName,
                    "Reason": hasOtherReason ? otherReason : reason,
                    "Remarks": remarks,
                    "Action": tradeInTitle,
                    ...(user.department != null ? { "Unit/Department": user.department.name } : {})
                };

                await prisma.inventoryAssetLogs.create({
                    data: {
                        inventoryAssetId: tradeInAsset.id,
                        assetCodeBackup: tradeInAsset.assetCode,
                        eventTitle: tradeInTitle,
                        details: tradeInDetails,
                        responsibleId: user.id,
                        inventoryCategoryId: tradeInAsset.assetStatus?.inventoryCategory?.id,
                        assetStatusId: tradeInAsset.assetStatus?.id
                    },
                });

                await prisma.inventoryAsset.delete({
                    where: {
                        id: assetId
                    }
                });

                break;
            // Pull-out
            case assetStatusOptions[3].id:
                const pullOutAsset = await prisma.inventoryAsset.update({
                    where: {
                        id: assetId
                    },
                    data: {
                        assetStatusId: selectedStatusId,
                        departmentId,
                        location
                    },
                    include: {
                        department: true,
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                const pullOutTitle =
                    `[${pullOutAsset.assetStatus?.inventoryCategory?.name}] ${pullOutAsset.assetStatus?.display}`;

                const pullOutDetails = {
                    "Unit/Department": pullOutAsset.department?.name,
                    "Location": location,
                    "Reason": hasOtherReason ? otherReason : reason,
                    "Remarks": remarks,
                    "Action": pullOutTitle,
                    ...(user.department != null ? { "Unit/Department": user.department.name } : {})
                };

                await prisma.inventoryAssetLogs.create({
                    data: {
                        inventoryAssetId: pullOutAsset.id,
                        assetCodeBackup: pullOutAsset.assetCode,
                        eventTitle: pullOutTitle,
                        details: pullOutDetails,
                        responsibleId: user.id,
                        inventoryCategoryId: pullOutAsset.assetStatus?.inventoryCategory?.id,
                        assetStatusId: pullOutAsset.assetStatus?.id
                    },
                });
                break;
            // Turnover
            case assetStatusOptions[4].id:
                const turnOverAsset = await prisma.inventoryAsset.update({
                    where: {
                        id: assetId
                    },
                    data: {
                        assetStatusId: selectedStatusId,
                        departmentId,
                        location
                    },
                    include: {
                        department: true,
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                const turnOverTitle =
                    `[${turnOverAsset.assetStatus?.inventoryCategory?.name}] ${turnOverAsset.assetStatus?.display}`;

                const turnOverDetails = {
                    "Unit/Department": turnOverAsset.department?.name,
                    "Location": location,
                    "Reason": hasOtherReason ? otherReason : reason,
                    "Remarks": remarks,
                    "Action": turnOverTitle,
                    ...(user.department != null ? { "Unit/Department": user.department.name } : {})
                };

                await prisma.inventoryAssetLogs.create({
                    data: {
                        inventoryAssetId: turnOverAsset.id,
                        assetCodeBackup: turnOverAsset.assetCode,
                        eventTitle: turnOverTitle,
                        details: turnOverDetails,
                        responsibleId: user.id,
                        inventoryCategoryId: turnOverAsset.assetStatus?.inventoryCategory?.id,
                        assetStatusId: turnOverAsset.assetStatus?.id
                    },
                });
                break;
            // Return to supplier
            case assetStatusOptions[5].id:
                const returnSupplierAsset = await prisma.inventoryAsset.update({
                    where: {
                        id: assetId
                    },
                    data: {
                        assetStatusId: selectedStatusId
                    },
                    include: {
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                const returnSupplierTitle =
                    `[${returnSupplierAsset.assetStatus?.inventoryCategory?.name}] ${returnSupplierAsset.assetStatus?.display}`;

                const returnSupplierDetails = {
                    "Supplier": supplierName,
                    "Reason": hasOtherReason ? otherReason : reason,
                    "Remarks": remarks,
                    "Action": returnSupplierTitle,
                    ...(user.department != null ? { "Unit/Department": user.department.name } : {})
                };

                await prisma.inventoryAssetLogs.create({
                    data: {
                        inventoryAssetId: returnSupplierAsset.id,
                        assetCodeBackup: returnSupplierAsset.assetCode,
                        eventTitle: returnSupplierTitle,
                        details: returnSupplierDetails,
                        responsibleId: user.id,
                        inventoryCategoryId: returnSupplierAsset.assetStatus?.inventoryCategory?.id,
                        assetStatusId: returnSupplierAsset.assetStatus?.id
                    },
                });
                break;
            // Transfer outgoing
            case assetStatusOptions[6].id:
                const outgoingTransferAsset = await prisma.inventoryAsset.update({
                    where: {
                        id: assetId
                    },
                    data: {
                        owner,
                        departmentId,
                        assetStatusId: selectedStatusId,
                        location
                    },
                    include: {
                        department: true,
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                const outgoingTransferTitle =
                    `[${outgoingTransferAsset.assetStatus?.inventoryCategory?.name}] ${outgoingTransferAsset.assetStatus?.display}`;

                const outgoingTransferDetails = {
                    "Owner": owner,
                    "Unit/Department": outgoingTransferAsset.department?.name,
                    "Location": location,
                    "Action": outgoingTransferTitle,
                    ...(user.department != null ? { "Unit/Department": user.department.name } : {})
                };

                await prisma.inventoryAssetLogs.create({
                    data: {
                        inventoryAssetId: outgoingTransferAsset.id,
                        assetCodeBackup: outgoingTransferAsset.assetCode,
                        eventTitle: outgoingTransferTitle,
                        details: outgoingTransferDetails,
                        responsibleId: user.id,
                        inventoryCategoryId: outgoingTransferAsset.assetStatus?.inventoryCategory?.id,
                        assetStatusId: outgoingTransferAsset.assetStatus?.id
                    },
                });
                break;
            // Sale
            case assetStatusOptions[7].id:
                const saleAsset = await prisma.inventoryAsset.update({
                    where: {
                        id: assetId
                    },
                    data: {
                        assetStatusId: selectedStatusId
                    },
                    include: {
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                const saleTitle =
                    `[${saleAsset.assetStatus?.inventoryCategory?.name}] ${saleAsset.assetStatus?.display}`;

                const saleDetails = {
                    "Sold To": soldToMemberName,
                    "UST ID no.": soldToMemberIdNo,
                    "Affiliation": soldToMemberAffiliation,
                    "Position": soldToMemberPosition,
                    "Price": salePrice,
                    "Receipt no.": soldReceiptNo,
                    "Action": saleTitle,
                    ...(user.department != null ? { "Unit/Department": user.department.name } : {})
                };

                await prisma.inventoryAssetLogs.create({
                    data: {
                        inventoryAssetId: saleAsset.id,
                        assetCodeBackup: saleAsset.assetCode,
                        eventTitle: saleTitle,
                        details: saleDetails,
                        responsibleId: user.id,
                        inventoryCategoryId: saleAsset.assetStatus?.inventoryCategory?.id,
                        assetStatusId: saleAsset.assetStatus?.id
                    },
                });
                break;
            // Donate
            case assetStatusOptions[8].id:
                const donateAsset = await prisma.inventoryAsset.update({
                    where: {
                        id: assetId
                    },
                    data: {
                        assetStatusId: selectedStatusId
                    },
                    include: {
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                const donateTitle =
                    `[${donateAsset.assetStatus?.inventoryCategory?.name}] ${donateAsset.assetStatus?.display}`;

                const donateDetails = {
                    "Beneficiary": beneficiaryName,
                    "Address": beneficiaryAddress,
                    "PMF no.": pmfNo,
                    "Remarks": remarks,
                    "Action": donateTitle,
                    ...(user.department != null ? { "Unit/Department": user.department.name } : {})
                };

                await prisma.inventoryAssetLogs.create({
                    data: {
                        inventoryAssetId: donateAsset.id,
                        assetCodeBackup: donateAsset.assetCode,
                        eventTitle: donateTitle,
                        details: donateDetails,
                        responsibleId: user.id,
                        inventoryCategoryId: donateAsset.assetStatus?.inventoryCategory?.id,
                        assetStatusId: donateAsset.assetStatus?.id
                    },
                });
                break;
            // Scrap
            case assetStatusOptions[9].id:
                const scrapAsset = await prisma.inventoryAsset.update({
                    where: {
                        id: assetId
                    },
                    data: {
                        assetStatusId: selectedStatusId
                    },
                    include: {
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                const scrapTitle =
                    `[${scrapAsset.assetStatus?.inventoryCategory?.name}] ${scrapAsset.assetStatus?.display}`;

                const scrapDetails = {
                    "Scrap buyer": scrapBuyerName,
                    "Receipt no.": scrapReceiptNo,
                    "SSF no.": scrapSSFNo,
                    "Action": scrapTitle,
                    ...(user.department != null ? { "Unit/Department": user.department.name } : {})
                };

                await prisma.inventoryAssetLogs.create({
                    data: {
                        inventoryAssetId: scrapAsset.id,
                        assetCodeBackup: scrapAsset.assetCode,
                        eventTitle: scrapTitle,
                        details: scrapDetails,
                        responsibleId: user.id,
                        inventoryCategoryId: scrapAsset.assetStatus?.inventoryCategory?.id,
                        assetStatusId: scrapAsset.assetStatus?.id
                    },
                });
                break;
            // Disposal
            case assetStatusOptions[10].id:
                const disposalAsset = await prisma.inventoryAsset.update({
                    where: {
                        id: assetId
                    },
                    data: {
                        assetStatusId: selectedStatusId
                    },
                    include: {
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                const disposalTitle =
                    `[${disposalAsset.assetStatus?.inventoryCategory?.name}] ${disposalAsset.assetStatus?.display}`;

                const disposalDetails = {
                    "Remarks": remarks,
                    "Action": disposalTitle,
                    ...(user.department != null ? { "Unit/Department": user.department.name } : {})
                };

                await prisma.inventoryAssetLogs.create({
                    data: {
                        inventoryAssetId: disposalAsset.id,
                        assetCodeBackup: disposalAsset.assetCode,
                        eventTitle: disposalTitle,
                        details: disposalDetails,
                        responsibleId: user.id,
                        inventoryCategoryId: disposalAsset.assetStatus?.inventoryCategory?.id,
                        assetStatusId: disposalAsset.assetStatus?.id
                    },
                });
                break;
            // Safekeeping
            case assetStatusOptions[11].id:
                const safekeepingAsset = await prisma.inventoryAsset.update({
                    where: {
                        id: assetId
                    },
                    data: {
                        assetStatusId: selectedStatusId
                    },
                    include: {
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                const safekeepingTitle =
                    `[${safekeepingAsset.assetStatus?.inventoryCategory?.name}] ${safekeepingAsset.assetStatus?.display}`;

                const safekeepingDetails = {
                    "Remarks": remarks,
                    "Action": safekeepingTitle,
                    ...(user.department != null ? { "Unit/Department": user.department.name } : {})
                };

                await prisma.inventoryAssetLogs.create({
                    data: {
                        inventoryAssetId: safekeepingAsset.id,
                        assetCodeBackup: safekeepingAsset.assetCode,
                        eventTitle: safekeepingTitle,
                        details: safekeepingDetails,
                        responsibleId: user.id,
                        inventoryCategoryId: safekeepingAsset.assetStatus?.inventoryCategory?.id,
                        assetStatusId: safekeepingAsset.assetStatus?.id
                    },
                });
                break;

            default:
                return res.status(401).json({
                    status: RES_STATUS.fail,
                    message: "Unable to verify transaction"
                });
        }

        return res.status(201).json({
            status: RES_STATUS.success
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const GetAssetLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categoryId = parseInt(req.query.categoryId as string);
        const assetStatusId = parseInt(req.query.assetStatusId as string);
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(req.query.endDate as string);
        const assetCode = req.query.assetCode as string;
        // const orderByRef = req.query.orderByRef as string;
        const orderBy = req.query.orderBy as string;
        const archived = req.query.active as string === "false";

        const assetCodeSearch = assetCode && assetCode !== "undefined" ? assetCode : '';
        // const orderByRefSearch = orderByRef && orderByRef !== "undefined" ? orderByRef : '';
        const orderBySearch = orderBy && orderBy !== "undefined" ? orderBy : 'desc';

        const hasStartDate = startDate != null && startDate instanceof Date && !isNaN(startDate.getTime());
        const hasEndDate = endDate != null && endDate instanceof Date && !isNaN(endDate.getTime());

        if (assetCodeSearch === '') {
            return res.status(404).json({
                status: RES_STATUS.fail,
                message: "Asset code is required"
            });
        }

        const searchAssets = await prisma.inventoryAsset.findMany({
            where: {
                isArchived: archived,
                assetCode: {
                    contains: assetCodeSearch
                }
            }
        })

        const assetLogs = await prisma.inventoryAssetLogs.findMany({
            where: {
                inventoryAssetId: {
                    in: searchAssets.map((asset) => asset.id)
                },
                ...(categoryId ? { inventoryCategoryId: categoryId } : {}),
                ...(assetStatusId ? { assetStatusId: assetStatusId } : {}),
                ...(hasStartDate || hasEndDate) ? {
                    createdAt: {
                        ...(hasStartDate ? { gte: startDate } : {}),
                        ...(hasEndDate ? { lte: endDate } : {}),
                    }
                } : {},
            },
            orderBy: {
                id: orderBySearch === 'asc' ? 'asc' : 'desc',
            },
            include: {
                inventoryCategory: true,
                assetStatus: true,
                inventoryAsset: true,
                responsible: {
                    include: {
                        profile: true
                    }
                }
            }
        });

        if (assetLogs.length > 0) {
            res.status(200).json({
                status: RES_STATUS.success,
                assetLogs
            });
        } else if (assetCodeSearch !== '') {
            const assetLogsFurther = await prisma.inventoryAssetLogs.findMany({
                where: {
                    assetCodeBackup: {
                        contains: assetCodeSearch
                    },
                    ...(categoryId ? { inventoryCategoryId: categoryId } : {}),
                    ...(assetStatusId ? { assetStatusId: assetStatusId } : {}),
                    ...(hasStartDate || hasEndDate) ? {
                        createdAt: {
                            ...(hasStartDate ? { gte: startDate } : {}),
                            ...(hasEndDate ? { lte: endDate } : {}),
                        }
                    } : {},
                },
                orderBy: {
                    id: orderBySearch === 'asc' ? 'asc' : 'desc',
                },
                include: {
                    inventoryCategory: true,
                    assetStatus: true,
                    inventoryAsset: true,
                    responsible: {
                        include: {
                            profile: true
                        }
                    }
                }
            });

            return res.status(200).json({
                status: RES_STATUS.success,
                assetLogs: assetLogsFurther
            });
        }
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const DestroyLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rawLogIds = req.body.logId || [];
        const logIds = Array.isArray(rawLogIds)
            ? rawLogIds.filter(r => r !== "").map(r => { return parseInt(r); }).filter(r => !isNaN(r))
            : [parseInt(rawLogIds)].filter(r => !isNaN(r));

        await prisma.inventoryAssetLogs.deleteMany({
            where: {
                id: {
                    in: logIds
                }
            }
        });

        return res.status(201).json({
            status: RES_STATUS.success,
            message: "Permanently deleted logs successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

export default {
    GetInventoryCategoriesWithStatus,
    GetInventoryAssets,
    GetInventoryAssetBySharedId,
    CreateAsset,
    UpdateAsset,
    ArchiveAsset,
    DestroyAsset,
    UnarchiveAsset,
    TransactAsset,
    GetAssetLogs,
    DestroyLogs
};
