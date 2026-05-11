import Redisclient from "./config/Redisclient.js";
import chunker from "./Utils/Chunker.js";
import { PDFParse } from 'pdf-parse';
import dotenv from 'dotenv'
import { GoogleGenAI } from "@google/genai";

dotenv.config();



// Creating a delay function for the rate-limiting part of sending request to the gemini SDK
const delay = (ms:number)=>{
    return new Promise((resolve)=>(setTimeout(resolve,ms)));
}

const processwork = async (work: string) => {
    const parsedwork = JSON.parse(work);
    const {type,chatid} = parsedwork;

    if(type === 'ingestion'){
        const {link,mimetype} = parsedwork;

        // 1. Fetching the file from the cloudinary link.
        const response = await fetch(link);

        if(!response.ok){
            throw new Error('Error encountered while fetching the file from the cloudinary');
        }

        const arraybuffer = await response.arrayBuffer()
        const filebuffer = Buffer.from(arraybuffer)

        // 2. Parsing the file keeping in mind , the file can be pdf or the text files.
        let content:string = "";

        if(mimetype === 'text/plain'){
            content = filebuffer.toString()
        }
        else if (mimetype === 'application/pdf'){
            
            // @ts-ignore
            const pdfcontent  = new PDFParse({data:filebuffer})
            const result = await pdfcontent.getText();
            content = (result.text);
            
        }

        // 3. Chunking the content  
        const chunks = chunker(content, 1000,200);

        // 4. Getting the embedding vectors for the chunks.
        // a) Creating the instance corresponding to the class 
        
        // @ts-ignore
        const genai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY as string})

        //b) to convert the chunks in to the embeddings
        for(let i = 0; i<chunks.length; i++){
            const currchunk = chunks[i];

            
            if(currchunk){
                const response = await genai.models.embedContent({
                    model:"text-embedding-004",
                    contents:currchunk
                })

                // Array of 768 numbers representing the vectors.
                const vectorarray = response.embeddings?.[0]?.values

                if(!vectorarray){
                    console.warn(`google didn't return the embedding for the chunk ${i+1}`)
                }

                console.log(`Embedding vector for ${i+1} chunk is ${vectorarray}`)

                await delay(300);   
            }
        } 




    }
    // else if (type === 'messageprocess'){



    // }


}






const connectworker = async () => {
    try {
        await Redisclient.connect();
        console.log('Redis client in the worker connected !');

        while (1) {
            try {
                const work = await Redisclient.brPop('AI_handling_messages', 0);

                if (work) {
                    await processwork(work.element);
                    console.log('The work has been fetched and completed in the worker !')
                }
            }
            catch (e) {
                console.log('Error encountered while the fetching the work from redisclient as ', e);
            }
        }
    }
    catch (e) {
        console.log('Error encountered while connecting to the redisclient in the worker as : ', e);
    }
}

connectworker();

