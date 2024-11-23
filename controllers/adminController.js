import mongoose from 'mongoose';
import Post from '../models/Post.js'
import User from "../models/User.js";
import Report from '../models/ReportPost.js';
const ObjectId = mongoose.Types.ObjectId;

const adminUsername = process.env.ADMIN_USERNAME
const adminPassword = process.env.ADMIN_PASSWORD;

export const login = (req, res) => {
    const { userName, password } = req.body

    if (userName === adminUsername && password === adminPassword) {
        res.status(200).json(userName)
    } else {
        res.status(400).json("invalid userName or password")
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const allusers = await User.find()

        if (allusers) {
            return res.status(200).json(allusers)
        }
    } catch (err) {

        return res.status(500).json('internal error occured')
    }
}

export const blockuser = (req, res) => {
    try {
        const { id } = req.params;
        const checked = req.body.checked;

        if (checked) {
            User.findByIdAndUpdate({ _id: id }, { $set: { isBlocked: false } }, { new: true }).then((response) => {
                return res.status(200).json({ isBlocked: false })
            })
        } else {
            User.findByIdAndUpdate({ _id: id }, { $set: { isBlocked: true } }, { new: true }).then((response) => {
                return res.status(200).json({ isBlocked: true })
            })
        }
    } catch (err) {

        res.status(500).json({ message: err.message })
    }
}

export const getallReportPosts = async (req, res) => {
    try {

        const reportedPost = await Report.find().populate('postId reporter').populate(
            { path: 'reporter', select: 'userName profilePic' }
        ).sort({ createdAt: -1 })
            .exec();

        if (!reportedPost) return res.status(200).json("no reports found")

        res.status(200).json(reportedPost)
    } catch (err) {

        res.status(500).json({ message: err.message })
    }
}

export const searchUser = async (req, res) => {
    const { key } = req.params

    try {
        const users = await User.find({
            "$or": [
                {
                    userName: { $regex: key }
                },
                {
                    email: { $regex: key }
                }
            ]
        })

        res.status(200).json(users);
    } catch (err) {
        res.status(404).json({ message: err.message })
    }
}

export const getallPosts = async (req, res) => {
    try {
        const allPosts = await Post.find()
            .populate('author', 'userName profilePic')
            .populate({
                path: 'comments',
                populate: { path: 'author', select: 'userName profilePic' },
                options: { sort: { createdAt: -1 } }
            })
            .sort({ createdAt: -1 })
            .exec();

        res.status(200).json(allPosts)
    } catch (err) {
        res.status(404).json({ message: err.message })
    }
}

export const searchPost = async (req, res) => {
    const { key } = req.params;

    try {
        const allPosts = await Post.find()
            .populate('author', 'userName profilePic')
            .populate({
                path: 'comments',
                populate: { path: 'author', select: 'userName profilePic' },
                options: { sort: { createdAt: -1 } }
            })
            .exec();

        const regex = new RegExp(key, "i");
        const filteredArr = allPosts.filter(obj => regex.test(obj.author.userName));

        res.status(200).json(filteredArr);
    } catch (err) {
        res.status(404).json({ message: err.message })
    }
}

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        await Post.updateOne({ _id: new ObjectId(id) }, { isDeleted: true });

        res.status(200).json({ message: "Post deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getDashboardCount = async (req, res) => {
    try {
        const userCount = await User.countDocuments()
        const postCount = await Post.countDocuments()

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const newUserCount = await User.countDocuments({
            createdAt: {
                $gte: today,
                $lte: tomorrow
            }
        });
        const newPostCount = await Post.countDocuments({
            createdAt: {
                $gte: today,
                $lte: tomorrow
            }
        });

        let counts = {
            usercount: userCount,
            postcount: postCount,
            newuser: newUserCount,
            newpost: newPostCount
        }

        res.status(200).json(counts)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

export const getPostsByMonth = async (req, res) => {
    try {
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-12-31');
        const months = getMonthsInRange(startDate, endDate);

        const results = await Post.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: '$_id',
                    count: 1
                }
            },
            {
                $group: {
                    _id: null,
                    data: {
                        $push: {
                            k: '$month',
                            v: '$count'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    data: {
                        $arrayToObject: '$data'
                    }
                }
            }
        ]);

        // Combine the results with the months array to ensure all months are included
        const finalResults = months.map(month => {
            return {
                month: month,
                count: results[0].data[month] || 0
            }
        });

        res.status(200).json(finalResults);
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Custom function to get all months in range
function getMonthsInRange(startDate, endDate) {
    const months = []
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        months.push(currentDate.toISOString().substring(0, 7));
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
}
