import { Request, Response, NextFunction } from "express";
import { prisma } from "../server";
import { RES_STATUS } from "../constants";

const GetFaqContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const faq = await prisma.fAQContent.findFirst();

    return res.status(201).json({
      status: RES_STATUS.success,
      faq
    });
  } catch (error: any) {
    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

const UpdateFaqContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const content = req.body.content as string;

    const existingFAQ = await prisma.fAQContent.findFirst();

    if (existingFAQ) {
      await prisma.fAQContent.update({
        where: {
          id: 1
        },
        data: {
          content,
          lastUpdated: new Date()
        },
      });
    } else {
      await prisma.fAQContent.create({
        data: {
          content,
          lastUpdated: new Date()
        },
      });
    }


    return res.status(201).json({
      status: RES_STATUS.success,
      message: "Updated successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

export default {
  GetFaqContent,
  UpdateFaqContent
};
