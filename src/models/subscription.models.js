import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // subscriber
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // channel
        ref: "User"
    },
},
{timestamps: true})



export const subscription = mongoose.model("Subscription", subscriptionSchema)
