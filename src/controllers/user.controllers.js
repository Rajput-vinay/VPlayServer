import asyncHandler  from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary,deleteOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {subscription} from "../models/subscriptions.models.js"
import jwt from "jsonwebtoken"
import  mongoose  from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const refreshToken = user.generateAccessToken();
        const accessToken = user.generateRefreshToken();
    
        user.refreshToken  = refreshToken;
         
        await user.save({validateBeforeSave:false})
          
        return {refreshToken,accessToken}
    
    } catch (error) {
        throw new ApiError(401, "something went wrong while creating or making generateAccessTokenAndRefreshToken")
    }
}

const userRegister = asyncHandler(async(req,res)=>{
    // get user details from the frontend
    // validation - not empty
    //  check if user already exists:username , email
    // check for images , check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    // console.log(req.body)
    const {fullName, username,email,password}=req.body
    // console.log("email: ", email)
    // one way to validate the all filled

    // if(fullName === ""){
    //     throw new ApiError(400, "fullName can not be empty")
    // }
    // if(username === ""){
    //     throw new ApiError(400,"username can not be empty")
    // }
    // if(email === ""){
    //     throw new ApiError(400,"email can not be empty")
    // }
    // if(password === ""){
    //     throw new ApiError(400, "password cannot be empty")
    // }

   if([username,fullName,email,password].some((property) => property.trim() ===  "")){
    throw new ApiError(400, "All fields are required")
   }
  

   const existingUser = await User.findOne({ 
    $or:[{ username }, { email }] 
})
     
if(existingUser){
    throw new ApiError(404,"user allready exist")
}
// console.log(req.files)
const avatarLocalPath = req.files?.avatar[0]?.path
if(!avatarLocalPath){
 throw new ApiError(400,'avatar is required')
}

const uploadAvatar = await uploadOnCloudinary(avatarLocalPath);

if(!uploadAvatar){
    throw new ApiError(400,'Avatar not found')
}

 

let uploadCoverImage ;
if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    uploadCoverImage = req.files.coverImage[0].path
}

const uploadOnCloud = await uploadOnCloudinary(uploadCoverImage)

 
// console.log("coverIMage: ",uploadCoverImage)

 const user = await User.create({
    fullName,
    avatar:uploadAvatar?.url,
    coverImage:uploadOnCloud?.url || "",
    username:username.toLowerCase(),
    password,
    email
 })

 const createdUser = await User.findById(user._id).select(" -password -refreshToken") // select automatic remove password refreshtoken from the response

if(!createdUser){
    throw new ApiError(500,"Something went wrong, While creating user")
}

  return res.status(200).json(
     new ApiResponse(200,createdUser,"Successfully Registered New User")
  )

})

const userLoggedIn =asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const userLoggedOut = asyncHandler(async(req, res) =>{
    //  take userId from the req.user
    //  and find and update the user in db
    //  and clear caches
        await User.findByIdAndUpdate(
            req.user?._id,
            {
                $unset:{
                    refreshToken:1
                },
            },
                {
                    new:true
                },
            )

     const options ={
        httpOnly :true,
        secure:true
     }

     res
     .status(200)
     .clearCookie("accessToken",options)
     .clearCookie("refreshToken",options)
     .json(
         new ApiResponse(200,{},"Logged out successfully")
     )

})

const refreshAccessToken = asyncHandler(async(req,res) =>{
//   take refreshtoken  from the req.cookie se
//    validate token
//   decode the token  
//   find the user from db by using token id  
//   validate the user
//  if user present generate the new refresh token from  accesstoken
//  update the refresh token into the db
//  return res and add refresh and access token in cookies
 
    


const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request")
}

try {
    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if (!user) {
        throw new ApiError(401, "Invalid refresh token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used")
        
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {accessToken, refreshToken: newRefreshToken},
            "Access token refreshed"
        )
    )
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
}
})    

const changeCurrentPassword = asyncHandler(async(req,res) =>{

    // take oldPassword, newPassword from body
    // db me entry check karo ki present hai ki nhi
    // password check karo correct hai ki nhi
    // password correct hai toh new password save kar do
    //  return res

   const {oldPassword, newPassword} = req.body
   const user = await User.findById(req.user?._id)
  const correctPassword = await user.isPasswordCorrect(oldPassword)

  if (!correctPassword) {
    throw new ApiError(400,"Invalid old Password")
  }

  req.password = newPassword
  await user.save({validateBeforeSave:false})

  res.status(200)
     .json(
        new ApiResponse(201,{},"password change successfully")
     )
    
})

const getCurrentUser = asyncHandler(async(req,res) =>{
    // return res
    //  send response
    const user = await User.findById(req.user?._id)
    return res
    .status(200)
    .json(
        new ApiResponse(201,user,"successfully get the current user")
    )
})

const updateAccountDetails = asyncHandler(async(req,res) =>{
    //  fetch the data
    //  validate the data
    //  update the user in db
    //  return res
    const {email , fullName} = req.body

    if(!email){
        throw new ApiError(401,"email not find at the time of UPdate Account details")

    }

    
    if(!fullName){
        throw new ApiError(401,"fullName not find at the time of UPdate Account details")
    }

   const user =await User.findByIdAndUpdate(
        req.user?._id,
        {
          email,
          fullName,
        },
        {
            new: true
        }
    ).select("-password")

    res.status(400).json(
        new ApiResponse(200,user,"email and Password update successfully")
    )
})

const updateUserAvatar = asyncHandler(async(req,res) =>{

    //  take the file path form req,file
    //  validate the localfile path
    //  delete the old image
    //  upload the avatar on cloudinary
    //  update the user details
    //  return res

   
     const avatarLocalPath = req.file?.path
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

   const avatarDelete = await User.findByIdAndDelete(
        req.avatarDelete?._id,
        {
            $unset:{
            avatar:1
                  }
        },
    {
        new:true
    }
    )

  

    const avatar = await uploadOnCloudinary(avatarLocalPath)


   if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }




 const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )

})


const updateUserCoverImage = asyncHandler(async(req,res) =>{

    const coverImageLocalPath = req.file?.path;
    
    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file missing")
    }
// delete privious coverImage file on cloudinary
    const user = await User.findById(req.user?._id)
        .select("-password -refreshToken");

    const previousCoverImage = user.coverImage;
        if (previousCoverImage.public_id) {
            await deleteOnCloudinary(previousCoverImage.public_id);
    }  

    //upload in cloudinary and get a url file so
    const coverImage = await uploadOnCloudinaary(coverImageLocalPath);


    // check coverImage
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on coverImage file in cloudinary")
    }

    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "coverImage file updated successfully !!"
        )
    )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
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
                subscribersCount: {
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
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})


const getWatchHistory = asyncHandler(async(req,res) =>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
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
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
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
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {
    userRegister,
    userLoggedIn,
    userLoggedOut,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
    
}