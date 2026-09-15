import pino from "pino";

export const logger = pino({
    name: "worker-service",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
        }
    }
})