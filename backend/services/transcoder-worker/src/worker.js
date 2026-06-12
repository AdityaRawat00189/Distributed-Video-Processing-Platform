const { connectRabbitMQ } = require('../../../shared/broker/connection');
const { VIDEO_TRANSCODED_QUEUE } = require('../../../shared/broker/queue');

const Video = require('../../api-server/src/models/video');
const connectDB = require('../../api-server/src/config/mongo');  // Need to be shifted to Shared 
const { downloadVideo } = require('./downloader');
const { transcodeToHLS } = require('./ffmpeg');
const { uploadHLSFiles } = require('./uploader');
const { cleanup } = require('./cleanup');

async function startWorker() {
    try {
        connectDB();
        const channel = await connectRabbitMQ();
        console.log(`🎬 Worker started and connected to RabbitMQ`);

        // The outer try/catch only handles connecting to the queue
        channel.consume(VIDEO_TRANSCODED_QUEUE, async (msg) => {
            if (!msg) {
                console.warn(`⚠️ Received null message, skipping`);
                return;
            }

            // Move these INSIDE so they are unique to each message being processed
            let localVideoPath, outputDir; 

            // Inner try/catch/finally handles the actual message processing
            try {
                const content = JSON.parse(msg.content.toString());
                console.log(`✅ Received message from queue ${VIDEO_TRANSCODED_QUEUE}:`, content);

                const { videoId } = content;
                console.log(`videoId : ${videoId}`);
                
                await Video.findByIdAndUpdate(videoId, {
                    status: "TRANSCODING"
                });

                localVideoPath = await downloadVideo(content);
                console.log(`✅ Video Downloaded Successfully at ${localVideoPath}`);

                outputDir = await transcodeToHLS(videoId, localVideoPath);
                console.log(`✅ HLS Generated at ${outputDir}`);

                await uploadHLSFiles(videoId, outputDir);
                console.log(`✅ HLS Stored in minIO`);

                await Video.findByIdAndUpdate(videoId, {
                    status: "DONE",
                    streamPath: `processed/${videoId}/playlist.m3u8`
                });

                channel.ack(msg);
                
            } catch (error) {
                console.error(`❌ Message Processing Error: ${error.message}`);
                // Now msg is in scope, so nack() will work correctly
                channel.nack(msg, false, false); 
            } finally {
                // This now runs after EACH individual video finishes or fails
                if (localVideoPath || outputDir) {
                    cleanup(localVideoPath, outputDir);
                    console.log(`🧹 Cleanup completed for video.`);
                }
            }
        });

    } catch (error) {
        // This catch handles failures to start the worker (e.g., RabbitMQ is down)
        console.error(`❌ Worker Startup Error: ${error.message}`);
    }
}

startWorker();