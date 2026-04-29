import mongoose, {Schema, model} from "mongoose";

const Messageschema = new Schema({
    chatid:{type:mongoose.Schema.Types.ObjectId, required:true, index:true, ref:'Chats'},
    chattype : {type:String, enum:['assistant','user'] , required:true},
    content : {type:String, required:true},
}, {timestamps:true})

const Messagemodel = model('Messages', Messageschema)
export default Messagemodel