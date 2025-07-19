import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import { useDeferredValue, useReducer } from "react";

const generateAccessAndRefreshTokens = async(userId) =>{
  try {
    const user = await User.findById(userId) 
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    user.save({validateBeforeSave: false})

    return {accessToken,refreshToken}

  }
  catch {
    throw new ApiError(500, "Something went wrong while generating or accessing token")
  }
}


const registerUser = asyncHandler(async (req, res) => {
    const {fullname, email, username, password} = req.body 

    if(
        [fullname, email, username, password].some((field) =>
            field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required")
        }
    
    const existingUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existingUser) throw new ApiError(409, "user with credentials already exists")

    // console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
    }



    if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar local path is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage =  await uploadOnCloudinary(coverImageLocalPath)

    // if (!coverImage) {
    //   throw new ApiError(400, "Cloudinary upload failed or coverImage is invalid");
    // }

    if (!avatar) {
      throw new ApiError(400, "Cloudinary upload failed or avatar is invalid");
    }

   const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
   })

  const createdUser =  await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser) {
    throw new ApiError(500, "Something went wrong")
  }

  return res.status(201).json(
    new apiResponse(200, createdUser, "User registered successfully")
  )
})

const loginUser = asyncHandler(async (req, res) =>{
  const {email, username, password} = req.body
  if(!username || !email) {
    throw new ApiError(400, "Username or password required")
  }

  const user = await User.findOne({
    $or: [{username,email}]
  })

  if(!user) {
    throw new ApiError(404, "User does not exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password) 

   if(!isPasswordValid) {
    throw new ApiError(404, "Password is not valid")
   }

  const {accessToken,refreshToken} =  await generateAccessAndRefreshTokens(user._id)

  //cookie later




})
export {registerUser}