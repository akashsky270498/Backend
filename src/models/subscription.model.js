import mongooose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({

    subscriber: {
        type: Schema.Types.objectId, //One who is subscribing
        ref: "User"
    },

    channel: {
        type: Schema.Types.ObjectId, //The channel to which the user is subscribing (one to whom subscriber is subscriibing)
        ref: "User"
    }
}, { timestamps: true });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);