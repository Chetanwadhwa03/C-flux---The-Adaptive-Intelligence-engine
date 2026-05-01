import { createClient } from "redis";
import dotenv from 'dotenv'

dotenv.config()

// @ts-ignore
const Redisclient = createClient({
    url:process.env.RedisClientURL
})

Redisclient.on('error', (e)=>{
    console.log('Redis Client creation error as ',e);
})

export default Redisclient