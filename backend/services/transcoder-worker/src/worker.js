const { connectRabbitMQ } = require('../../../shared/broker/connection');
const { VIDEO_TRANSCODED_QUEUE } = require('../../../shared/broker/queue');

const Video = require('../../api-server/src/models/video');
const connectDB = require('../../api-server/src/config/mongo');

async function startWorker() {
    try {
        connectDB();
        const channel = await connectRabbitMQ();
        console.log(`🎬 Worker started and connected to RabbitMQ`);

        channel.consume(VIDEO_TRANSCODED_QUEUE, async(msg) => {
            if(!msg) {
                console.warn(`⚠️ Received null message, skipping`);
                return;
            }

            const content = JSON.parse(msg.content.toString());
            console.log(`✅ Received message from queue ${VIDEO_TRANSCODED_QUEUE}:`, content);

            const { videoId } = content;
            console.log(`videoId : ${videoId}`);
            await Video.findByIdAndUpdate(videoId ,{
                status : "TRANSCODING"
            });

            // Simulate processing time
            await new Promise(
                resolve => setTimeout(resolve, 5000)
            );

            await Video.findByIdAndUpdate(videoId, {
                status : "DONE"
            });

            channel.ack(msg);
        })
    }catch (error) {
        console.error(`❌ Worker Error: ${error.message}`);
    }
}

startWorker();