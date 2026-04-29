import mongoose, { Schema, model} from 'mongoose'

const Chatschema = new Schema({
    userid:{type:mongoose.Schema.Types.ObjectId, required:true, ref:'Users', index:true},
    chatname : {type:String},
    model : {type:String, required:true}
})


const Chatmodel = model('Chats', Chatschema);
export default Chatmodel