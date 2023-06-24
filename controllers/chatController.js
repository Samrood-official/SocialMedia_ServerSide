import Chat from "../models/Chat.js"
export const createChat = async (req, res) => {
    const { firstId, secondId } = req.body
    try {
        const chat = await Chat.findOne({ members: { $all: [firstId, secondId] } })
        if (chat){
            console.log(chat);
            return res.status(200).json({chatExist:true,chat})}
        const newChat = new Chat({
            members: [firstId, secondId]
        })
        const response = await newChat.save() 
        return res.status(200).json(response)
    } catch (err) {
        console.log(err)
        return res.status(400).json('internal error ')
    }
}

export const findUserChats = async (req, res) => {
    const { userId } = req.params
    try { 
         const chat = await Chat.aggregate([
            { $match: { members: { $in: [userId] } } },
            { $lookup: { from: 'messages', localField: '_id', foreignField: 'chatId', as: 'messages' } },
            { $unwind: '$messages' },
            { $sort: { 'messages.createdAt': -1 } },
            { $group: { _id: '$_id', members: { $first: '$members' }, lastMessage: { $first: '$messages' } } },
            { $sort: { 'lastMessage.createdAt': -1 } },
            { $project: {_id:1,members:1  } },
          ]);
        return res.status(200).json(chat)
    } catch (err) {
        console.log(err)
        return res.status(400).json('internal error ')
    }
}

export const findChat = async (req, res) => {
    const { firstId, secondId } = req.params
    try {
        const chat = await Chat.findOne({ members: { $all: [firstId, secondId] } })
        return res.status(200).json(chat)
    } catch (err) {
        console.log(err)
        return res.status(400).json('internal error ')
    }
}