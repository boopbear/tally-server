import fs from "fs";
import { promisify } from "util";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../server";
import { RES_STATUS, PAGINATION } from "../constants";
import { Client } from "postmark";
import { getDownloadURL, storage, storageRef, uploadBytes } from "../firebase/firebase.api";
import { UploadMetadata } from "firebase/storage";
import { Role } from "@prisma/client";

export interface RcFile extends Express.Multer.File {
    uid?: string;
    readonly lastModifiedDate?: Date;
}

const postMarkClient = new Client(process.env.POSTMARK_KEY || "");

export const unlinkAsync = promisify(fs.unlink);

const PostAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
    const userId = parseInt(res.locals.userId as string);
    const title = req.body.title as string;
    const paragraph = req.body.paragraph as string;
    const files = req.files as RcFile[];

    try {
        const newPost = await prisma.post.create({
            data: {
                publisherId: userId,
                paragraph,
                title,
            }
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

                    await prisma.postUploads.create({
                        data: {
                            attachmentId: newAttachment.id,
                            postId: newPost.id
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
    } catch (error: any) {
        files.forEach(async (file) => {
            await unlinkAsync(file.path);
        })

        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const UpdateAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.body.postId as string;
    const title = req.body.title as string;
    const paragraph = req.body.paragraph as string;

    try {
        await prisma.post.update({
            where: {
                id: parseInt(id)
            },
            data: {
                title,
                paragraph
            }
        })

        return res.status(200).json({
            status: RES_STATUS.success,
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const ArchiveAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.body.postId as string);

    try {
        await prisma.post.update({
            where: {
                id
            },
            data: {
                isArchived: true
            }
        })

        return res.status(200).json({
            status: RES_STATUS.success,
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const GetAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string);
    const size = parseInt(req.query.size as string);
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    try {
        const skip = ((page || PAGINATION.default.page) - 1) * (size || PAGINATION.default.size);
        const finalSize = size || PAGINATION.default.size;

        const posts = await prisma.post.findMany({
            select: {
                id: true,
                title: true,
                paragraph: true,
                createdAt: true,
                publisher: {
                    select: {
                        profile: {
                            select: {
                                fullName: true,
                                profilePic: {
                                    select: {
                                        storageLink: true
                                    }
                                }
                            }
                        }
                    }
                },
                uploads: {
                    select: {
                        attachment: {
                            select: {
                                storageLink: true,
                                originalFileName: true
                            }
                        }
                    }
                }
            },
            where: {
                isArchived: false
            },
            // ...(page && size ? { skip, take: finalSize } : {}),
            orderBy: {
                createdAt: 'desc',
            },
        })

        const rearrangeData = posts.map((post) => {
            const attachments = post.uploads.map((upload) => {
                return { ...upload.attachment };
            }).filter(a => Object.keys(a).length > 0);
            return {
                ...post,
                attachments
            };
        })

        return res.status(200).json({
            status: RES_STATUS.success,
            posts: rearrangeData
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const PostDiscrepancyReport = async (req: Request, res: Response, next: NextFunction) => {
    const userId = parseInt(res.locals.userId as string);
    const title = req.body.title as string;
    const paragraph = req.body.paragraph as string;
    const files = req.files as RcFile[];
    const sharedWithUserEmails = req.body.sharedWithUserEmails as string[];

    try {
        const newReport = await prisma.discrepancyReport.create({
            data: {
                publisherId: userId,
                paragraph,
                title,
            },
            include: {
                publisher: {
                    include: {
                        profile: true
                    }
                }
            }
        });

        if (sharedWithUserEmails && sharedWithUserEmails.length > 0) {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    isArchived: false
                },
                where: {
                    email: {
                        in: sharedWithUserEmails
                    }
                }
            });

            if (users) {
                const insertSharedWith = users.map((user) => {
                    return { reportId: newReport.id, sharedWithId: user.id };
                });

                await prisma.discrepancyReportUsers.createMany({
                    data: insertSharedWith
                });

                const newNotif = await prisma.notification.create({
                    data: {
                        title: `${newReport.publisher?.profile?.givenName} shared a new report with you.`,
                        description: `See "${newReport.title}"`,
                        createdById: userId
                    }
                })

                const notifUsers = users.filter((user) => user.id !== userId)
                    .map((user) => ({ notificationId: newNotif.id, notifiedUserId: user.id }));

                await prisma.notificationUserAction.createMany({
                    data: notifUsers
                });
            }
        }

        const promises: any[] = [];

        files && files.map((file) => {
            const buffer: Buffer = fs.readFileSync(file.path);
            const metaData: UploadMetadata = {
                contentType: file.mimetype
            };
            const pathString = `/attachments/images/${file.filename}`;

            const upBytes = uploadBytes(storageRef(storage, `/attachments/images/${file.filename}`), buffer, metaData).then(async (s) => {
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

                    await prisma.reportUploads.create({
                        data: {
                            attachmentId: newAttachment.id,
                            reportId: newReport.id
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
    } catch (error: any) {
        files.forEach(async (file) => {
            await unlinkAsync(file.path);
        })

        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const UpdateDiscrepancyReport = async (req: Request, res: Response, next: NextFunction) => {
    const userId = parseInt(res.locals.userId as string);
    const id = req.body.reportId as string;
    const title = req.body.title as string;
    const paragraph = req.body.paragraph as string;
    const sharedWithUserEmails = req.body.sharedWithUserEmails as string[];

    try {
        const updatedReport = await prisma.discrepancyReport.update({
            where: {
                id: parseInt(id)
            },
            data: {
                title,
                paragraph
            },
            include: {
                publisher: {
                    include: {
                        profile: true
                    }
                }
            }
        });

        await prisma.discrepancyReportUsers.deleteMany({
            where: {
                reportId: updatedReport.id
            }
        });

        if (sharedWithUserEmails && sharedWithUserEmails.length > 0) {
            const users = await prisma.user.findMany({
                select: {
                    id: true
                },
                where: {
                    email: {
                        in: sharedWithUserEmails
                    }
                }
            });

            if (users) {
                const insertSharedWith = users.map((user) => {
                    return { reportId: updatedReport.id, sharedWithId: user.id };
                });

                await prisma.discrepancyReportUsers.createMany({
                    data: insertSharedWith
                });

                const newNotif = await prisma.notification.create({
                    data: {
                        title: `${updatedReport.publisher?.profile?.givenName} shared an updated report with you.`,
                        description: `See "${updatedReport.title}"`,
                        createdById: userId
                    }
                })

                const notifUsers = users.filter((user) => user.id !== userId)
                    .map((user) => ({ notificationId: newNotif.id, notifiedUserId: user.id }));

                await prisma.notificationUserAction.createMany({
                    data: notifUsers
                });
            }
        }
        return res.status(200).json({
            status: RES_STATUS.success,
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const ArchiveDiscrepancyReport = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.body.reportId as string;

    try {
        await prisma.discrepancyReport.update({
            where: {
                id: parseInt(id)
            },
            data: {
                isArchived: true
            }
        })

        return res.status(200).json({
            status: RES_STATUS.success,
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

const GetDiscrepancyReports = async (req: Request, res: Response, next: NextFunction) => {
    const userId = parseInt(res.locals.userId as string);
    const userRole = res.locals.role as Role;
    const page = parseInt(req.query.page as string);
    const size = parseInt(req.query.size as string);
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    try {
        const skip = ((page || PAGINATION.default.page) - 1) * (size || PAGINATION.default.size);
        const finalSize = size || PAGINATION.default.size;

        const reports = await prisma.discrepancyReport.findMany({
            select: {
                id: true,
                title: true,
                paragraph: true,
                createdAt: true,
                publisher: {
                    select: {
                        profile: {
                            select: {
                                fullName: true,
                                profilePic: {
                                    select: {
                                        storageLink: true
                                    }
                                }
                            }
                        }
                    }
                },
                uploads: {
                    select: {
                        attachment: {
                            select: {
                                storageLink: true,
                                originalFileName: true
                            }
                        }
                    }
                },
                discrepancyReportUsers: {
                    select: {
                        sharedWith: {
                            select: {
                                email: true
                            }
                        }
                    }
                }
            },
            where: {
                isArchived: false,
                ...(userRole === "SUPER_ADMIN" ? {} : {
                    discrepancyReportUsers: {
                        some: {
                            sharedWithId: userId
                        }
                    }
                })
            },
            // ...(page && size ? { skip, take: finalSize } : {}),
            orderBy: {
                createdAt: 'desc',
            },
        });

        const rearrangeData = reports.map((report) => {
            const attachments = report.uploads.map((upload) => {
                return { ...upload.attachment };
            }).filter(a => Object.keys(a).length > 0);
            const sharedWithUserEmails: string[] = report.discrepancyReportUsers.map((reportUser) => {
                return reportUser.sharedWith?.email || "";
            }).filter(email => email !== "");
            return {
                ...report,
                attachments,
                sharedWithUserEmails
            };
        });

        return res.status(200).json({
            status: RES_STATUS.success,
            reports: rearrangeData
        });
    } catch (error: any) {
        return res.status(500).json({
            status: RES_STATUS.error,
            message: error.message,
        });
    }
};

export default {
    PostAnnouncement,
    UpdateAnnouncement,
    ArchiveAnnouncement,
    GetAnnouncements,
    PostDiscrepancyReport,
    UpdateDiscrepancyReport,
    ArchiveDiscrepancyReport,
    GetDiscrepancyReports
}