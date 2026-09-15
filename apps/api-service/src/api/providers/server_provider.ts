import express from 'express'
import Routes from '../routes'
import { config } from '../../config/config'

class Express {
    static app: express.Application = express()
    static PORT: number = config.PORT

    static init() {
        this.app.use(express.json())
        new Routes(this.app)
    }

    static startServer() {
        this.app.listen(this.PORT, () => {
            console.log(`Server is running on port ${this.PORT}`)
        })
    }
}

export default Express