export const config = { 
    DB_URL: process.env.DB_URL || 'mongodb://localhost:27017',
    DB_NAME: process.env.DB_NAME || 'tasks',
    PORT: Number(process.env.PORT )|| 3000
};