import multer from 'multer' 
const storage = multer.memoryStorage();

const fileFilter = (req:any, file:Express.Multer.File, cb:multer.FileFilterCallback)=>{
    if(file.mimetype === 'application/pdf' || file.mimetype === 'text/plain'){
        cb(null,true);
    }
    else{
        cb(new Error('File type can only be pdf and text file only'));
    }
}

const upload  = multer({
    storage:storage,
    fileFilter:fileFilter,
    limits:{
        fileSize:5*1024*1024
    }
})

export default upload;
