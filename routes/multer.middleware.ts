import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { RES_STATUS } from "../constants";

// Configure multer storage and file name
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, randomUUID() + '-' + file.originalname);
    }
});

// Create multer upload instance
const upload = multer({ storage: storage, limits: { fileSize: 20000000 } });

// Custom file upload middleware
const parseByMulter = (req: Request, res: Response, next: NextFunction) => {
    // Use multer upload instance
    upload.array('attachment', 3)(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                status: RES_STATUS.fail,
                message: err.message
            });
        }

        //Add server side validation

        // Proceed to the next middleware or route handler
        next();
    });
};

export default parseByMulter