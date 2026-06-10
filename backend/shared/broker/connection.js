const amqplib = require('amqplib');

let channel;
let connection;

const connectRabbitMQ = async () => {
    try {
        const amqpUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

        connection = await amqplib.connect(amqpUrl);
        channel = await connection.createChannel();

        console.log(`✅ RabbitMQ Connected`);

        connection.on('close', () => {
            console.error(`❌ RabbitMQ Connection Closed`);
        })

        connection.on("error", (err) => {
            console.log(err);
        });

        return channel;

    } catch(error) {
        console.error(`❌ RabbitMQ Connection Error: ${error.message}`);
        process.exit(1);
    }
}

function getChannel() {
    if(!channel) {
        throw new Error('RabbitMQ channel not initialized. Call connectRabbitMQ first.');
    }

    return channel;
}

module.exports = {
    connectRabbitMQ,
    getChannel
};