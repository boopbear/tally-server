import { Request, Response, NextFunction } from "express";
import { prisma } from "../server";
import { RES_STATUS } from "../constants";

const GetNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(res.locals.userId as string);
    const notificationUserActions = await prisma.notificationUserAction.findMany({
      where: {
        notifiedUserId: userId,
        hidden: false,
      },
      include: {
        notification: true
      },
      orderBy: {
        id: "desc"
      }
    });

    return res.status(201).json({
      status: RES_STATUS.success,
      notificationUserActions
    });
  } catch (error: any) {
    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

const AutoViewedNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawIds = req.body.notifUserActionIds || [];
    const ids = Array.isArray(rawIds)
      ? rawIds.filter(r => r !== "").map(r => { return parseInt(r); }).filter(r => !isNaN(r))
      : [parseInt(rawIds)].filter(r => !isNaN(r));

    if (ids != null && ids.length > 0) {
      await prisma.notificationUserAction.updateMany({
        where: {
          id: {
            in: ids
          }
        },
        data: {
          viewed: true,
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

const HideNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.body.notifUserActionId as string);

    await prisma.notificationUserAction.update({
      where: {
        id
      },
      data: {
        hidden: true,
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

export default {
  GetNotifications,
  AutoViewedNotification,
  HideNotification
};
