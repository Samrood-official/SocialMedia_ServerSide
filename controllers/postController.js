import cloudinary from "../config/cloudinary.js"
import Notification from "../models/Notification.js"
import Post from "../models/Post.js"
import User from "../models/User.js"
import Report from "../models/ReportPost.js"

export const updatePost = async (req, res) => {
    try {
        const { id } = req.params
        const { content } = req.body
        let post = await Post.findById(id).populate('author comments.author')
        if (!post) return res.status(400).json({ msg: 'post not found' })
        post = await Post.findByIdAndUpdate(id, { $set: { desc: content } }, { new: true })
        await post.save()
        let updatedpost = await Post.findById(id).populate('author comments.author')

        return res.status(200).json(updatedpost)
    } catch (err) {
        console.log(err);
        return res.status(500).json('internal error occured')
    }
}


//add post
export const addPost = async (req, res) => {
    try {
        let { userId, desc } = req.body
        if (req.file) {
            var result = await cloudinary.uploader.upload(req.file.path)
            var { secure_url, public_id } = result
        }
        let newPost = new Post({
            desc: desc,
            image: secure_url,
            imagePublicId: public_id,
            author: userId
        })
        const post = await newPost.save()
        const updatedpost = await Post.findById(post._id).populate("author")
        res.status(200).json(updatedpost)
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "internal error occured" })
    }
}

//user posts
export const getPost = async (req, res) => {
    try {
        console.log("dd");
        console.log(req.user.id === req.params.id)
        const { id } = req.params
        const mypost = await Post.find({ author: id }).populate("author comments.author").maxTimeMS(10000).exec();  
        if (!mypost) {
            return res.status(400).json({ msg: "you dont have any post" })
        }
        res.status(200).json(mypost)
    } catch (err) {
        console.log(err);
        res.status(500).json('internal error')
    }
}

export const fetchPostFollowing = async (req, res) => {
    try {
        const { id } = req.user
        const user = await User.findById(id)
        if (!user) return res.status(400).json('user not found')
        const posts = await Promise.all(
            user.followings.map((item) => {
                return Post.find({ author: item, isDeleted: false }).populate('author').populate('comments.author').sort({ createdAt: -1 })
            }))
        const flattenPost = posts.flat()
        const userPost = await Post.find({ author: id, isDeleted: false }).populate("author").populate('comments.author').sort({ createdAt: -1 })
        const combinedPost = userPost.concat(flattenPost)
        return res.status(200).json(combinedPost)
    } catch (err) {
        console.log(err);
        return res.status(400).json("internal error")
    }
}
export const fetchAllPosts = async (req, res) => {
    try {
        const { id } = req.user
        const user = await User.findById(id)
        if (!user) return res.status(400).json('user not found')
        const posts = await Post.find({ isDeleted: false }).populate('author').populate('comments.author userName profilePc')
        return res.status(200).json(posts)
    } catch (err) {
        console.log(err);
        return res.status(400).json("internal error")
    }
}
// fetch myposts  
export const fetchPosts = async () => {
    try {
        const { id } = req.user
        const posts = await Post.find({ author: id })
        if (posts) return res.status(200).json(posts)
    } catch (err) {
        console.log(err);
        res.status(400).json('internal error')
    }
}

export const commentPost = async (req, res) => {
    try {
        const postId = req.params.postId
        const { comment } = req.body;
        const { id, userName } = req.user

        const Comment = {
            "text": comment,
            "author": id,
            "isDelete": false
        }
        const post = await Post.findById(postId)
        post.comments.unshift(Comment)
        await post.save()
        const updatedpost = await Post.findById(postId).populate('author comments.author')
        console.log(post.author !== id);
        if (post.author !== id) {
            const notification = new Notification({
                type: 'comment',
                user: post.author,
                friend: id,
                content: 'commented on your post',
                postId: postId
            })
            await notification.save()
        }
        return res.status(200).json(updatedpost)
    } catch (err) {
        console.log(err);
        return res.status(500).json("internal server error")
    }
}

//deletePost                                        
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if (!post) {
            return res.status(400).json('you are not allowed to delete this post')
        }
        const { imagePublicId } = post
        //deleting from cloudinary
        cloudinary.uploader.destroy(imagePublicId, (error, result) => {
            if (error) {
                console.log('Error deleting image:', error);
            } else {
                console.log('Image deleted successfully');
            }
        });
        await Post.findByIdAndDelete(req.params.id)
        return res.status(200).json({ id: req.params.id })

    } catch (err) {
        console.log(err);
        return res.status(500).json("internal server error")
    }
}
export const reportPost = async (req, res) => {
    try {
        const { id, userName } = req.user
        const { postId } = req.params
        const { content } = req.body
        console.log("id,postId,content");
        console.log(id, postId, content);
        let post = await Post.findById(postId)
        if (!post) return res.status(400).json({ msg: 'post not found' })
        const report = new Report({
            reporter: id,
            reason: content,
            postId: postId
        })
        await report.save()
        return res.status(200).json("report added successfully")
    } catch (err) {
        console.log(err);
        return res.status(500).json('internal error occured')
    }
}