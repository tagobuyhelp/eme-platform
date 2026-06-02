import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        duration: {
            type: String,
            trim: true,
            default: "N/A"
        },
        status: {
            type: String,
            enum: ["active", "draft", "archived"],
            default: "active",
        },
    },
    { timestamps: true }
);

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

export default Course;
