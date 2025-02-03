const log = require('../logs.js');

module.exports = function () {

    // Crtl + C
    process.on('SIGINT', () => {
        log.error('SIGINT: Exiting...');
        process.exit(1);
    });

    // Standard crash
    process.on('uncaughtException', (err) => {
        log.error(`UNCAUGHT EXCEPTION: ${err.stack}`);
    });

    // Killed process
    process.on('SIGTERM', () => {
        log.error('SIGTERM: Exiting...');
        process.reallyExit(1);
    });

    // Standard crash
    process.on('unhandledRejection', (err) => {
        log.error(`UNHANDLED REJECTION: ${err.stack}`);
    });

    // Deprecation warnings
    process.on('warning', (warning) => {
        log.warn(`WARNING: ${warning.name} : ${warning.message}\n${warning.stack}`);
    });

    // Reference errors
    process.on('uncaughtException', (err) => {
        log.error(err.stack);
    });

};
