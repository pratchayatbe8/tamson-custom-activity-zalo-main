const { createLogger, format, transports } = require('winston');
const path = require('path');

module.exports = createLogger({
    // === CRITICAL FIX 1: Add a global log level. 'debug' is best for troubleshooting. ===
    level: 'debug', 

    transports: [
        new transports.File({
            maxsize: 20971520,
            maxFiles: 10,
            filename: path.join(__dirname,'../logs','server.log'),
            format:format.combine( 
                format.timestamp({format: 'MMM-DD-YYYY HH:mm:ss'}),
                format.align(),
                format.printf(info => `${info.timestamp},${info.level},${info.message}`),
        )}),

        // === CRITICAL FIX 2: Add a format for the Console. Use simple format for readability. ===
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        })
    ]
});