import { create } from "domain";
import Redisclient from "./config/Redisclient.js";
import chunker from "./Utils/Chunker.js";
import { PDFParse } from 'pdf-parse';
const processwork = async (work) => {
    const parsedwork = JSON.parse(work);
    const { type, chatid } = parsedwork;
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
        console.log('Chunks of the parsed data are present as: ', chunks);
        // 4. Getting the embedding vectors for the chunks.
    }
    // else if (type === 'messageprocess'){
    // }
};
const connectworker = async () => {
    try {
        await Redisclient.connect();
        console.log('Redis client in the worker connected !');
        while (1) {
            try {
                const work = await Redisclient.brPop('AI_handling_messages', 0);
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