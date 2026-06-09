const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    
    title : {
        type : String,
        required : true
    },

    description : {
        type : String
    },

    status : {
        type : String,
        enum: [
        "UPLOADED",
        "TRANSCODING",
        "DONE",
        "FAILED"
        ],
        default: "UPLOADED"
    },

    originalPath : String,

    transcodedPath : String,
    
    streamPath: String

}, { timestamps : true});

module.exports = mongoose.model('Video', videoSchema);