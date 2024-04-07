import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {

  const { channelId } = req.params;
  // TODO: toggle subscription
  if (isValidObjectId(channelId)) {
    throw new ApiError(401, "channel id not found");
  }

  const userId = req.user._id;
  try {
    const condition = {
      subscriber: userId,
      channel: channelId,
    };

    const subscribed = await Subscription.findOne(condition);
    if (!subscribed) {
      const createSubscription = await Subscription.create({});
      return res
        .status(200)
        .json(new ApiResponse(201, { createSubscription }, "subscribed"));
    } else {
      const deleteSubscription = await Subscription.findOneAndDelete(condition);
      return res
        .status(200)
        .json(new ApiResponse(200, { deleteSubscription }, "subscribed"));
    }
  } catch (e) {
    throw new ApiError(400, e.message);
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
 try{
 const {channelId} = req.params
if(!isValidObjectId(channelId)){
 throw new ApiError(401, "channel not found")
}
 const subscribers = await Subscription.find(channelId).populate('subscriber','username');

 res.status(200).json(
    new ApiResponse(200, "Subscribers retrieved:", subscribers)
 )

 }catch(e){
    console.error("Error retrieving subscirbers:", error);
    res.status(500).json(
        new ApiError(500, "Internal Server Error")
    );
 }
 

});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {

    try {
        const { subscriberId } = req.params

        // Populate the 'channel' field with the 'username' field from the User model
        const subscriptions = await Subscription.find({ subscriber: subscriberId })
            .populate('channel', 'username');

        res.status(200).json(
            new ApiResponse(200, "Subscribed channels retrieved:", subscriptions)
        );

    } catch (error) {
        console.error("Error retrieving subscribed channels:", error);
        res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
    }

})

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
