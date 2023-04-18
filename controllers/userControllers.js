import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js'
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';

//follow user
export const followUser = async (req, res) => {
    try {
        const { friendId } = req.body
        const { id } = req.user

        const friend = await User.findById(friendId)
        if (!friend) return res.status(400).json('friend not found')

        if (!friend.followers.includes(id)) {
            friend.followers.push(id);
            await friend.save()

            const notification = new Notification({
                type: 'follow',
                user: friendId,
                friend: id,
                content: 'started following you',
            })
            await notification.save()
        }
        const user = await User.findById(id)
        if (!user) return res.status(400).json('user not found')
        if (!user.followings.includes(friendId)) {
            user.followings.push(friendId)
            await user.save()
        }
        const updateduser = await User.findById(id)
        // const post =await Post.find({author:friendId})
        return res.status(200).json(updateduser)
    } catch (err) {
        console.log(err);
        return res.status(500).json('internal error occured')
    }
}

export const unfollowUser = async (req, res) => {
    try {
        console.log("fff");
        const { unfollowid } = req.body
        const { id } = req.user
        const user = await User.findById(id)
        const unfollowedUser = await User.findById(unfollowid)
        if (!user) return res.send('user not found')

        if (unfollowedUser.followers.includes(id)) {
            const index = unfollowedUser.followers.indexOf(id);
            if (index > -1) {
                unfollowedUser.followers.splice(index, 1);
            }
            await unfollowedUser.save()
        }

        if (user.followings.includes(unfollowid)) {
            const index = user.followings.indexOf(unfollowid);
            if (index > -1) {
                user.followings.splice(index, 1);
            }
            await user.save()
        }
        const updateduser = await User.findById(id)
        console.log(updateduser);
        res.status(200).json(updateduser)
    } catch (err) {
        console.log(err);
        return res.status(500).json('internal error occured')
    }
}

export const updateUser = async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.body.userId, {
            $set: {
                userName: req.body.userName,
                email: req.body.email,
                phoneNumber: req.body.phoneNumber,
                bio: req.body.bio
            },
        }, { new: true })
        return res.status(200).json({ user: updatedUser })
    } catch (err) {
        console.log(err);
        return res.status(500).json('internal error occured')
    }
}
//addprofilpic
export const addProfilepPic = async (req, res) => {
    try {
        const { userId } = req.body
        let result = await cloudinary.uploader.upload(req.file.path)
        let updatedUser = await User.findByIdAndUpdate(userId,
            { $set: { profilePic: result.secure_url } }, { new: true })
        res.status(200).json(updatedUser)
    } catch (err) {
        console.log(err);
        return res.status(500).json('internal error occured')
    }
}

//following users
export const getallfriends = async (req, res) => {
    try {
        const { id } = req.params
        const userfollowDetails = await User.findById(id).populate("followings followers").exec()
        const { followings, followers } = userfollowDetails

        if (userfollowDetails) {
            return res.status(200).json({ followings: followings, followers: followers })
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json('internal error occured')
    }
}
//getUser
export const getUser = async (req, res) => {
    try {
        const { id } = req.params
        const user = await User.findById(id).populate('followings followers')
        if (user) {
            return res.status(200).json(user)
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json('internal error occured')
    }
}


// get all users without following
export const getAllUsersWithOutFollowing = async (req, res) => { 
    try {
        const { id, userName } = req.user
        const user = await User.findById(id)
        const allusers = await User.find().select('userName profilePic name')
        if (allusers) {
            const filtered = allusers.filter((item) => {
                return item._id != id
            })
            const doublefiltered = filtered.filter((item) => { return !user.followings.includes(item._id); }).slice(0, 10)
            return res.status(200).json({ data: doublefiltered })
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json('internal error occured')
    }
}
// get all users
export const getAllUsers = async (req, res) => { 
    try {
        const { id, userName } = req.user
        const allusers = await User.find().select('userName profilePic name')
        
            return res.status(200).json({ data: allusers })
    } catch (err) {
        console.log(err);
        return res.status(500).json('internal error occured')
    }
}

export const deleteUser = async (req, res) => {
    try {
        if (req.params.id !== req.user.id) {
            return res.status(400).json("user dosn't match")
        } 
        await User.findByIdAndDelete(req.params.id)
        return res.status(200).json('deleted account successfully')
    } catch (err) {
        console.log(err);
        return res.status(500).json('internal error occured')
    }
}

export const likePost = async (req, res) => {
    try {
        const { id } = req.user
        const { postId } = req.params
        const post = await Post.findById(postId)
        if (!post) return res.status(400).json('post not found')

        const isliked = post.likes.get(id)

        if (isliked) {
            post.likes.delete(id)
        } else {
            post.likes.set(id, true)

           const check =  post.author != id
           console.log(check);
           if(check){
            const notification = new Notification({
                type: 'like',
                user: post.author,
                friend: id,
                content: 'liked your post',
                postId: postId,
            })
            await notification.save()
        }
        }
        await post.save()
        const updatedPost = await Post.findById(postId).populate('author comments.author')
        return res.status(200).json(updatedPost)
    } catch (err) {
        console.log(err);
        return res.status(500).json('internal error occured')
    }
}
export const removeFollower = async (req, res) => {
    try {
        console.log("fff");
        const { unfriendId } = req.body
        const { id } = req.user
        const user = await User.findById(id)
        const unfriendUser = await User.findById(unfriendId)
        if (!user) return res.send('user not found')

        if (unfriendUser.followings.includes(id)) {
            const index = unfriendUser.followings.indexOf(id);
            if (index > -1) {
                unfriendUser.followings.splice(index, 1);
            }
            await unfriendUser.save()
        }

        if (user.followers.includes(unfriendId)) {
            const index = user.followers.indexOf(unfriendId);
            if (index > -1) {
                user.followers.splice(index, 1);
            }
            await user.save()   
        }
        const updateduser = await User.findById(id)
        console.log(updateduser);
        res.status(200).json(updateduser)
    } catch (err) {
        console.log(err);
        return res.status(500).json('internal error occured')
    }
}

export const getAllnotification = async (req, res) => {
    try {
        const { id } = req.user 
        const notification = await Notification.find({ user: id }).populate('friend postId').sort({ createdAt: -1 })
        if (notification) {
            console.log(notification);
           return res.status(200).json(notification)
        }
    } catch (err) {
        return res.status(200).json('internal error')
    }
}