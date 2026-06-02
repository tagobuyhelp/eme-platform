import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ["admin", "student"],
            default: "student",
        },
        profilePhoto: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

userSchema.set("toJSON", {
    transform(doc, ret) {
        delete ret.password;
        return ret;
    },
});

userSchema.set("toObject", {
    transform(doc, ret) {
        delete ret.password;
        return ret;
    },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
