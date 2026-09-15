import express from 'express'
import { createTask, getTaskById } from '../controller/task_controller'

class TaskRoutes{
    router = express.Router()

    constructor(){
        this.initialize()
    }

    private initialize(){
        this.router.get('/tasks/:id', getTaskById)
        this.router.post('/tasks', createTask)
    }
}


export default new TaskRoutes().router