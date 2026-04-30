import type { Request, Response, NextFunction } from "express"
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const Auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(403).json({
                message: 'Your current session expired, please login again !!!'
            })
        }

        const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

        // @ts-ignore
        const data = jwt.verify(token, JWT_SECRET_KEY);
        res.locals.email = data.email ;
        next();
    }
    catch(e){
        console.log('Error while verifying the token as ', e);
        return res.status(500).json({
            message:'Error while verifying the token'
        })
    }
}

export default Auth