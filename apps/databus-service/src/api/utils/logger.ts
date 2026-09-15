import pino from "pino";

export const logger = pino({
    name: "databus-service",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
        }
    }
})