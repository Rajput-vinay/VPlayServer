import  mongoose  from "mongoose";

const SubscriptionSchema = new mongoose.Schema({

    subscriber:{
         type:mongoose.Schema.Types.ObjectId,
         ref: "User"
    },

    channel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
})

export const subscription = mongoose.model("subscription",SubscriptionSchema)