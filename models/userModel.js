const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        name: {
            type:String,
            required: [true, "Please enter your name!"],
            trim: true
        },
        email: {
            type:String,
            required: [true, "Please enter your email!"],
            trim: true,
            unique:true
        },
        password: {
            type:String, 
             required: [true, "Please enter your password!"],
           
        },

        role: {
            type:Number,
            default: 0 // 0-user ,  1 - admirfgn
           
        },
        avatar: {
            type:String,
            default: "https://res.cloudinary.com/packing3d/image/upload/v1656657709/avatar/default-avatar_g3m57t.jpg"
           
        }
    },
    {
        timestamps:true,
    }
)

module.exports = mongoose.model("User", userSchema)