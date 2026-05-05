import express from 'express'
import { createServer } from 'http'
import bcrypt from 'bcrypt'
import Usermodel from './Models/User.js';
import { z } from 'zod';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import mongoose from 'mongoose';
import upload from './Middleware/Multer.js';
import uploadbuffertocloudinary from './config/Cloudinary.js';


import Auth from './Middleware/Auth.js';
import Chatmodel from './Models/Chat.js';
import Messagemodel from './Models/Message.js';
import Redisclient from './config/Redisclient.js';



dotenv.config()

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
const server = createServer(app);

app.use(express.json());

const zodschema = z.object({
    username: z.string().max(10, 'Max length of the username can be 10 only'),
    email: z.email(),
    password: z.string().max(10, 'Max length of the password can be 10 only').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/)
})

type zodtype = z.infer<typeof zodschema>

app.post('/api/v1/signup', async (req, res) => {
    try {
        const { username, email, password }: zodtype = req.body

        if (!email || !username || !password) {
            return res.status(400).json({
                message: 'Please enter all the credentials'
            })
        }

        const result = zodschema.safeParse(req.body);

        if (result.success) {
            const hashedpassword = await bcrypt.hash(password, 12);
            await Usermodel.create({
                username: username,
                email: email,
                password: hashedpassword
            })

            res.status(200).json({
                message: 'Signup Successful !!!'
            })
        }
        else {
            console.log('Validation failed for the user credentials');
            return res.status(400).json({
                message: result.data
            })
        }
    }
    catch (e) {
        console.log('Error encountered in signup as ', e);
        res.status(500).json({
            message: 'Internal Server Error'
        })
    }
})

app.post('/api/v1/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: 'Please enter all the credentials'
            })
        }

        const curruser = await Usermodel.findOne({
            email: email
        })

        if (!curruser) {
            return res.status(400).json({
                message: 'Please signup first'
            })
        }

        const hashedpassword = curruser.password;
        const userid = curruser._id;

        // @ts-ignore
        const result = bcrypt.compare(password, hashedpassword);

        if (!result) {
            return res.status(403).json({
                message: 'Password is incorrect !!'
            })
        }

        // @ts-ignore
        const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY
        const token = jwt.sign({
            email, userid
        }, JWT_SECRET_KEY);

        res.status(200).json({
            message: 'Signin Successful, Welcome to C-Flux!',
            token: token
        })
    }
    catch (e) {
        console.log('Error encountered in signin as ', e);
        res.status(500).json({
            message: 'Internal Server error'
        })
    }

})

app.post('/api/v1/newchat', Auth, async (req, res) => {
    try {
        const email = res.locals.email
        const { chatname, model } = req.body

        const curruser = await Usermodel.findOne({
            email: email
        })

        if (!curruser) {
            return res.status(400).json({
                message: 'Something went wrong! please signup again'
            })
        }

        const userid = curruser._id;

        await Chatmodel.create({
            userid: userid,
            chatname: chatname,
            model: model
        })

        res.status(200).json({
            message: 'Chat Created successfully !!'
        })
    }
    catch (e) {
        console.log('Error encountered while making the newchat as ', e);
        res.status(500).json({
            message: 'Internal Server Error'
        })
    }
})

app.get('/api/v1/get-chat', Auth, async (req, res) => {
    try {
        const userid = res.locals.userid;

        const curruserchats = await Chatmodel.find({
            userid: userid
        })

        // Here i have just sent the curruserchats even though it's size is 0, because i have left it over the frontend to handle it , if the size is 0 then it will show newchat or createchat option and if it isn't then it will show the present chats from this array.

        return res.status(200).json({
            curruserchats: curruserchats
        })
    }
    catch (e) {
        console.log('Error encountered while fetching the chat for the side bar as ', e);
        return res.status(500).json({
            message: 'Internal Server Error'
        })
    }
})

app.get('/api/v1/get-chat/:chatid/messages', Auth, async (req, res) => {
    try {
        const chatid = req.params.chatid

        if (typeof chatid !== 'string') {
            return res.status(400).json({
                message: 'Chatid should be a single string'
            })
        }

        if (!mongoose.Types.ObjectId.isValid(chatid)) {
            return res.status(400).json({
                message: 'Chatid is invalid'
            })
        }


        let page = 1;
        if (typeof req.query.p === 'string') {
            page = parseInt(req.query.p) || 1;
        }

        let limit = 50;
        if (typeof req.query.limit === 'string') {
            limit = parseInt(req.query.limit) || 50;
        }

        const skip = (page - 1) * limit;

        const currchat = await Messagemodel.find({
            chatid: chatid
        }).sort({ createdAt: -1 }).skip(skip).limit(limit);

        const totalmessagesinchat = await Messagemodel.countDocuments({
            chatid: chatid
        })

        const totalpages = Math.ceil(totalmessagesinchat / limit)


        res.status(200).json({
            currchatmessages: currchat,
            pagination: {
                currentpage: page,
                totalpages: totalpages,
                hasmore: page < totalpages
            }
        })
    }
    catch (e) {
        console.log(`Error encountered while fetching the messages for the ${req.params.chatid}`);
        res.status(500).json({
            message: 'Internal Server Error'
        })
    }

})

app.post('/api/v1/post-chat/:chatid/messages', async (req, res) => {
    try {
        const { chatid } = req.params
        const { content } = req.body

        const messagegot = {
            chatid: chatid,
            chattype: 'user',
            content: content
        }

        // @ts-ignore
        await Messagemodel.create(messagegot)

        await Redisclient.lPush('AI_handling_messages', JSON.stringify(messagegot));
        console.log('Message pushed to the redis queue');

        res.status(200).json({
            message: 'Processing!!!'
        })

    }
    catch (e) {
        console.log('Error encountered in the postmessage API as ', e);
        res.status(500).json({
            message: 'Internal Server Error'
        })
    }
})

app.post('/api/v1/:chatid/upload-files', Auth, upload.single('pdffile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'Please upload the file !'
            })
        }
        const pdffilebuffer = req.file.buffer
        const {chatid} = req.params

        const uploadfilelink = await uploadbuffertocloudinary(pdffilebuffer)

        const ingestionobj = {
            type: 'ingestion',
            link: uploadfilelink,
            chatid: chatid
        }

        await Redisclient.lPush('AI_handling_messages', JSON.stringify(ingestionobj));

        res.status(200).json({
            message: 'File uploaded, loading in the background'
        })
    }
    catch (e) {
        res.status(500).json({
            message:'Internal Server Error'
        })
        console.log('Error encountered while uploading the file as : ',e)
    }
})



const connect = async () => {
    try {
        await Redisclient.connect();
        console.log('Redis client connected!');

        server.listen(PORT, () => {
            console.log(`Server is listening on the ${PORT}`);
        })

    }
    catch (e) {
        console.log('Error during connection either to redis or server as ', e);
    }
}
connect();


