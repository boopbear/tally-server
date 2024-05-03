import fs from "fs";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../server";
import { RES_STATUS, PAGINATION } from "../constants";
import { RcFile, unlinkAsync } from "./posts.controller";
import { getDownloadURL, storage, storageRef, uploadBytes } from "../firebase/firebase.api";
import { UploadMetadata } from "firebase/storage";

const GetAssetRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const fullName = req.query.fullName as string;
        const orderBy = req.query.orderBy as string;

        const fullNameSearch = fullName && fullName !== "undefined" ? fullName.toLowerCase() : '';
        const orderBySearch = orderBy && orderBy !== "undefined" ? orderBy : 'desc';

        const userId = res.locals.userId as number;
        const userRole = res.locals.role as "SUPER_ADMIN" | "OFFICE_ADMIN";

        const assetRequests = await prisma.assetRequests.findMany({
            where: {
                ...(userRole !== "SUPER_ADMIN" ? { requestorId: userId } : {}),
                ...(userRole === "SUPER_ADMIN" ? { isHiddenAdmin: false } : {}),
                ...(userRole === "OFFICE_ADMIN" ? { isHiddenNonAdmin: false } : {})
            },
            orderBy: {
                id: orderBySearch === 'asc' ? 'asc' : 'desc',
            },
            include: {
                inventoryCategory: true,
                inventoryAsset: true,
                requestor: {
                    select: {
                        profile: true
                    }
                },
                respondent: {
                    select: {
                        profile: true
                    }
                },
                assetRequestsUploads: {
                    select: {
                        attachment: true
                    }
                }
            }
        });

        const rearrangeData = assetRequests.map((request) => {
            const attachments = request.assetRequestsUploads.map((upload) => {
                return { ...upload.attachment };
            });
            return {
                ...request,
                attachments
            };
        });

        const filterByDetails = rearrangeData.filter((data) => {
            if (data.requestor?.profile?.fullName?.toLowerCase().includes(fullNameSearch)) {
                return true;
            }

            if (data.details != null) {
                const details = data.details as any;
                const hasValueSearch = Object.keys(details).some(key => {
                    const detailVal = details[key] as string;
                    if (detailVal != null && typeof detailVal === 'string' &&
                        detailVal.toLowerCase().includes(fullNameSearch)) {
                        return true;
                    }

                    return false;
                });

                return hasValueSearch;
            }

            return false;
        });

        return res.status(200).json({
            status: RES_STATUS.success,
            assetRequests: filterByDetails
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const CreateAssetRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const requestType = parseInt(req.body.requestType as string);
        const assetId = parseInt(req.body.assetId as string);
        const message = req.body.message as string;
        const getCurrentHardCopy = req.body.getCurrentHardCopy as string === "true";
        const requestingUnitName = req.body.requestingUnitName as string;
        const departmentId = parseInt(req.body.departmentId as string);
        const location = req.body.location as string;
        const affiliation = req.body.affiliation as string;
        const position = req.body.position as string;
        const biddingPrice = req.body.biddingPrice as string;
        const beneficiaryName = req.body.beneficiaryName as string;
        const beneficiaryAddress = req.body.beneficiaryAddress as string;
        const files = req.files as RcFile[];

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

        switch (requestType) {
            // Request view current inventory
            case 1:
                const currentAccessTitle = `Request access on current inventory`;
                const hardCopyDetails = getCurrentHardCopy ? "Yes" : "No";

                const currentAccessDetails = {
                    "Message": message,
                    "Request hard copy": hardCopyDetails,
                    "Action": currentAccessTitle,
                    ...(user.department != null ? { "Unit/Department": user.department.name } : {})
                };

                await prisma.assetRequests.create({
                    data: {
                        eventType: 1,
                        eventTitle: currentAccessTitle,
                        details: currentAccessDetails,
                        inventoryCategoryId: 1,
                        requestorId: user.id
                    },
                });

                return res.status(201).json({
                    status: RES_STATUS.success
                });
            // [Outgoing] Turnover
            case 2:
                if (isNaN(assetId)) {
                    return res.status(404).json({
                        status: RES_STATUS.fail,
                        message: "Missing asset reference",
                    });
                }

                const turnOverAsset = await prisma.inventoryAsset.findFirst({
                    where: {
                        id: assetId
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

                if (!turnOverAsset) {
                    return res.status(404).json({
                        status: RES_STATUS.fail,
                        message: "Unable to locate asset",
                    });
                }

                const turnOverTitle = `Turnover`;

                const turnOverDetails = {
                    "Requesting unit": requestingUnitName,
                    "UnitId": departmentId,
                    "Unit/Department": turnOverAsset.department?.name,
                    "Location": location,
                    "Action": turnOverTitle,
                };

                await prisma.assetRequests.create({
                    data: {
                        eventType: 2,
                        inventoryAssetId: turnOverAsset.id,
                        assetCodeBackup: turnOverAsset.assetCode,
                        assetDescBackup: turnOverAsset.description,
                        eventTitle: turnOverTitle,
                        details: turnOverDetails,
                        inventoryCategoryId: turnOverAsset.assetStatus?.inventoryCategory?.id,
                        requestorId: user.id
                    },
                });

                return res.status(201).json({
                    status: RES_STATUS.success
                });
            // [Outgoing] Purchase
            case 3:
                if (isNaN(assetId)) {
                    return res.status(404).json({
                        status: RES_STATUS.fail,
                        message: "Missing asset reference",
                    });
                }

                const purchaseAsset = await prisma.inventoryAsset.findFirst({
                    where: {
                        id: assetId
                    },
                    include: {
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                if (!purchaseAsset) {
                    return res.status(404).json({
                        status: RES_STATUS.fail,
                        message: "Unable to locate asset",
                    });
                }

                const purchaseTitle = `Purchase`;

                const purchaseDetails = {
                    "Requester name": requestingUnitName,
                    "Affiliation": affiliation,
                    "Position": position,
                    "Bidding price": biddingPrice,
                    "Action": purchaseTitle
                };

                await prisma.assetRequests.create({
                    data: {
                        eventType: 2,
                        inventoryAssetId: purchaseAsset.id,
                        assetCodeBackup: purchaseAsset.assetCode,
                        assetDescBackup: purchaseAsset.description,
                        eventTitle: purchaseTitle,
                        details: purchaseDetails,
                        inventoryCategoryId: purchaseAsset.assetStatus?.inventoryCategory?.id,
                        requestorId: user.id
                    },
                });

                return res.status(201).json({
                    status: RES_STATUS.success
                });
            // [Outgoing] Donation
            case 4:
                if (isNaN(assetId)) {
                    return res.status(404).json({
                        status: RES_STATUS.fail,
                        message: "Missing asset reference",
                    });
                }

                const donateAsset = await prisma.inventoryAsset.findFirst({
                    where: {
                        id: assetId
                    },
                    include: {
                        assetStatus: {
                            include: {
                                inventoryCategory: true
                            }
                        }
                    }
                });

                if (!donateAsset) {
                    return res.status(404).json({
                        status: RES_STATUS.fail,
                        message: "Unable to locate asset",
                    });
                }

                const donateTitle = `Donate`;

                const promises: any[] = [];

                files && files.map((file) => {
                    const buffer: Buffer = fs.readFileSync(file.path);
                    const metaData: UploadMetadata = {
                        contentType: file.mimetype
                    };
                    const pathString = `/attachments/files/${file.filename}`;

                    const upBytes = uploadBytes(storageRef(storage, pathString), buffer, metaData).then(async (s) => {
                        await getDownloadURL(s.ref).then(async (url) => {

                            const donateDetails = {
                                "Beneficiary name": beneficiaryName,
                                "Address": beneficiaryAddress,
                                "Letter of Request": url,
                                "Action": donateTitle
                            };

                            const newRequest = await prisma.assetRequests.create({
                                data: {
                                    eventType: 3,
                                    inventoryAssetId: donateAsset.id,
                                    assetCodeBackup: donateAsset.assetCode,
                                    assetDescBackup: donateAsset.description,
                                    eventTitle: donateTitle,
                                    details: donateDetails,
                                    inventoryCategoryId: donateAsset.assetStatus?.inventoryCategory?.id,
                                    requestorId: user.id
                                },
                            });

                            const newAttachment = await prisma.attachment.create({
                                data: {
                                    originalFileName: file.originalname,
                                    fileType: file.mimetype,
                                    imageSize: file.size,
                                    storageLink: url,
                                    pathString
                                }
                            });

                            await prisma.assetRequestsUploads.create({
                                data: {
                                    attachmentId: newAttachment.id,
                                    assetRequestId: newRequest.id
                                }
                            });

                            await unlinkAsync(file.path);
                        }).catch((e) => console.log(e));
                    }).catch((e) => console.log(e));

                    promises.push(upBytes);
                });

                Promise.all(promises).then(tasks => {
                    return res.status(201).json({
                        status: RES_STATUS.success
                    });
                });
                break;
            default:
                return res.status(401).json({
                    status: RES_STATUS.fail,
                    message: "Unable to process request"
                });
        }
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const AnswerRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const requestId = parseInt(req.body.requestId as string);
        const requestTypeId = parseInt(req.body.requestTypeId as string);
        const rawIsApproved = req.body.approvedStatus as string;
        const isApproved = req.body.approvedStatus as string === "true";
        const reasonDenied = req.body.reasonDenied as string;

        const userId = res.locals.userId as number;

        const foundRequest = await prisma.assetRequests.findFirst({
            where: {
                id: requestId,
                isAnswered: false,
                isArchived: false
            }
        });

        if (!foundRequest) {
            return res.status(401).json({
                status: RES_STATUS.fail,
                message: "Unable to process request"
            });
        }

        if (rawIsApproved != null && (rawIsApproved === "true" || rawIsApproved === "false")) {

            const assetStatusOptions = await prisma.inventoryAssetStatus.findMany({
                include: {
                    inventoryCategory: true
                }
            });

            switch (requestTypeId) {
                // Request view current inventory
                case 1:
                    if (foundRequest.requestorId) {
                        const approvedUser = await prisma.user.findFirst({
                            where: {
                                id: foundRequest.requestorId
                            }
                        });

                        const updatedCustomSettingsData = {
                            ...(approvedUser?.customSettingsData as object),
                            hasCurrentInventoryAccess: rawIsApproved
                        }

                        await prisma.user.update({
                            where: {
                                id: foundRequest.requestorId
                            },
                            data: {
                                customSettingsData: updatedCustomSettingsData
                            }
                        });
                    }

                    await prisma.assetRequests.update({
                        where: {
                            id: requestId
                        },
                        data: {
                            isAnswered: true,
                            isApproved,
                            respondedId: userId
                        }
                    });

                    if (!isApproved) {
                        const updatedDetails = {
                            ...(foundRequest.details as object),
                            "*Denied": reasonDenied
                        };

                        await prisma.assetRequests.update({
                            where: {
                                id: foundRequest.id
                            },
                            data: {
                                details: updatedDetails
                            }
                        });
                    }

                    return res.status(201).json({
                        status: RES_STATUS.success
                    });
                // [Outgoing] Turnover
                case 2:
                    const turnOverRequest = await prisma.assetRequests.update({
                        where: {
                            id: requestId
                        },
                        data: {
                            isAnswered: true,
                            isApproved,
                            respondedId: userId
                        },
                        include: {
                            requestor: {
                                select: {
                                    profile: true
                                }
                            },
                            respondent: {
                                select: {
                                    id: true,
                                    profile: true
                                }
                            }
                        }
                    });

                    if (!turnOverRequest.inventoryAssetId) {
                        return res.status(401).json({
                            status: RES_STATUS.fail
                        });
                    }

                    if (isApproved) {
                        const reqDetails = turnOverRequest.details as { "Requesting unit": string, "DepartmentId": number, "Location": string };

                        const turnOverAsset = await prisma.inventoryAsset.update({
                            where: {
                                id: turnOverRequest.inventoryAssetId
                            },
                            data: {
                                assetStatusId: assetStatusOptions[4].id,
                                owner: reqDetails["Requesting unit"],
                                departmentId: reqDetails["DepartmentId"]
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
                            "Owner": reqDetails["Requesting unit"],
                            "Unit/Department": turnOverAsset.department?.name,
                            "Location": reqDetails["Location"],
                            "Action": turnOverTitle,
                            "Action Requested By": turnOverRequest.requestor?.profile?.fullName,
                            "Action Approved By": turnOverRequest.respondent?.profile?.fullName,
                        };

                        await prisma.inventoryAssetLogs.create({
                            data: {
                                inventoryAssetId: turnOverAsset.id,
                                assetCodeBackup: turnOverAsset.assetCode,
                                eventTitle: turnOverTitle,
                                details: turnOverDetails,
                                responsibleId: turnOverRequest.respondent?.id,
                                inventoryCategoryId: turnOverAsset.assetStatus?.inventoryCategory?.id,
                                assetStatusId: turnOverAsset.assetStatus?.id
                            },
                        });
                    } else {
                        const updatedDetails = {
                            ...(foundRequest.details as object),
                            "*Denied": reasonDenied
                        };
                        console.log(updatedDetails)
                        await prisma.assetRequests.update({
                            where: {
                                id: foundRequest.id
                            },
                            data: {
                                details: updatedDetails
                            }
                        });
                    }

                    return res.status(201).json({
                        status: RES_STATUS.success
                    });
                // [Outgoing] Purchase
                case 3:
                    const purchaseRequest = await prisma.assetRequests.update({
                        where: {
                            id: requestId
                        },
                        data: {
                            isAnswered: true,
                            isApproved,
                            respondedId: userId
                        },
                        include: {
                            requestor: {
                                select: {
                                    profile: true
                                }
                            },
                            respondent: {
                                select: {
                                    id: true,
                                    profile: true
                                }
                            }
                        }
                    });

                    if (!purchaseRequest.inventoryAssetId) {
                        return res.status(401).json({
                            status: RES_STATUS.fail
                        });
                    }

                    if (isApproved) {
                        const purchaseAsset = await prisma.inventoryAsset.update({
                            where: {
                                id: purchaseRequest.inventoryAssetId
                            },
                            data: {
                                assetStatusId: assetStatusOptions[7].id,
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

                        const purDetails = purchaseRequest.details as { "Requester name": string, "Affiliation": string, "Position": string, "Bidding price": string };

                        const purchaseTitle =
                            `[${purchaseAsset.assetStatus?.inventoryCategory?.name}] ${purchaseAsset.assetStatus?.display}`;

                        const purchaseDetails = {
                            "Sold To": purDetails["Requester name"],
                            "Affiliation": purDetails["Affiliation"],
                            "Position": purDetails["Position"],
                            "Price": purDetails["Bidding price"],
                            "Action": purchaseTitle,
                            "Action Requested By": purchaseRequest.requestor?.profile?.fullName,
                            "Action Approved By": purchaseRequest.respondent?.profile?.fullName,
                        };

                        await prisma.inventoryAssetLogs.create({
                            data: {
                                inventoryAssetId: purchaseAsset.id,
                                assetCodeBackup: purchaseAsset.assetCode,
                                eventTitle: purchaseTitle,
                                details: purchaseDetails,
                                responsibleId: purchaseRequest.respondent?.id,
                                inventoryCategoryId: purchaseAsset.assetStatus?.inventoryCategory?.id,
                                assetStatusId: purchaseAsset.assetStatus?.id
                            },
                        });
                    } else {
                        const updatedDetails = {
                            ...(foundRequest.details as object),
                            "*Denied": reasonDenied
                        };

                        await prisma.assetRequests.update({
                            where: {
                                id: foundRequest.id
                            },
                            data: {
                                details: updatedDetails
                            }
                        });
                    }

                    return res.status(201).json({
                        status: RES_STATUS.success
                    });
                // [Outgoing] Donation
                case 4:
                    const donateRequest = await prisma.assetRequests.update({
                        where: {
                            id: requestId
                        },
                        data: {
                            isAnswered: true,
                            isApproved,
                            respondedId: userId
                        },
                        include: {
                            requestor: {
                                select: {
                                    profile: true
                                }
                            },
                            respondent: {
                                select: {
                                    id: true,
                                    profile: true
                                }
                            }
                        }
                    });

                    if (!donateRequest.inventoryAssetId) {
                        return res.status(401).json({
                            status: RES_STATUS.fail
                        });
                    }

                    if (isApproved) {
                        const donateAsset = await prisma.inventoryAsset.update({
                            where: {
                                id: donateRequest.inventoryAssetId
                            },
                            data: {
                                assetStatusId: assetStatusOptions[8].id,
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

                        const donDetails = donateRequest.details as { "Beneficiary name": string, "Address": string, "Letter of Request": string };

                        const donateTitle =
                            `[${donateAsset.assetStatus?.inventoryCategory?.name}] ${donateAsset.assetStatus?.display}`;

                        const donateDetails = {
                            "Beneficiary": donDetails["Beneficiary name"],
                            "Address": donDetails["Address"],
                            "Letter of Request": donDetails["Letter of Request"],
                            "Action": donateTitle,
                            "Action Requested By": donateRequest.requestor?.profile?.fullName,
                            "Action Approved By": donateRequest.respondent?.profile?.fullName,
                        };

                        await prisma.inventoryAssetLogs.create({
                            data: {
                                inventoryAssetId: donateAsset.id,
                                assetCodeBackup: donateAsset.assetCode,
                                eventTitle: donateTitle,
                                details: donateDetails,
                                responsibleId: donateRequest.respondent?.id,
                                inventoryCategoryId: donateAsset.assetStatus?.inventoryCategory?.id,
                                assetStatusId: donateAsset.assetStatus?.id
                            },
                        });
                    } else {
                        const updatedDetails = {
                            ...(foundRequest.details as object),
                            "*Denied": reasonDenied
                        };

                        await prisma.assetRequests.update({
                            where: {
                                id: foundRequest.id
                            },
                            data: {
                                details: updatedDetails
                            }
                        });
                    }

                    return res.status(201).json({
                        status: RES_STATUS.success
                    });
                default:
                    return res.status(401).json({
                        status: RES_STATUS.fail,
                        message: "Unable to process request"
                    });
            }
        } else {
            return res.status(404).json({
                status: RES_STATUS.fail,
                message: "Invalid answer",
            });
        }
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const CloseRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.requestId as string);

        await prisma.assetRequests.update({
            where: {
                id
            },
            data: {
                isArchived: true
            },
        });

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

const HideRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.body.requestId as string);
        const userRole = res.locals.role as "SUPER_ADMIN" | "OFFICE_ADMIN";

        if (userRole === "SUPER_ADMIN") {
            await prisma.assetRequests.update({
                where: {
                    id
                },
                data: {
                    isHiddenAdmin: true
                },
            });
        } else if (userRole === "OFFICE_ADMIN") {
            await prisma.assetRequests.update({
                where: {
                    id
                },
                data: {
                    isHiddenNonAdmin: true
                },
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

export default {
    GetAssetRequests,
    CreateAssetRequest,
    AnswerRequest,
    CloseRequest,
    HideRequest
};
