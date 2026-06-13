const {EXCHANGE, VIDEO_UPLOADED, VIDEO_TRANSCODED_QUEUE, VIDEO_TRANSCODED, THUMBNAIL_QUEUE} = require('./queue');

async function setupTopology(channel) {
    // Create exchange
    await channel.assertExchange(EXCHANGE, 'topic', { durable : true });

    // Create queues
    await channel.assertQueue(VIDEO_TRANSCODED_QUEUE, {durable : true });

    // Bind queues to exchange
    await channel.bindQueue(VIDEO_TRANSCODED_QUEUE, EXCHANGE, VIDEO_UPLOADED);

    // Create queues 2
    await channel.assertQueue(THUMBNAIL_QUEUE, { durable : true });

    // Bind queues to exchange for Queue 2
    await channel.bindQueue(THUMBNAIL_QUEUE, EXCHANGE, VIDEO_TRANSCODED);

    console.log(`✅ RabbitMQ Topology Setup Complete`);

}

module.exports = setupTopology;