
import { Router } from 'express';
import { DbController } from '../controllers/db_controller';

class DBRoutes {

    router: Router = Router();

    constructor() {
        this.initialize();
    }

    private initialize() {
        this.router.post('/db/events', DbController);
    }
}

export default new DBRoutes().router;