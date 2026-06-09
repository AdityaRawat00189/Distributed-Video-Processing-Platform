const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/distributed-video-processing';
        await mongoose.connect(uri);

        console.log(`✅ MongoDB Connected`);
    } catch ( err ) {
        
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;