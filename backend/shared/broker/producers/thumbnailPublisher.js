const { getChannel } = require("../connection");
const { EXCHANGE, VIDEO_TRANSCODED } = require("../queue");

async function publishVideoTranscoded(videoData) {
    try {
        const messageBuffer = Buffer.from(JSON.stringify(videoData));
        const channel = getChannel();
        const published = await channel.publish(EXCHANGE, VIDEO_TRANSCODED,messageBuffer, {
            persistent : true
        });

        console.log(`✅ Published message to exchange ${EXCHANGE} with routing key ${VIDEO_TRANSCODED}`);
        console.log(`📤 Message content:`, videoData);
        return published;
    } catch (error) {
        console.error(`❌ Error publishing message during Thumbnail: ${error.message}`);
        console.error(`❌ Stack trace:`, error.stack);
        throw error;
    }
}

module.exports = {
    publishVideoTranscoded,
}