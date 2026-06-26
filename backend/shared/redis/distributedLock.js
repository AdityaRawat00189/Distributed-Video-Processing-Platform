const { redisClient } = require('./client');
const { randomUUID } = require('crypto');

async function acquireLock(key, ttl = 300) {
    const token = randomUUID();
    const result = await redisClient.set(key, token, {
        NX: true,
        EX: ttl,
    });

    return result === 'OK' ? token : null;
}

async function releaseLock(key, token) {
    if (!token) {
        return false;
    }

    const releaseScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
    `;

    try {
        if (redisClient.isOpen) {
            const result = await redisClient.eval(releaseScript, {
                keys: [key],
                arguments: [token],
            });
            return result === 1;
        } else {
            console.warn(`[Redis] Cannot release lock ${key}: Client is already closed.`);
            return false;
        }
    } catch (error) {
        console.error(`[Redis] Error releasing lock ${key}:`, error);
        return false;
    }
}

module.exports = {
    acquireLock,
    releaseLock,
}