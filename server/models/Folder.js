import mongoose from "mongoose";
const folderSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true
    },
    category : {
        type : String,
        default : "General"
    },
    channelId : {
        type : String , 
        required : true
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    members : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }]
},{
    timestamps : true,
})

const Folder = mongoose.model("Folder" , folderSchema);
export default Folder;