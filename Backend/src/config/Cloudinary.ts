import {v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'
import streamifier from 'streamifier'

dotenv.config()

// @ts-ignore
cloudinary.config({
    cloud_name:process.env.CLOUDNINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadbuffertocloudinary = (file: Buffer) : Promise<string>=>{
    return new Promise((resolve,reject)=>{
        const uploadstream = cloudinary.uploader.upload_stream(
            (error,result) =>{
                if(error){
                    return reject(error)
                }
                if(result){
                    return resolve(result.secure_url)
                }
            }
        )

        streamifier.createReadStream(file).pipe(uploadstream)
    })
}

export default uploadbuffertocloudinary

