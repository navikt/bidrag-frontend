import express from 'express'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = 8080

const BUILD_PATH = path.resolve(path.resolve(), './dist')

app.set('trust proxy', 1)
app.use('/', express.static(BUILD_PATH))

app.get('/isalive', (req, res) => {
    res.send('OK')
})

app.get('/isready', (req, res) => {
    res.send('OK')
})

app.use(/^(?!.*\/(internal|static)\/).*$/, (req, res) =>
    res.sendFile(path.join(BUILD_PATH, 'index.html')),
)

app.listen(port, () => {
    console.log(`ds-react-ts app listening at http://localhost:${port}`)
})