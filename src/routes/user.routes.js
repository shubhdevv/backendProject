// console.log("✅ user.routes.js loaded!");

import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js"

const router = Router()

router.route("/register").post(registerUser)
// throw new Error("Intentional error to check import");

export default router