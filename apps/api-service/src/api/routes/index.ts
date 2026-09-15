import { Application, Router } from "express";
import TaskRouter from "./task_routes";

class Routes {
    constructor(app: Application) {
        app.use('/api/v1/', TaskRouter)
    }
}

export default Routes;