const path = require("path");

const { connectRabbitMQ, getChannel } = require("../../../shared/broker/connection"); 
const { THUMBNAIL_QUEUE } = require("../../../shared/broker/queue");

const { generateThumbnail } = require('./thumbnail');
const { uploadThumbnail } = require('./uploader');
const { downloadVideo } = require('./downloader');
const { cleanup } = require("./cleanup");

const Video = require("../../api-server/src/models/video");
const connectDB = require('../../api-server/src/config/mongo');  // Need to be shifted to Shared 

async function startWorker() {

    try {
        connectDB();
        await connectRabbitMQ();

        const channel = getChannel();

        console.log('🖼️ Thumbnail Worker Started');

        channel.prefetch(1);

        channel.consume( THUMBNAIL_QUEUE,
            async (msg) => {

                let localVideoPath;
                let thumbnailLocalPath;

                try {

                    const { videoId, objectKey } = JSON.parse( msg.content.toString() );

                    console.log(`📥 Thumbnail Job Received: ${videoId}`);

                    // Download original video
                    localVideoPath = await downloadVideo( videoId, objectKey );

                    console.log(`✅ Video Downloaded`);

                    // Thumbnail output path
                    thumbnailLocalPath =path.join(__dirname,'../temp',`${videoId}.jpg`);

                    // Generate thumbnail
                    await generateThumbnail(
                        localVideoPath,
                        thumbnailLocalPath
                    );

                    console.log(`✅ Thumbnail Generated`);

                    // Upload thumbnail to MinIO
                    const thumbnailPath =
                        await uploadThumbnail(
                            videoId,
                            thumbnailLocalPath
                        );

                    console.log(`✅ Thumbnail Uploaded`);

                    // Update MongoDB
                    await Video.findByIdAndUpdate(videoId, {
                        thumbnailPath
                    });

                    console.log(`✅ Mongo Updated`);

                    channel.ack(msg);

                }
                catch (error) {

                    console.error(`❌ Thumbnail Worker Error:`,error.message);

                    channel.nack(msg,false,false);
                }
                finally {

                    await cleanup(localVideoPath,thumbnailLocalPath);
                }
            }
        );

    }
    catch (error) {

        console.error('❌ Failed To Start Thumbnail Worker:',error);

        process.exit(1);
    }
}

startWorker();