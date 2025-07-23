import mongoose, {Schema} from "mongoose";

const likeSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
},
{
    timestamps: true
})

export const Like = mongoose.model("Like",likeSchema)