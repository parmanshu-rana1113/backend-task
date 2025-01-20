import mongoose from "mongoose";

// Define schema for images
const imageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        processedName: {
            type: String,
            required: true,
        },
        path: {
            type: String,
            required: true,
        },
        similarityScore: {
            type: Number,
            default: 0,
        },
        uploadDate: {
            type: Date,
            default: Date.now,
        },
        
    },
    { timestamps: true }
);

const Image = mongoose.model("Image", imageSchema);
export default Image;
