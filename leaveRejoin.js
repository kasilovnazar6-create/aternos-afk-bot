const mineflayer = require('mineflayer');
const log = require('./logger');

function leaveRejoin(bot, settings) {
    const { server, bot: botSettings } = settings;
    
    async function performRejoin() {
        log.warn('Бот перезаходит для обхода ограничений Aternos...');
        
        bot.end();
        
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        const newBot = mineflayer.createBot({
            host: server.ip,
            port: server.port,
            username: botSettings.username,
            version: server.version,
            auth: botSettings.auth
        });
        
        if (global.registerBotEvents) {
            global.registerBotEvents(newBot);
        }
    }
    
    const rejoinInterval = 2 * 60 * 60 * 1000;
    setTimeout(() => {
        performRejoin();
        setInterval(performRejoin, rejoinInterval);
    }, rejoinInterval);
}

module.exports = leaveRejoin;