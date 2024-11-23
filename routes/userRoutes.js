import express from 'express';
import upload from '../config/multer.js';
import { verifyToken } from '../middleware/verifyToken.js'

import { updatePost, getPost, addPost, fetchPostFollowing, deletePost, commentPost,fetchPosts,fetchAllPosts, reportPost } from '../controllers/postController.js'
import { register, login, verifyEmail, resetPassword, forgotPassword,googleLogin } from '../controllers/authController.js'
import { followUser,removeFollower,getAllnotification, getUser, unfollowUser, getallfriends, updateUser, deleteUser, likePost,getAllUsers, addProfilepPic, getAllUsersWithOutFollowing } from '../controllers/userControllers.js';

const router = express.Router()

//user 
router.post('/signup', register)
router.post('/login', login)
router.get('/google-login', googleLogin)

router.get('/all-users', verifyToken, getAllUsers)  
router.get('/suggessions', verifyToken, getAllUsersWithOutFollowing)  
router.get('/get-user/:id', verifyToken, getUser)  
router.get('/get-mypost/:id', verifyToken, getPost)
router.get('/getFriends/:id', verifyToken, getallfriends)
router.get('/user-posts', verifyToken, fetchPosts)
router.get('/followings-posts', verifyToken, fetchPostFollowing)
router.get('/all-posts', verifyToken, fetchAllPosts)  
router.get('/all-notifications', verifyToken, getAllnotification)

router.post('/add-profilepic', upload.single("file"), addProfilepPic)
router.post('/add-post', upload.single("file"), addPost)
router.post('/forgot-password', forgotPassword)
router.post('/verify-email', verifyEmail)
router.post('/posts/:postId/comment',verifyToken, commentPost)
router.post('/report-post/:postId',verifyToken, reportPost)
    
router.put('/reset-password', resetPassword)
router.put('/edit-profile', verifyToken, updateUser)         
router.put('/posts/:postId/like',verifyToken, likePost)

// router.put('/:id/like', verifyToken, likePost)
router.put('/update-post/:id', updatePost)
router.put('/add-friend', verifyToken, followUser)
router.put('/un-follow', verifyToken, unfollowUser)
router.put('/remove-follower', verifyToken, removeFollower)

router.delete('/delete/:id', verifyToken, deleteUser)
router.delete("/delete-post/:id", verifyToken, deletePost) 

export default router;
