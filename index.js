const mineflayer = require('mineflayer');
const express = require('express');
const log = require('./logger');
const leaveRejoin = require('./leaveRejoin');
const settings = require('./settings.json');

// ---- НАСТРОЙКИ ИЗ ФАЙЛА ----
const { server, bot: botSettings, antiAFK, reconnect } = settings;

// ---- ДВИЖЕНИЯ БОТА ----
const movementState = {
    isWalking: false,
    currentDirection: 'forward',
    circleAngle: 0
};

// ---- ГЛОБАЛЬНАЯ ФУНКЦИЯ ДЛЯ РЕГИСТРАЦИИ СОБЫТИЙ БОТА ----
global.registerBotEvents = (bot) => {
    log.info(`Бот ${bot.username} создан, подключаемся к ${server.ip}:${server.port}`);

    bot.on('login', () => {
        log.success(`Бот ${bot.username} зашел на сервер!`);

        // Авто-регистрация/логин
        if (botSettings.autoAuthPassword) {
            bot.chat(`/register ${botSettings.autoAuthPassword} ${botSettings.autoAuthPassword}`);
            bot.chat(`/login ${botSettings.autoAuthPassword}`);
        }

        // Запуск анти-АФК системы
        if (antiAFK.enabled) {
            startAntiAFK(bot);
        }
    });

    bot.on('kicked', (reason) => {
        log.warn(`Бот кикнут: ${JSON.stringify(reason)}`);
    });

    bot.on('end', (reason) => {
        log.warn(`Бот отключился: ${reason}`);
        if (reconnect.enabled) {
            attemptReconnect();
        }
    });

    bot.on('error', (err) => {
        log.error(`Ошибка бота: ${err.message}`);
    });

    // Запуск переподключения с перезаходом
    leaveRejoin(bot, settings);
};

// ---- ФУНКЦИЯ АНТИ-АФК С ДВИЖЕНИЯМИ ----
function startAntiAFK(bot) {
    log.info('Запущена система анти-АФК с движениями');

    // Приседание
    setInterval(() => {
        if (bot && bot.entity) {
            bot.setControlState('sneak', true);
            setTimeout(() => {
                if (bot && bot.entity) {
                    bot.setControlState('sneak', false);
                }
            }, 500);
        }
    }, antiAFK.sneakInterval || 30000);

    // Прыжки
    setInterval(() => {
        if (bot && bot.entity) {
            bot.setControlState('jump', true);
            setTimeout(() => {
                if (bot && bot.entity) {
                    bot.setControlState('jump', false);
                }
            }, 300);
        }
    }, antiAFK.jumpInterval || 15000);

    // Вращение камерой
    setInterval(() => {
        if (bot && bot.entity) {
            const yaw = Math.random() * Math.PI * 2;
            const pitch = Math.random() * Math.PI / 2 - Math.PI / 4;
            bot.look(yaw, pitch, true);
        }
    }, antiAFK.lookInterval || 5000);

    // Ходьба (случайные направления)
    if (antiAFK.walkEnabled) {
        startRandomWalk(bot);
    }
}

// ---- СЛУЧАЙНАЯ ХОДЬБА ----
function startRandomWalk(bot) {
    const directions = ['forward', 'back', 'left', 'right'];
    
    function changeWalkDirection() {
        if (!bot || !bot.entity) return;
        
        // Останавливаем текущее движение
        directions.forEach(dir => {
            bot.setControlState(dir, false);
        });
        
        // Выбираем случайное направление
        const newDirection = directions[Math.floor(Math.random() * directions.length)];
        movementState.currentDirection = newDirection;
        movementState.isWalking = true;
        
        bot.setControlState(newDirection, true);
        
        // Ходим 2-5 секунд
        const walkDuration = Math.random() * 3000 + 2000;
        setTimeout(() => {
            if (bot && bot.entity && movementState.isWalking) {
                bot.setControlState(newDirection, false);
                movementState.isWalking = false;
            }
        }, walkDuration);
    }
    
    // Меняем направление каждые 3-8 секунд
    setInterval(() => {
        changeWalkDirection();
    }, antiAFK.walkSpeed || 3000);
}

// ---- ФУНКЦИЯ ПЕРЕПОДКЛЮЧЕНИЯ ----
let reconnectAttempts = 0;
function attemptReconnect() {
    const delay = Math.min(reconnect.initialDelay * (2 ** reconnectAttempts), reconnect.maxDelay || 120000);
    reconnectAttempts++;
    
    log.warn(`Попытка переподключения #${reconnectAttempts} через ${delay / 1000} сек...`);
    setTimeout(createBot, delay);
}

// ---- СОЗДАНИЕ БОТА ----
function createBot() {
    log.info(`Создаю бота с именем: ${botSettings.username}`);
    
    const bot = mineflayer.createBot({
        host: server.ip,
        port: server.port,
        username: botSettings.username,
        version: server.version,
        auth: botSettings.auth
    });
    
    registerBotEvents(bot);
}

// ---- ВЕБ-СЕРВЕР ДЛЯ RENDER.COM ----
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`<h1>🤖 Aternos AFK Bot работает!</h1>
    <p>Бот: <b>${botSettings.username}</b></p>
    <p>Сервер: <b>${server.ip}:${server.port}</b></p>
    <p>Версия: <b>${server.version}</b></p>
    <p>Движения: ходьба, прыжки, вращение камерой</p>
    <p>Статус: <b style="color: green;">ОНЛАЙН</b></p>`);
});

app.listen(PORT, () => {
    log.success(`Веб-сервер запущен на порту ${PORT} (для Render.com)`);
});

// ---- ЗАПУСК БОТА ----
log.info('Запуск Aternos AFK бота с движениями...');
log.info(`Настройки: ${botSettings.username} -> ${server.ip}:${server.port}`);
createBot();
