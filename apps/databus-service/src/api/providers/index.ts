import Database from "./db_provider";
import Express from "./server_provider";

class App {
    static LoadDatabase() {
        Database.init()
    }
    static LoadServer() {
        Express.init();
        Express.startServer();
    }
}

export default App;