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

    thumbnailPath : String,
    
    // streamPath: String,
    streamPath: String,

    variants: [
    {
        resolution: {
            type: String,
            enum: ["360p", "720p", "1080p"],
            required: true
        },
        playlist: {
            type: String,
            required: true
        }
    }
    ]

}, { timestamps : true});

module.exports = mongoose.model('Video', videoSchema);