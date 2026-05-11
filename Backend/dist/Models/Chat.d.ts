import mongoose from 'mongoose';
declare const Chatmodel: mongoose.Model<{
    model: string;
    userid: mongoose.Types.ObjectId;
    chatname?: string | null;
}, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    model: string;
    userid: mongoose.Types.ObjectId;
    chatname?: string | null;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    model: string;
    userid: mongoose.Types.ObjectId;
    chatname?: string | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    model: string;
    userid: mongoose.Types.ObjectId;
    chatname?: string | null;
}, mongoose.Document<unknown, {}, {
    model: string;
    userid: mongoose.Types.ObjectId;
    chatname?: string | null;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    model: string;
    userid: mongoose.Types.ObjectId;
    chatname?: string | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    model: string;
    userid: mongoose.Types.ObjectId;
    chatname?: string | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    model: string;
    userid: mongoose.Types.ObjectId;
    chatname?: string | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Chatmodel;
//# sourceMappingURL=Chat.d.ts.map