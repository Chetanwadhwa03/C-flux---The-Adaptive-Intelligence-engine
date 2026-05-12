import Redisclient from "./config/Redisclient.js";
import chunker from "./Utils/Chunker.js";
import { PDFParse } from 'pdf-parse';
import dotenv from 'dotenv'
import { GoogleGenAI } from "@google/genai";
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config();

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string
})

const index = pc.index('c-flux-index');




// Creating a delay function for the rate-limiting part of sending request to the gemini SDK
const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const processwork = async (work: string) => {
    const parsedwork = JSON.parse(work);
    const { type, chatid } = parsedwork;

    if (type === 'ingestion') {
        const { link, mimetype } = parsedwork;

        // 1. Fetching the file from the cloudinary link.
        const response = await fetch(link);

        if (!response.ok) {
            throw new Error('Error encountered while fetching the file from the cloudinary');
        }

        const arraybuffer = await response.arrayBuffer()
        const filebuffer = Buffer.from(arraybuffer)

        // 2. Parsing the file keeping in mind , the file can be pdf or the text files.
        let content: string = "";

        if (mimetype === 'text/plain') {
            content = filebuffer.toString()
        }
        else if (mimetype === 'application/pdf') {

            // @ts-ignore
            const pdfcontent = new PDFParse({ data: filebuffer })
            const result = await pdfcontent.getText();
            content = (result.text);
        }

        // 3. Chunking the content  
        const chunks = chunker(content, 1000, 200);

        // 4. Getting the embedding vectors for the chunks.
        // a) Creating the instance corresponding to the class 

        // @ts-ignore
        const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string })

        //b) to convert the chunks in to the embeddings
        let pineconedata = [];
        for (let i = 0; i < chunks.length; i++) {
            try {
                const currchunk = chunks[i];


                if (currchunk) {
                    const response = await genai.models.embedContent({
                        model: "gemini-embedding-001",
                        contents: currchunk
                    })

                    // Array of 768 numbers representing the vectors.
                    const vectorarray = response.embeddings?.[0]?.values;

                    if (vectorarray) {
                        const fabricatedata = {
                            id: `${chatid}-chunk-${i + 1}`,
                            values: vectorarray,
                            metadata: {
                                text: currchunk,
                                chatid: chatid,
                            }
                        }
                        pineconedata.push(fabricatedata);
                    }
                    console.log(`Embedding vector for ${i + 1} chunk has been stored to pinecone`);

                    if (pineconedata.length === 100 || i === chunks.length-1) {
                        console.log(`Storing the ${pineconedata.length} chunks vector in the pinecone `)
                        await index.upsert({ records: pineconedata })
                        console.log(`Ingestion completed for batchsize ${pineconedata.length}, the Database has been updated`);
                        pineconedata = [];
                    }
                    
                    await delay(300);
                }
            }
            catch (e) {
                console.log('Error encountered while converting the chunks to vectors and storing them in pinecone as ', e);
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

