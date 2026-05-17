import Redisclient from "./config/Redisclient.js";
import chunker from "./Utils/Chunker.js";
import { PDFParse } from 'pdf-parse';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";
import { Pinecone } from "@pinecone-database/pinecone";
dotenv.config();
const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});
const index = pc.index('c-flux-index');
// Creating a delay function for the rate-limiting part of sending request to the gemini SDK
const delay = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
const processwork = async (work) => {
    const parsedwork = JSON.parse(work);
    const { type, chatid } = parsedwork;
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    if (type === 'ingestion') {
        const { link, mimetype } = parsedwork;
        // 1. Fetching the file from the cloudinary link.
        const response = await fetch(link);
        if (!response.ok) {
            throw new Error('Error encountered while fetching the file from the cloudinary');
        }
        const arraybuffer = await response.arrayBuffer();
        const filebuffer = Buffer.from(arraybuffer);
        // 2. Parsing the file keeping in mind , the file can be pdf or the text files.
        let content = "";
        if (mimetype === 'text/plain') {
            content = filebuffer.toString();
        }
        else if (mimetype === 'application/pdf') {
            // @ts-ignore
            const pdfcontent = new PDFParse({ data: filebuffer });
            const result = await pdfcontent.getText();
            content = (result.text);
        }
        // 3. Chunking the content  
        const chunks = chunker(content, 1000, 200);
        // 4. Getting the embedding vectors for the chunks.
        // a) Creating the instance corresponding to the class 
        //b) to convert the chunks in to the embeddings
        let pineconedata = [];
        for (let i = 0; i < chunks.length; i++) {
            try {
                const currchunk = chunks[i];
                if (currchunk) {
                    const response = await genai.models.embedContent({
                        model: "gemini-embedding-001",
                        contents: currchunk
                    });
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
                        };
                        pineconedata.push(fabricatedata);
                    }
                    console.log(`Embedding vector for ${i + 1} chunk has been stored to pinecone`);
                    if (pineconedata.length === 100 || i === chunks.length - 1) {
                        console.log(`Storing the ${pineconedata.length} chunks vector in the pinecone `);
                        await index.upsert({ records: pineconedata });
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
    else if (type === 'messageprocess') {
        try {
            const { content } = parsedwork;
            const { chatid } = parsedwork;
            // 1. Converting the content in to the embeddings
            console.log('Embedding the prompt given by the user');
            const response = await genai.models.embedContent({
                model: "gemini-embedding-001",
                contents: content
            });
            // vectorarray is just the embedding for the user prompt.
            const vectorarray = response.embeddings?.[0]?.values;
            console.log(`Prompt has been embedded successfully`);
            // 2. checking the cosine similarity with the data present in the pinecone
            let result;
            let contextstring = "";
            if (vectorarray) {
                result = await index.query({
                    vector: vectorarray,
                    topK: 3,
                    includeMetadata: true
                });
                for (let i = 0; i < result.matches.length; i++) {
                    contextstring = contextstring + result.matches[i]?.metadata?.text + "\n\n";
                }
            }
            // 3. Generating the System prompt (Persona , guardrails/limitations of AI, context , user prompt)
            const systemprompt = `
            You are an intelligent document assistant for the C-Flux platform.

            CRITICAL INSTRUCTIONS:
            You are about to take an open-book exam. I am going to provide you with context extracted from a user's uploaded document. 
            You must answer the user's question using ONLY the provided context. 

            If the answer cannot be found in the context below, you must strictly reply with: "I do not have enough information in the document to answer that." 
            Under no circumstances should you guess, hallucinate, or use your general training data to answer.

            CONTEXT FROM DOCUMENT:
            ----------------------
            ${contextstring}
            ----------------------

            USER QUESTION:
            ${content}
            `;
            // 4. Time to send this system prompt to the LLM API and to get the response back
            const responsestream = await genai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: systemprompt
            });
            for await (const chunks of responsestream) {
                console.log('Sending the chunks over the stream of the pub/subs');
                if (chunks.text) {
                    const obj = {
                        type: 'chunks',
                        content: chunks.text,
                        chatid: chatid
                    };
                    Redisclient.PUBLISH('AIstreamingmessages', JSON.stringify(obj));
                }
            }
            const obj = {
                type: 'end',
                chatid: chatid
            };
            Redisclient.PUBLISH('AIstreamingmessages', JSON.stringify(obj));
        }
        catch (e) {
            console.log('Error encountered in messageprocessing in the worker as ', e);
        }
    }
};
const connectworker = async () => {
    try {
        await Redisclient.connect();
        console.log('Redis client in the worker connected !');
        while (1) {
            try {
                const work = await Redisclient.brPop('AI_handling_messages', 0);
                console.log(`The work has been fetched from the queue in the worker`);
                if (work) {
                    await processwork(work.element);
                    console.log('The work has been fetched and completed in the worker !');
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
};
connectworker();
//# sourceMappingURL=Worker.js.map