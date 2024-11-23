import express, { json } from 'express'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { connect } from 'mongoose'
import { createServer } from 'http'
import { Server } from "socket.io";

import userRoute from './routes/userRoutes.js'
import adminRoute from './routes/adminRoutes.js'
import messageRoute from './routes/messages.js'
import chatRoute from './routes/chat.js'
import handler from './controllers/userControllers.js'

const app = express()
dotenv.config()
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        // origin: 'https://main.d30vnh38wloxsg.amplifyapp.com'
        origin: 'http://localhost:3000'
    }
});

connect(process.env.MONGO_URL).then(() => {
    console.log("✅ Database connection successful");
}).catch((err) => {
    console.log("❌ Database connection error", err);
})
app.use(helmet())
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(json())
app.use(cors())

app.use(morgan('tiny'));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.get('/', handler)
app.use('/api', userRoute)
app.use('/api/admin', adminRoute)
app.use('/api/chats', chatRoute)
app.use('/api/messages', messageRoute) 
console.log('before server call...');
httpServer.listen(3001, () => {
    console.log('server running succesfully');
})
 
let users = []
const addUser = (userId, socketId) => {
    !users.some(user => user.userId === userId) && users.push({ userId, socketId })
}
const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId)
}
const getUser = (userId) => {
    return users.find((user) => {
        return user.userId == userId
    })
}
io.on('connection', (socket) => {
    console.log('socket connected');
    socket.on('addUser', (userId) => {
        addUser(userId, socket.id)
    })

    //get and send messge 
    socket.on('sendMessage', ({ senderId, recieverId, text }) => {
        const user = getUser(recieverId)
        io.to(user?.socketId).emit('getMessage', ({ senderId, text }))
    })

    //disconnect 
    socket.on('disconnect', () => {
        console.log('socket disconnected')
        removeUser(socket.id)
    })
}) 