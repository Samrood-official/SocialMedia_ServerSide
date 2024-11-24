import Jwt from 'jsonwebtoken';
import genrateotp from '../utils/mail.js'
import VerificationToken from '../models/VerificationToken.js';
import bcrypt from 'bcrypt'
import User from '../models/User.js';
import transport from '../config/nodemailer.js';
import crypto from 'crypto'
import ResetToken from '../models/ResetToken.js';
const jwt_secret_key = process.env.jwt_secret_key

const getUserName = (name) => {
    return name.split(' ')[0] + '_' + Math.floor(Math.random() * 10000);
}

export const register = async (req, res) => {
    try {
        const {name, email, phoneNumber, password} = req.body;
        let user = await User.findOne({ email })
        if (user) {
            return res.status(403).json({ msg: "Email Already Exist" })
        }
        const saltRounds = await bcrypt.genSalt(10)
        const hashedpassword = await bcrypt.hash(password, saltRounds)
        const userName = getUserName(name);

        user = await User.create({
            name: name,
            userName,
            email: email,
            password: hashedpassword,
            authType: 'email',
            phoneNumber: phoneNumber
        })

        const accessToken = Jwt.sign({
            id: user._id,
            userName: user.userName,
        }, jwt_secret_key)

        await user.save()

        // emailverification
        const otp = genrateotp()
        const verificationToken = await VerificationToken.create({
            user: user._id,
            token: otp
        })

        await verificationToken.save()

        // sending otp to user mail
        let details = {
            from: process.env.USER_EMAIL || '',
            to: user.email,
            subject: "verify your email using otp",
            html: `<h1>Your Otp Code ${otp}</h1>`
        }

        transport.sendMail(details, (err) => {
            if (err) {

            } else
                console.log('success..........');
        })

        return res.status(200).json({
            status: "pending",
            message: "Please check your email",
            user: user._id,
        })
    } catch (err) {
        return res.status(500).json("internal error Occured" + err)
    }
}

//login
export const login = async (req, res) => {
    try {
        // const userData = await User.findOne({ userName: req.body.userName }).populate('followers').populate('followings')
        const userData = await User.findOne({ email: req.body.email })
        if (!userData) {
            return res.status(400).json({ msg: "user Not Exist" })
        }
        if (userData.isBlocked) {
            return res.status(400).json({ msg: "You are blocked" })
        }

        const comparePassword = await bcrypt.compare(req.body.password, userData.password)
        if (!comparePassword) {
            return res.status(401).json({ msg: "incorrect password" })
        }
        const accessToken = Jwt.sign({
            id: userData._id,
            userName: userData.userName
        }, jwt_secret_key)
        const { password, ...user } = userData._doc
        res.status(200).json({ user, accessToken })

    } catch (err) {

        return res.status(500).json({ error: err.message })
    }
}

//verify email
export const verifyEmail = async (req, res) => {
    try {
        const { userId, otp } = req.body
        const mainuser = await User.findById(userId)
        if (!mainuser) { return res.status(400).json("user not exist") }
        const token = await VerificationToken.findOne({ user: userId })
        if (!token) { return res.status(400).json("token is not valid") }
        const isMatch = await bcrypt.compare(otp, token.token)
        if (!isMatch) { return res.status(400).json({ msg: 'otp is incorrect' }) }
        mainuser.verified = true;

        await VerificationToken.findByIdAndDelete(token._id)
        await mainuser.save()
        const accessToken = Jwt.sign({
            id: userId,
            userName: mainuser.userName
        }, jwt_secret_key)
        const { password, ...user } = mainuser._doc

        transport.sendMail({
            from: process.env.USER_EMAIL,
            to: user.email,
            subject: "Successfully verified email",
            html: `<h1>now you can login</h1>`
        })
        return res.status(200).json({ user, accessToken })
    } catch (err) {

        return res.status(500).json('internal error')
    }
}

//forgot password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        let user = await User.findOne({ email: email })
        if (!user) return res.status(400).json({ msg: 'acccount not found' })
        let userId = user._id
        const randomText = crypto.randomBytes(20).toString('hex')
        const resetToken = new ResetToken({
            user: user._id,
            token: randomText
        })
        await resetToken.save()
        transport.sendMail({
            from: process.env.USER_EMAIL,
            to: user.email,
            subject: "Reset token",
            html: `
        <a href="https://main.d30vnh38wloxsg.amplifyapp.com/resetPassword?token=${randomText}&userId=${userId}">password reset link</a>`
        })
        return res.status(200).json({ msg: 'check your email to reset password' })

    } catch (err) {

        return res.status(500).json({ msg: 'internal error' })
    }
}

//reset Password
export const resetPassword = async (req, res) => {
    try {
        const { token, userId } = req.query
        if (!token || !userId) return res.status(400).json({ msg: 'invalid request' })

        const user = await User.findOne({ _id: userId })
        if (!user) return res.status(400).json('user not found')
        const resetToken = await ResetToken.findOne({ user: user._id })
        if (!resetToken) return res.status(400).json({ msg: "Already changed password" })
        const isMatch = await bcrypt.compare(token, resetToken.token)
        if (!isMatch) { return res.status(400).json({ msg: 'token is not valid' }) }
        await ResetToken.deleteOne({ user: user._id })

        const { password } = req.body
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        user.password = hashedPassword
        await user.save()

        transport.sendMail({
            from: process.env.USER_EMAIL,
            to: user.email,
            subject: "Your password reset successfull",
            html: `now you can login`
        })
        return res.status(200).json({ msg: 'you can login now' })
    } catch (err) {

        return res.status(500).json('internal error')
    }
}

export const googleLogin = async (req, res) => {
    try {
        const authHeader = req.header("Authorization")
        if (!authHeader) return res.status(401).json("you are not google-authenticated")
        const token = authHeader.split(" ")[1];
        const result = Jwt.decode(token)
        const name = result.name
        const userName = getUserName(result.given_name)
        const email = result.email
        const checkUser = await User.findOne({ email: email })

        if (checkUser) {
            const accessToken = Jwt.sign({
                id: checkUser._id,
                userName: checkUser.userName,
            }, jwt_secret_key)

            return res.status(200).json({ user: checkUser, accessToken })
        }

        const user = await new User({
            name, email, userName, authType: 'google', verified: true
        })

        await user.save()
        const accessToken = Jwt.sign({
            id: user._id,
            userName: user.userName,
        }, jwt_secret_key)
        return res.status(200).json({ user, accessToken })
    } catch (err) {
        res.status(500).json("internal error")
    }
} 
