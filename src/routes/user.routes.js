import { Router } from "express";
import {upload} from "../middlewares/multer.middlewares.js"

// import all controllers
import { 
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
  getWatchHistory } from "../controllers/user.controllers.js";
  
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = new Router();



router.route("/register").post(
       upload.fields([
        {
          name:"avatar",
          maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
       ]),
    userRegister)

    router.route("/login").post(userLoggedIn)
   
    // secured routes
    router.route("/logout").post(verifyJWT,userLoggedOut)
    router.route("/refresh-token").post(refreshAccessToken)
    router.route("/change-password").post(verifyJWT,changeCurrentPassword)
    router.route("/current-user").get(verifyJWT,getCurrentUser)
    router.route("/update-account").patch(verifyJWT,updateAccountDetails)
    router.route("/avatar").patch(verifyJWT,upload.single("avatar"), updateUserAvatar)
    router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
    router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
    router.route("/watch-histroy").get(verifyJWT,getWatchHistory)
export default router
