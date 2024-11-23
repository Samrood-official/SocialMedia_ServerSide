import express from 'express'
const router = express.Router()
import { createChat, findChat, findUserChats } from '../controllers/chatController.js'

router.post('/',createChat)
router.get('/:userId',findUserChats)
router.get('/:firstId/:secondId',findChat)
 
export default router; 
