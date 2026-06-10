const {EXCHANGE, VIDEO_UPLOADED, VIDEO_TRANSCODED_QUEUE, VIDEO_TRANSCODED} = require('./queue');

async function setupTopology(channel) {
    // Create exchange
    await channel.assertExchange(EXCHANGE, 'topic', { durable : true });

    // Create queues
    await channel.assertQueue(VIDEO_TRANSCODED_QUEUE, {durable : true });

    // Bind queues to exchange
    await channel.bindQueue(VIDEO_TRANSCODED_QUEUE, EXCHANGE, VIDEO_UPLOADED);

    console.log(`✅ RabbitMQ Topology Setup Complete`);

}

module.exports = setupTopology;