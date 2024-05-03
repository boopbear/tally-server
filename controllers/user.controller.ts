import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Prisma, Role, User } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../server";
import * as OTPAuth from "otpauth";
import { encode } from "hi-base32";
import { RES_STATUS, PAGINATION, qrMessage, EXPIRATION, SIGNER_EMAIL } from "../constants";
import { Client } from "postmark"; "postmark";
import QRCode from "qrcode";
import { RcFile, unlinkAsync } from "./posts.controller";
import { storage, storageRef } from "../firebase/firebase.api";
import { UploadMetadata, deleteObject, getDownloadURL, uploadBytes } from "firebase/storage";
import fs from "fs";

const postMarkClient = new Client(process.env.POSTMARK_KEY || "");

const generateRandomBase32 = () => {
  const buffer = crypto.randomBytes(15);
  const base32 = encode(buffer).replace(/=/g, "").substring(0, 24);
  return base32;
};

const generateQRCodeBase64 = async (data: any) => {
  const QRbase64: string = await new Promise((resolve, reject) => {
    QRCode.toDataURL(data, function (err, code) {
      if (err) {
        reject(reject);
        return;
      }
      resolve(code);
    });
  });

  return QRbase64;
}

const isValidEmailAddress = (email: string) => {
  if (email.indexOf("@ust.edu.ph", email.length - "@ust.edu.ph".length) !== -1) {
    return true;
  }
  return false;
}

const LoginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!process.env.API_LOGIN_SECRET || !process.env.API_ACCESS_SECRET) {
      return res.status(500).json({
        status: RES_STATUS.error,
        message: "Missing environment variable",
      });
    }

    const email = req.query.email as string;
    const rmeKey = req.query.rmeKey as string;

    const user = await prisma.user.findFirst({
      where: {
        email,
        isArchived: false
      },
      select: {
        validRme: true,
        validRmeExpiration: true,
        sharedId: true,
        role: true,
        customSettingsData: true,
        profile: {
          select: {
            fullName: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        status: RES_STATUS.fail,
        message: "User does not exists",
      });
    }

    const hasValidRme = user.validRme === rmeKey && user.validRmeExpiration && user.validRmeExpiration >= new Date();
    const expiry = hasValidRme ? EXPIRATION.oneWeekDays : EXPIRATION.quarterOfHour;
    const secret = hasValidRme ? process.env.API_ACCESS_SECRET : process.env.API_LOGIN_SECRET;

    const token = jwt.sign(user.sharedId, secret);

    if (process.env.MY_SERVER_ENV === "production") {
      res.cookie("authcookie", token, { maxAge: expiry, httpOnly: true, sameSite: "none", secure: true });
    } else {
      res.cookie("authcookie", token, { maxAge: expiry, httpOnly: true });
    }

    return res.status(200).json({
      status: RES_STATUS.success,
      isAuthenticated: hasValidRme,
      user: {
        sharedId: user.sharedId,
        role: user.role,
        customSettingsData: user.customSettingsData,
        profile: user.profile
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

const LogoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie("authcookie", { sameSite: "none", secure: true, });

    return res.status(200).json({
      status: RES_STATUS.success
    });
  } catch (error: any) {
    return res.status(500).json({
      status: RES_STATUS.error
    });
  }
};

const GetUserInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sharedId = res.locals.sharedId as string;

    const user = await prisma.user.findFirst({
      where: { sharedId },
      select: {
        email: true,
        role: true,
        createdAt: true,
        lastOtpQrGenerate: true,
        isArchived: true,
        customSettingsData: true,
        profile: {
          include: {
            profilePic: true
          }
        },
        department: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        status: RES_STATUS.fail,
        message: "No information found",
      });
    }

    return res.status(200).json({
      status: RES_STATUS.success,
      user
    });
  } catch (error: any) {
    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

const GetUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string);
    const size = parseInt(req.query.size as string);
    const fullName = req.query.fullName as string;
    const departmentId = parseInt(req.query.departmentId as string);
    const archived = req.query.active as string === "false";

    const fullNameSearch = fullName && fullName !== "undefined" ? fullName : '';
    const skip = ((page || PAGINATION.default.page) - 1) * (size || PAGINATION.default.size);
    const finalSize = size || PAGINATION.default.size;

    // const userIds = await prisma.$queryRaw<{ id: number }[]>`
    // SELECT u.id FROM Users u
    // JOIN Profile p ON u.id = p.userId
    // WHERE u.isArchived = ${archived}
    // AND p.fullName LIKE ${fullNameSearch}

    // `;

    // if (!userIds) {
    //   return res.status(404).json({
    //     status: RES_STATUS.fail,
    //     message: "No users found",
    //   });
    // }

    const users = await prisma.user.findMany({
      where: {
        isArchived: archived,
        isHidden: false,
        profile: {
          fullName: {
            contains: fullNameSearch
          }
        },
        ...(departmentId && departmentId > 0 ? { departmentId } : {})
      },
      // ...(page && size ? { skip, take: finalSize } : {}),
      select: {
        id: true,
        email: true,
        role: true,
        department: true,
        customSettingsData: true,
        isArchived: true,
        profile: true
      }
    });

    if (!users) {
      return res.status(404).json({
        status: RES_STATUS.fail,
        message: "No information found",
      });
    }

    return res.status(200).json({
      status: RES_STATUS.success,
      users
    });
  } catch (error: any) {
    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

const RegisterUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyName = req.body.familyName as string;
    const givenName = req.body.givenName as string;
    const employeeNumber = req.body.employeeNumber as string;
    const email = req.body.email as string;
    const birthDate = req.body.birthDate as Date;
    const role = req.body.role as Role;
    const departmentId = parseInt(req.body.departmentId);
    const customSettingsData = JSON.parse(req.body.customSettingsData);

    const fullName = `${givenName} ${familyName}`;

    if (!(isValidEmailAddress(email))) {
      return res.status(404).json({
        status: RES_STATUS.fail,
        message: "Invalid email address domain",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        isArchived: false
      }
    });

    if (existingUser) {
      return res.status(409).json({
        status: RES_STATUS.fail,
        message: "Email already exists",
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        role,
        departmentId,
        customSettingsData
      },
    });

    await prisma.profile.create({
      data: {
        userId: user.id,
        givenName,
        familyName,
        fullName,
        employeeNumber,
        birthDate
      }
    });

    return res.status(201).json({
      status: RES_STATUS.success,
      message: "Registered successfully",
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          status: RES_STATUS.fail,
          message: "Email already exist",
        });
      }
    }
    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

const UpdateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.body.userId);
    const familyName = req.body.familyName as string;
    const givenName = req.body.givenName as string;
    const employeeNumber = req.body.employeeNumber as string;
    const email = req.body.email as string;
    const birthDate = req.body.birthDate as Date;
    const role = req.body.role as Role;
    const departmentId = parseInt(req.body.departmentId);
    const customSettingsData = JSON.parse(req.body.customSettingsData);

    const fullName = `${givenName} ${familyName}`;

    if (!(isValidEmailAddress(email))) {
      return res.status(404).json({
        status: RES_STATUS.fail,
        message: "Invalid email address domain",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        email,
        role,
        departmentId,
        customSettingsData
      }
    });

    await prisma.profile.update({
      where: { userId },
      data: {
        givenName,
        familyName,
        fullName,
        birthDate,
        employeeNumber,
      }
    });

    return res.status(200).json({
      status: RES_STATUS.success,
      message: "User info updated"
    });
  } catch (error: any) {
    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

const UpdateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as RcFile[];

  try {
    const userId = parseInt(req.body.userId);
    const familyName = req.body.familyName as string;
    const givenName = req.body.givenName as string;
    const employeeNumber = req.body.employeeNumber as string;
    const birthDate = req.body.birthDate as Date;

    const rawRetainedAttachmentIds = req.body.retainedAttachmentId || [];
    const retainedAttachmentIds = Array.isArray(rawRetainedAttachmentIds)
      ? rawRetainedAttachmentIds.filter(r => r !== "").map(r => { return parseInt(r); }).filter(r => !isNaN(r))
      : [parseInt(rawRetainedAttachmentIds)].filter(r => !isNaN(r));

    const fullName = `${givenName} ${familyName}`;

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        givenName,
        familyName,
        fullName,
        birthDate,
        employeeNumber,
      }
    });

    if (updatedProfile.profilePicId != null) {
      const currentUpload = await prisma.attachment.findFirst({
        where: {
          ...(retainedAttachmentIds ? {
            NOT: {
              id: {
                in: retainedAttachmentIds
              }
            }
          } : {})
        },
      });

      if (currentUpload) {
        const fileRef = currentUpload.pathString ?? currentUpload.storageLink;

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
            id: currentUpload.id
          }
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

          await prisma.profile.update({
            where: {
              id: updatedProfile.id
            },
            data: {
              profilePicId: newAttachment.id
            }
          });

          await unlinkAsync(file.path)
            .catch((e) => console.log(e));
        }).catch((e) => console.log(e));
      }).catch((e: any) => console.log(e));

      promises.push(upBytes);
    });

    Promise.all(promises).then(tasks => {
      return res.status(201).json({
        status: RES_STATUS.success,
        message: "Updated profile successfully",
      });
    });
  } catch (error: any) {
    files.forEach(async (file) => {
      await unlinkAsync(file.path)
        .catch((e) => console.log(e));
    });

    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

const ArchiveUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.body.userId);

    await prisma.user.update({
      where: {
        id
      },
      data: {
        isArchived: true
      },
    });

    return res.status(200).json({
      status: RES_STATUS.success,
      message: "User has been archived"
    });
  } catch (error: any) {
    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

const UnarchiveUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.body.userId);

    await prisma.user.update({
      where: {
        id
      },
      data: {
        isArchived: false
      },
    });

    return res.status(200).json({
      status: RES_STATUS.success,
      message: "User has been enabled"
    });
  } catch (error: any) {
    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

const HideUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.body.userId);

    await prisma.user.update({
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
      message: "User has been removed"
    });
  } catch (error: any) {
    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

const GoogleSyncProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sharedId = res.locals.sharedId as string;
    const { googleId, email, givenName, familyName, fullName, profilePicId } = req.body;

    const user = await prisma.user.update({
      where: {
        sharedId,
        googleId,
        isArchived: false
      },
      data: {
        email
      }
    })

    if (!user) {
      return res.status(404).json({
        status: RES_STATUS.fail,
        message: "User doesn't exist",
      });
    }

    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        givenName,
        familyName,
        fullName,
        profilePicId,
      }
    });

    res.status(200).json({
      status: RES_STATUS.success,
      message: "User profile is up to date"
    });
  } catch (error: any) {
    res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

const GenerateOTP = async (req: Request, res: Response) => {
  try {
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
      }
    });

    if (!user) {
      return res.status(404).json({
        status: RES_STATUS.fail,
        message: "User does not exists",
      });
    }

    const base32_secret = generateRandomBase32();

    let totp = new OTPAuth.TOTP({
      issuer: "UST_Tally",
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 15,
      secret: base32_secret,
    });

    let otpauth_url = totp.toString().replace("UST_Tally:", "").replace("%40", "@");

    const new_otp = await prisma.otpToken.create({
      data: {
        otp_base32: base32_secret,
        otp_auth_url: otpauth_url,
      }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpTokenId: new_otp.id,
        lastOtpQrGenerate: new Date()
      },
    });

    const subject = "Verify Login";
    const message = qrMessage(user.profile?.fullName || "User");
    const contentId = `qr-${(new Date).getTime()}-0`;
    const QRbase64 = (await generateQRCodeBase64(otpauth_url)).replace("data:image/png;base64,", "");
    const qrName = `${contentId}.png`;

    postMarkClient.sendEmail({
      "From": SIGNER_EMAIL,
      "To": user.email,
      "Subject": subject,
      "HtmlBody": message,
      "Attachments": [{
        "ContentID": contentId,
        "Content": QRbase64,
        "Name": qrName,
        "ContentType": "image/jpeg"
      }]
    }).catch((e: any) => console.log(e.message));

    return res.status(200).json({
      status: RES_STATUS.success
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const VerifyOTP = async (req: Request, res: Response) => {
  try {
    if (!process.env.API_ACCESS_SECRET) {
      return res.status(500).json({
        status: RES_STATUS.error,
        message: "Missing environment variable",
      });
    }

    const sharedId = res.locals.sharedId as string;
    const otpToken = req.query.otpToken as string;
    const rememberMe = req.query.rememberMe as string;

    const user = await prisma.user.findFirst({
      where: { sharedId },
      select: {
        id: true,
        email: true,
        sharedId: true,
        otpToken: {
          select: {
            otp_base32: true
          }
        }
      }
    });

    const message = "Token is invalid or user doesn't exist";

    if (!user) {
      return res.status(401).json({
        status: RES_STATUS.fail,
        message,
      });
    }

    let totp = new OTPAuth.TOTP({
      issuer: "UST_Tally",
      algorithm: "SHA1",
      digits: 6,
      secret: user.otpToken?.otp_base32!,
    });

    let delta = totp.validate({ token: otpToken, window: 1 });

    if (delta === null) {
      return res.status(401).json({
        status: RES_STATUS.fail,
        message,
      });
    }

    const rememberUser = rememberMe && rememberMe === "true";
    const newRmeKey = generateRandomBase32();

    if (rememberUser) {
      const current = new Date();
      const fiveDays = current.setDate(current.getDate() + 5);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          validRme: newRmeKey,
          validRmeExpiration: new Date(fiveDays)
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          validRme: null,
          validRmeExpiration: null
        },
      });
    }

    const token = jwt.sign(user.sharedId, process.env.API_ACCESS_SECRET);
    const expiry = rememberUser ? EXPIRATION.oneWeekDays : EXPIRATION.quarterToADay;

    res.clearCookie("authcookie");

    if (process.env.MY_SERVER_ENV === "production") {
      res.cookie("authcookie", token, { maxAge: expiry, httpOnly: true, sameSite: "none", secure: true });
    } else {
      res.cookie("authcookie", token, { maxAge: expiry, httpOnly: true });
    }

    return res.status(200).json({
      status: RES_STATUS.success,
      message: "User has a valid OTP token",
      emailAuthenticated: user.email,
      newRmeKey: rememberUser ? newRmeKey : null
    });
  } catch (error: any) {
    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
};

const RemoveOTP = async (req: Request, res: Response) => {
  try {
    const sharedId = res.locals.sharedId as string;

    await prisma.user.update({
      where: { sharedId },
      data: {
        otpToken: undefined
      }
    })

    return res.status(200).json({
      status: RES_STATUS.success,
      message: "Removed OTP from user",
    })
  } catch (error: any) {
    return res.status(500).json({
      status: RES_STATUS.error,
      message: error.message,
    });
  }
}

export default {
  LoginUser,
  LogoutUser,
  GetUserInfo,
  GetUsers,
  RegisterUser,
  UpdateUser,
  UpdateUserProfile,
  ArchiveUser,
  UnarchiveUser,
  HideUser,
  GoogleSyncProfile,
  GenerateOTP,
  VerifyOTP,
  RemoveOTP
};
