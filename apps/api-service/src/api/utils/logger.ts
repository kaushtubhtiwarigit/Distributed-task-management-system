import pino from "pino";

export const logger = pino({
    name: "api-service",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
        }
    }
})