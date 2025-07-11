const winston = require("winston");
const path = require("path");
const fs = require("fs");

const maxLogSize = 5 * 1024 * 1024; // 5MB
const maxLogFiles = 5;

const logDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

const getUTCTimestamp = () => {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
};

// Custom JSON format with ordered keys
const orderedJsonFormat = winston.format.printf((info) => {
  const { timestamp, level, message, service, ...meta } = info;

  const orderedLog = {
    timestamp,
    level,
    message,
    ...meta,
  };

  if (service) {
    orderedLog.service = service;
  }

  return JSON.stringify(orderedLog);
});

// JSON format for file logs with custom ordering
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: getUTCTimestamp }),
  winston.format.errors({ stack: true }),
  orderedJsonFormat
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: getUTCTimestamp }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Define common transports
const transports = [
  // Error logs
  new winston.transports.File({
    filename: path.join(logDir, "error.log"),
    level: "error",
    format: jsonFormat,
    maxsize: maxLogSize,
    maxFiles: maxLogFiles,
    handleExceptions: true,
    handleRejections: true,
  }),
  // Combined logs
  new winston.transports.File({
    filename: path.join(logDir, "combined.log"),
    format: jsonFormat,
    maxsize: maxLogSize,
    maxFiles: maxLogFiles,
    handleExceptions: true,
    handleRejections: true,
  }),
];

// Add console transport only in development
if (process.env.NODE_ENV === "development") {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true,
    })
  );
}

// Create logger configuration
const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: { service: "book-compass-api" },
  transports: transports,
});

// Silence logs in test environment
if (process.env.NODE_ENV === "test") {
  logger.transports.forEach((transport) => {
    transport.silent = true;
  });
}

module.exports = logger;
