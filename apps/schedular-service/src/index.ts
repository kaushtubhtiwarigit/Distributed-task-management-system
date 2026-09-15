import { connectToDatabase } from "./config/database";
import cron from "node-cron"
import { schedule_tasks } from "./schedular/schedular";


connectToDatabase().then(() => {
    cron.schedule("* * * * *", async () => {
        await schedule_tasks();
    }
    )
});