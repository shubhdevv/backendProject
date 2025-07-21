import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
import { useDeferredValue } from "react";

export const verifyJWT = asyncHandler(async (req,res, next) => {
    try {
         const token = req.cookies?.accessToken || req.header
    ("Authorization")?.replace("Bearer ", "")

    if(!token) throw new ApiError(401, "Unauthorized access")

    const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decode?._id).select("-password - ")

    if(!user) throw new ApiError(401, "Invalid Access Token")

    req.user = user
    next()

    } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token")
    }

})