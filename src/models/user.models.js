import mongoose from "mongoose";
import  bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema =new mongoose.Schema(
    {

        username:{
            type:String,
            required:true,
            unique:true,
            trim:true,
            lowercase:true

        },
        email:{
            type:String,
            required:true,
            lowercase:true,
            unique:true

          },
          fullName:{
            type:String,
            required:true
          },
          avatar:{
            type:String,
            required:true
          },
          coverImage:{
               type:String,

          },
          password:{
            type:String,
            required:true,
          },
          refreshToken:{
            type:String,
        
          },
          watchHistory:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video"
            }
          ],


    },
    {
        timestamps:true,
    }
    )

// use pre middleware to encrypt my password before entry in db
userSchema.pre('save', async function(){
    if(!this.isModified('password')) return next()
   this.password = await bcrypt.hash(this.password,10)
    next()
});

// check the password is match or not

userSchema.method.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)
}


//  generateAccessToken

userSchema.method.generateAccessToken = function(){
   return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

//  GENERATE REFRESHTOKEN

userSchema.methods.generateRefreshToken = function(){
  return jwt.sign (
     {
       _id:this._id,
     },
    process.env.REFRESH_TOKEN_SECRET,

    {
       expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export const User = mongoose.model('User',userSchema)