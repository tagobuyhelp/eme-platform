import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        studentId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
        },
        phone: {
            type: String,
            trim: true,
        },
        course: {
            type: String,
            trim: true,
        },
        documents: [
            {
                type: String,
            }
        ],
        profilePhoto: {
            type: String,
        },
        status: {
            type: String,
            enum: ["pending", "active", "rejected", "inactive"],
            default: "pending",
        },
    },
    { timestamps: true }
);

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;

