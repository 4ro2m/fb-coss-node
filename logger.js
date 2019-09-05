const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `{"timestamp":"${timestamp}", "${level}": "${message}"}`;
});

const options = {
    console: {
      format: combine(
        timestamp(),
        myFormat
      )
    },
    file: {
        format: combine(
            timestamp(),
            myFormat
        ),
      filename: './logs/error-log.log'
    }
};

const logger = createLogger({
    transports: [
      new transports.Console(options.console),
      new transports.File(options.file)
    ]
});

module.exports = {
    logger: (level, message) => {
        logger.log(level, message)
    }
}