import { Schema, model} from 'mongoose'

const Userschema = new Schema({
    username : {type:String, unique:true, required:true},
    email:{type:String, unique:true, required:true},
    password:{type:String}
})

const Usermodel = model('Users', Userschema);
export default Usermodel
