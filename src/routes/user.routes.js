import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js"
import { upload } from "../middlewares/mullter.middleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)
// throw new Error("Intentional error to check import");

export default router