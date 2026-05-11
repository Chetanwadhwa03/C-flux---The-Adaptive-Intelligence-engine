import {v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'
import streamifier from 'streamifier'

dotenv.config()


// @ts-ignore
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadbuffertocloudinary = (file: Buffer) : Promise<string>=>{
    return new Promise((resolve,reject)=>{
        const uploadstream = cloudinary.uploader.upload_stream(

            // mentioned resource-type because cloudinary by default consider all the files being uploaded as image 
            // like jpg / png
        
            {
                resource_type:'raw',
                folder:'c-flux-dev'
            },

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

