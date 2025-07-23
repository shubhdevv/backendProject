import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import { useDeferredValue, useReducer } from "react";
import jwt, { decode } from "jsonwebtoken";
import mongoose from "mongoose";

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
  if(!username && !email) {
    throw new ApiError(400, "Username or password required")
  }

  const user = await User.findOne({
   $or: [
  username ? { username } : null,
  email ? { email } : null
].filter(Boolean)

  })

  if(!user) {
    throw new ApiError(404, "User does not exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password) 

   if(!isPasswordValid) {
    throw new ApiError(404, "Password is not valid")
   }

  const {accessToken,refreshToken} =  await generateAccessAndRefreshTokens(user._id)

  //cookies
  const loggedInUser = await User.findById(user._id).
  select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
  .cookie("accessToken",accessToken, options)
  .cookie("refreshToken",refreshToken, options)
  .json(
    new apiResponse(
      200,
      {
        user: loggedInUser, accessToken, refreshToken
      },
      "User logged in successfully"
    )
  )
})

const logoutUser =  asyncHandler(async(req,res) => {
  await User.findByIdAndUpdate (
    req.user._id,
    {
      $unset: {
        refreshToken: 1
      }
    },
    {
      new: true
    }
  )

   const options = {
    httpOnly: true,
    secure: true
  }

  return res.
  status(200).
  clearCookie("accessToken", options).
  clearCookie("refreshToken", options).
  json(new apiResponse(200, {}, "User logged out"))

})

const refreshAccessToken = asyncHandler(async(req,res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  )

  const user = await User.findById(decodedToken?._id)

  if(!user) {
    throw new ApiError(401, "invalid refresh token")
  }

  if(user?.refreshToken !== incomingRefreshToken) 
    throw new ApiError(401, "Refresh token is expired or used")

  const options = {
    httpOnly: true,
    secure: true
  }

  const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", newrefreshToken, options)
  .json(
    new apiResponse (
      200,
      {accessToken, refreshToken: newrefreshToken},
      "access token refreshed successfully"
    )
  )
  
  } catch (error) {
      throw new ApiError(401, error?.message || "invalid refresh token")
  }

})

const changeCurrentPassword = asyncHandler(async(req,res) => {
  const {oldPassword, newPassword} = req.body


  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect) throw new ApiError(400, "invalid password")

  user.password = newPassword
  user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new apiResponse(200, {}, "password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res) => {
  return res
  .status(200)
  .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res) => {
  const {fullname, email} = req.body

  if(!fullname || !email) throw new ApiError("all fields required")

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,

      }
    },
    {new: true}

  ).select("-password")

  return res
  .status(200)
  .json(new apiResponse(200, user, "account details updated successfully"
  ))
 
})

const updateUserAvatar = asyncHandler(async(req,res) => {
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath) throw new ApiError("avatar file missing")

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url) throw new ApiError(400, "error while updating avatar")

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new apiResponse(200, user, "avatar updated successfully"
  ))
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath) throw new ApiError("cover image file missing")

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url) throw new ApiError(400, "error while updating cover image")

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new apiResponse(200, user, "cover image updated successfully"
  ))
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
  const {username} = req.params

  if(!username?.trim()) {
    throw new ApiError(400, "username missing")
  }

const channel = await User.aggregate([
    {
    $match: {
      username: username?.toLowerCase()
    }
    },
    {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "channel",
      as: "subscribers"
    }
  },
  {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "subscriber",
      as: "subscribedTo"
    }
  },
  {
    $addFields: {
      subscriberCount: {
        $size: "$subscribers"
      },
      channelsSubscribedToCount: {
        $size: "$subscribedTo"
      },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
      }
    }
  },
  {
  $project: {
    fullname: 1,
    username: 1,
    subscriberCount: 1,
    channelsSubscribedToCount: 1,
    isSubscribed: 1,
    avatar: 1,
    coverImage: 1,
    email: 1
  }
}
   ])
  
   if(!channel?.length) {
    throw new ApiError(404, "channel does not exist")
   }

   return res
   .status(200)
   .json(
    new apiResponse(200, channel[0], "user channel fetched successfully")
   )
})

const getWatchHistory = asyncHandler(async(req,res) => {
  const user = await User.aggregate ([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id) 
      }
    },
    {
    $lookup: {
      from: "videos",
      localField: "watchHistory",
      foreignField: "id",
      as: "watchHistory",
      pipeline: [
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
              {
                $project: {
                  fullname: 1,
                  username: 1,
                  avatar: 1,

                }
              }
            ]
          }
        },
        {
          $addFields: {
            owner: {
              $first : "$owner"
            }
          }
        }
      ]
    }
  }
  ])
  return res
  .status(200)
  .json(
    new apiResponse(
      200,
      user[0].watchHistory,
      "watch history fetched successfully"
    )
  )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
}