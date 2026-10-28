import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    image: [String],

    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },

    receiverUser: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  { timestamps: true }
);

// Location search index
PostSchema.index({ currentLocation: "2dsphere" });

// Automatically delete posts 7 days after creation
PostSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 }
);

const Post =
  mongoose.models.Post || mongoose.model("Post", PostSchema);

export default Post;