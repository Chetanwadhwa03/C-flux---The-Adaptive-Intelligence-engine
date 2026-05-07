import mongoose, { model, Schema } from "mongoose";

const Knowledgebaseschema = new Schema({
    chatid:{type:mongoose.Schema.Types.ObjectId, required:true},
    chunk:{type:String, required:true},
    embeddings:{type:[Number], required:true},
    chunkindex : {type:Number, required:true}
}, {timestamps:true})

const Knowledgebasemodel = model('Knowledgebase', Knowledgebaseschema);
export default Knowledgebasemodel