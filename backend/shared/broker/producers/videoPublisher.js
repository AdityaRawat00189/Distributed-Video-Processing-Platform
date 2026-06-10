const { getChannel } = require('../connection');
const { EXCHANGE, VIDEO_UPLOADED } = require('../queue');

async function publishVideoUploaded(videoData) {
    try {
        const messageBuffer = Buffer.from(JSON.stringify(videoData));
        const channel = getChannel();
        const published = await channel.publish(EXCHANGE, VIDEO_UPLOADED, messageBuffer, {
            persistent : true
        });
        
        console.log(`✅ Published message to exchange ${EXCHANGE} with routing key ${VIDEO_UPLOADED}`);
        console.log(`📤 Message content:`, videoData);
        return published;
    } catch (error) {
        console.error(`❌ Error publishing message: ${error.message}`);
        console.error(`❌ Stack trace:`, error.stack);
        throw error;
    }
}

module.exports = {
    publishVideoUploaded
}