import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteOnCloudinary} from "../utils/cloudinary.js"



const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = `/^video/`,
        sortBy = "createdAt",
        sortType = 1,
        userId = req.user._id } = req.query
    //TODO: get all videos based on query, sort, pagination
    

    //  find user in db

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(404, "user not found")
    }

    const getAllVideosAggregate = await Video.aggregate([
        {
            $match:{
                videoOwner:new mongoose.Types.ObjectId(userId),
                $or:[
                    {
                        title:{
                        $regex:query,
                        $options:"i"
                    }
                },
                {
                    description:{
                        $regex:query,
                        $options:"i"
                    }
                }
                ]
            }
        },
        {
            $sort:{
                [sortBy]:sortType
            }
        },
        {
            $skip:(page -1) * limit
        },
        {
            $limit:parseInt(limit)
        }
    ])

    Video.aggregatePaginate(getAllVideosAggregate,{page,limit}).then((result)=>{
        return res.status(200)
        .json(
            new ApiResponse(
                200,
                result,
                "fetched all videos successfully !!"
            )
        )
    })
    .catch((error)=>{
        console.log("getting error while fetching all videos",error)
        throw error
    })
})


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished = true} = req.body
    // TODO: get video, upload to cloudinary, create video
 
    if(!title || title?.trim() === ""){
        throw new ApiError(401,"title not found")
    }

    if(!description || description?.trim() === ""){
        throw new ApiError(401,"Description not found")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoLocalPath){
        throw new ApiError(401,"Video Local Path not found")
    }

   

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoUploadCloud){
        throw new ApiError(401,"Video not Upload on cloudinary successfully")
    }

    const video  = await Video.create({
        videoFile:{
            public_id:videoFile?.public_id,
            url:videoFile?.url
        },
        thumbnail:{
            public_id:thumbnail?.public_id,
            url:thumbnail?.url
        },
        title,
        description,
        isPublished,
        duration:videoFile?.duration,
        owner:req.user._id,

    })

    if(!video){
        throw new ApiError(401,"Something went wrong while uploading video in db")
    }

    
     return res.status(201).json(
        new ApiResponse(200, video, "video uploaded successfully!!")
    );
     
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
        throw new ApiError(401,"It is not valid Video Id")
    }
  const video = await Video.findById(videoId)

  if(!video){
    throw new ApiError(404,"Video not found in getVideoId")
  }
    return res.status(200).json(new ApiResponse(201,video,"Successfully get Video Details"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title, description} = req.body
    const thumbnailFile = req.file?.path

    if(!isValidObjectId(videoId)){
        throw new ApiError(401,"it is not proper Video id ")
    }

    if(!title || title.trim() === ""){
        throw new ApiError(401,"title not found proper")
    }

    if(!description){
        throw new ApiError(401,"description not found proper")
    }

    if(!thumbnailFile){
     throw new ApiError(401,"thumbnail not found")
    }
    const previousVideo = await Video.findById(videoId)

    if(!previousVideo){
        throw new ApiError(401,"previousVideo not found ")
    }

    let updateFiled = {
       set:{
        title,
        description
       }
    }

    let thumbnailUploadOnCloudinary;
    if(thumbnailFile){
      await deleteOnCloudinary(previousVideo?.thumbnail?.public_id)
   
      thumbnailUploadOnCloudinary = await uploadOnCloudinary(thumbnailFile)

      if(!thumbnailFile){
        throw new ApiError(500,"something went wrong while uploading thumbnailFile")
      }

      updateFiled.set ={
        public_id:thumbnailUploadOnCloudinary?.public_id,
        url:thumbnailUploadOnCloudinary?.url
      }
     
    }

    const updatedVideoDetails = await Video.findByIdAndUpdate(
        videoId,
        updateFields,
        {
            new: true
        }
    )

    if(!updateVideoDetail){
        throw new ApiError(401,"not updateVideoDetails")
    }

    return res.status(200).json(
        new ApiResponse(201,
            updatedVideoDetails,
            "successfully update the video details")
    )
   

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(401,"not vilid object id")
    }

    const video = await Video.findById(videoId)
   
    if(!video){
        throw new ApiError(402,"not proper video")
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401,"You donot have permission to delete video")
    }

    if(video.thumbnail){
        await deleteOnCloudinary(video.thumbnail.public_id)
    }

    if(video.videoFile){
        await deleteOnCloudinary(video.thumbnail.public_id)
    }

    const deleteResponse = await Video.findByIdAndDelete(videoId)

    if(!deleteResponse){
        throw new ApiError(402,"Can't delete the Response")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            deleteResponse,
            "Successfully delete the video"
        )
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(401,"is not valid video id")
    }

    const video  =  await Video.findById(videoId)

    if(!video){
        throw new ApiError(402,"Video not found")
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(402,"Tum chutiya ho jo dusre ka video delete kar rha hai")
    }

    video.isPublished = !video.isPublished

    await video.save({validateBeforeSave: false})

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "video toggle successfully!!"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}