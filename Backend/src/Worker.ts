import Redisclient from "./config/Redisclient.js";
import chunker from "./Utils/Chunker.js";

const processwork = async (work: string) => {
    const parsedwork = JSON.parse(work);
    const {type,chatid} = parsedwork;

    if(type === 'ingestion'){
        const {link} = parsedwork;





    }
    else if (type === 'messageprocess'){



    }


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
                    console.log('The work has been fetched and sent to the worker !')
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

