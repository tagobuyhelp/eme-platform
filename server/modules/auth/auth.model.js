import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
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
    virtuals: true,          // ensures the `id` virtual (string alias for _id) is included
    transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
    },
});

userSchema.set("toObject", {
    virtuals: true,
    transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
    },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
