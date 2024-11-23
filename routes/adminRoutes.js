import express from 'express'
import {
    blockuser,
    deletePost,
    getallReportPosts,
    getAllUsers,
    getDashboardCount,
    getPostsByMonth,
    getallPosts,
    login,
    searchPost,
    searchUser
} from '../controllers/adminController.js'

const router = express.Router()

router.post('/', login)
router.get('/getAllUsers', getAllUsers)
router.get('/searchUser/:key', searchUser)
router.get('/searchPost/:key', searchPost)
router.get('/getallposts', getallPosts)
router.get('/report-posts', getallReportPosts)
router.get('/getPostsByMonth', getPostsByMonth)
router.get('/getDashboardCount', getDashboardCount)

router.put('/userblock/:id', blockuser)
router.put('/deletePost/:id', deletePost)

export default router;
