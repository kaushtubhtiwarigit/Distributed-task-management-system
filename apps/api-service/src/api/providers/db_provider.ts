import mongoose from 'mongoose';
import { config } from '../../config/config';

class Database {
    static DB_URL = config.DB_URL;
    static DB_NAME = config.DB_NAME;

    static async init() {
        await mongoose.connect(`${this.DB_URL}/${this.DB_NAME}`);
        console.log('Connected to database');
    }
}

export default Database;