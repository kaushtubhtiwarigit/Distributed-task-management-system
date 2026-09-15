import { Application } from "express";
import DBRouter from "./db_routes";

class Routes {
    constructor(app: Application) {
        app.use('/api', DBRouter);
    }
}

export default Routes;