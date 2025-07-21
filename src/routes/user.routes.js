import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js"
import upload from "../middlewares/mullter.middleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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

router.route("/login").post(loginUser)

//secured
router.route("/logout").post(verifyJWT, logoutUser)




export default router