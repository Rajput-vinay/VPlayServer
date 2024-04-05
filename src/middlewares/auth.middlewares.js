import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        
        //  take token from req.cookie
        const token = req.cookies?.accessToken  || req.header("Authorization").replace("Bearer ","")
    
        if(!token){
            throw new ApiError(401,"token not found ")
        }
    
         //     token ko decode karo
        const decodeTokens = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        //  check the user in db
        //  const user = await User.findById(decodeTokens._id).select("-password -refreshToken")
         const user = await User.findById(decodeTokens._id)
         console.log(user)
    
         if(!user){
            throw new ApiError(400,"user not found in decodeTokens")
         }
    
    
         req.user = user
    
         next()
    } catch (error) {
      return res.status(400).json( 
        new ApiError(401, "Something went wrong in auth Middlewares")
        )
    }


})