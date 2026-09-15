import pino from "pino";

export const logger = pino({
    name: "schedular-service",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
        }
    }
})