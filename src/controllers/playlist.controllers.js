import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    try{
const {name ,description} = req.body;
const creator = req.params
  if(!name){
    throw new ApiError(401, "name not found")
  }
  if(!description){
    throw new ApiError(401, "description not found")
  }
  if(!creator){
    throw new ApiError(401, "creator  not found")
  }

  const newPlaylist = await Playlist.create({
    name,
    description,
    owner:creator,
    videos:[],
  })
  res.status(200).json(
    new ApiResponse(201, `${name} created`, newPlaylist)
  )
    }catch(e){
        console.error("Error creating playlist:", error);
        res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
        }
        
    
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    if(!isValidObjectId(userId)){
        throw new ApiError(404,"Invalid user Id")
    }

    // find playlist by the specified user id
    const playlist = await Playlist.find({owner:userId})
    .select('name description videos')
    .populate(`videos`, 'title')

    return res.status(200).json(
        new ApiResponse(
            new ApiResponse(200, "Playlists retrieved:", playlists)
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(401, "play list not found")
    }
    const playlist = await Playlist.findById({playlistId})

    if(!playlist){
        throw new ApiError(401, "playlist not exists")
    }

    return res.status(200).json(
        new ApiResponse(201, playlist, "successfully playlist fetched")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(404,"something went wrong in playlist id")
    }

    
    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"something went wrong in videos id")
    }

    const playlist = await Playlist.findById({playlistId})

    if(!playlist){
        throw new ApiError(404, "something went wrong in api playlist")
    }

    playlist.videos.push(videoId)

    await playlist.save()

    return res.status(200).json(
        new ApiResponse(200, "Video added to playlist successfully", playlist)
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(404,
     "Invalid Playlist")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "Invalid videos")
    }
     
    const playlist  = await Playlist.findById({playlistId})
    if(!playlist){
        throw new ApiError(401, "invalid playlist ")
    }

    const videoIndex = await playlist.videos.indexOf(videoId)
    if(videoIndex === -1){
        throw new ApiError(401, "invalid video index")
    }

    // remove of playlist
    playlist.videos.splice(videoIndex, 1);


    // Save the updated playlist into database
    await playlist.save();

   return res.status(200).json(
        new ApiResponse(200, "Video removed from playlist successfully", playlist)
    );
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(404, "invalid playlist")
    }

    const playlist = await Playlist.findById(playlistId)

    const userId = req.user.id

    if(!userId){
        throw new ApiError(404, "invalid playlist")
    }

    if(playlist.owner.toString() !== userId.toString()){
        throw new ApiError(404, "You are not authorized person for delete these video")
    }

    await playlist.remove();
    
    return res.status(200).json(
        new ApiResponse(201, "successfully delete the video")
    )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    const userId = req.user.id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(401,"Invalid playlist")

    }

    const playlist = await Playlist.findById(playlistId)

    if(!userId){
        throw new ApiError(401,"Invalid userId")
    }

    if(playlist.owner.toString() !== userId.toString){
        throw new ApiError(402,"Your are not authorised person ")
    }

    playlist.name =name
    playlist.description = description

    await playlist.save({validateBeforeSave: false })
 

    return res.status(200).json(
        new ApiError(201,"successfully update the playlist")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}