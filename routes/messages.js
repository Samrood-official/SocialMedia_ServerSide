import express from 'express'
import { verifyToken } from '../middleware/verifyToken.js'
import { createMessage, getMessages } from '../controllers/messageController.js'
const router = express.Router()

router.post('/',verifyToken, createMessage)
router.get('/:chatId',getMessages)

export default router 
