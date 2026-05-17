import { WebSocketServer } from "ws";
import { Server } from 'http';
import Redisclient from "./config/Redisclient.js";
// chatid->socket
const collection = new Map();
const websocketconnection = (newServer) => {
    try {
        const wss = new WebSocketServer({ server: newServer });
        wss.on('connection', (socket) => {
            try {
                let globalchatid = null;
                console.log('Decoupled websocket server has been connected !!!');
                // Since i have to understand and do the proper implementation of it. I'll do it later on.
                // const pingInterval = setInterval(() => {
                //     const obj = { type: 'ping' }
                //     socket.send(JSON.stringify(obj));
                // }, 5000);
                // socket.on('message') it listens for the message event from the react client , but the AI messages will be coming for the redis worker , so we have to separate both of the things according to what is coming from where.
                socket.on('message', (data) => {
                    const parseddata = JSON.parse(data);
                    // 'join' will come from the client telling to make the socket join to the chatid in the map.
                    if (parseddata.type === 'join') {
                        globalchatid = parseddata.chatid;
                        // @ts-ignore
                        collection.set(globalchatid, socket);
                        console.log('The socket has been added to the map corresponding to the chatid');
                    }
                });
                socket.on('close', () => {
                    // @ts-ignore
                    collection.delete(globalchatid);
                    console.log(`Socket connection for the ${globalchatid} has been closed`);
                });
            }
            catch (e) {
                console.log('Error encountered when the message sent on the websocket as ', e);
            }
        });
    }
    catch (e) {
        console.log('Error encountered while connecting the websocket server as ', e);
    }
};
const redisclientconnect = async () => {
    try {
        const subscriber = Redisclient.duplicate();
        await subscriber.connect();
        console.log('Subscriber Connected in the websocket server.');
        subscriber.SUBSCRIBE('AIstreamingmessages', (data) => {
            console.log('In the subscriber to receive the messages in the websocket server');
            try {
                const parseddata = JSON.parse(data);
                const { chatid } = parseddata;
                if (chatid && collection.has(chatid)) {
                    // @ts-ignore
                    collection.get(chatid).send(JSON.stringify(parseddata));
                }
            }
            catch (e) {
                console.log('Error encountered while sending the message to the client through websocket server as ', e);
            }
        });
    }
    catch (e) {
        console.log('Error encountered while connecting to the subscriber in the websocket server as ', e);
    }
};
redisclientconnect();
export default websocketconnection;
//# sourceMappingURL=Websocketserver.js.map