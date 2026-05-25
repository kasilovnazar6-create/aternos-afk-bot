const getTime = () => new Date().toLocaleTimeString();

module.exports = {
    info: (msg) => console.log(`[${getTime()} INFO] ${msg}`),
    success: (msg) => console.log(`[${getTime()} SUCCESS] ${msg}`),
    warn: (msg) => console.log(`[${getTime()} WARN] ${msg}`),
    error: (msg) => console.log(`[${getTime()} ERROR] ${msg}`)
};