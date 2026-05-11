import mongoose from "mongoose";
declare const Knowledgebasemodel: mongoose.Model<{
    chatid: mongoose.Types.ObjectId;
    chunk: string;
    embeddings: number[];
    chunkindex: number;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    chatid: mongoose.Types.ObjectId;
    chunk: string;
    embeddings: number[];
    chunkindex: number;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    chatid: mongoose.Types.ObjectId;
    chunk: string;
    embeddings: number[];
    chunkindex: number;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    chatid: mongoose.Types.ObjectId;
    chunk: string;
    embeddings: number[];
    chunkindex: number;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    chatid: mongoose.Types.ObjectId;
    chunk: string;
    embeddings: number[];
    chunkindex: number;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    chatid: mongoose.Types.ObjectId;
    chunk: string;
    embeddings: number[];
    chunkindex: number;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    chatid: mongoose.Types.ObjectId;
    chunk: string;
    embeddings: number[];
    chunkindex: number;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    chatid: mongoose.Types.ObjectId;
    chunk: string;
    embeddings: number[];
    chunkindex: number;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Knowledgebasemodel;
//# sourceMappingURL=Knowledgebase.d.ts.map