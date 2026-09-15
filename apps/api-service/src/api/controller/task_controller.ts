import { Request, Response } from "express";
import { Task } from "../db/task_model";
import axios from "axios";
import { logger } from "../utils/logger";

export const createTask = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title, description, maxRetries } = req.body;
        const { data: task } = await axios.post("http://localhost:3001/api/db/events", {
            event: "TASK CREATED",
            eventBody: {
                title,
                description,
                maxRetries,
            }
        })
        logger.info({
            message: "Task created and sent for processing",
            taskId: task._id,
            event: "TASK CREATED",
        });
        return res.status(201).json({
            success: true,
            message: "Task created and sent for processing",
            task,
        });
    } catch (error) {
        logger.error({
            message: "Failed to create task",
            error: (error as Error).message,
            event: "TASK CREATION FAILED",
        });
        return res.status(500).json({
            success: false,
            message: "Failed to create task",
            error: (error as Error).message,
        });
    }
}

export const getTaskById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }
        logger.info({
            message: "Task retrieved successfully",
            taskId: task._id,
            event: "TASK RETRIEVED",
        });
        return res.status(200).json({ success: true, task });
    } catch (error) {
        logger.error({
            message: "Failed to retrieve task",
            error: (error as Error).message,
            event: "TASK RETRIEVAL FAILED",
        });
        return res.status(500).json({ success: false, message: (error as Error).message });
    }
}
