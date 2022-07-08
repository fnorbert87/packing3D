const Users = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const sendMail = require('./sendMail')

const {CLIENT_URL} = process.env

const userCtrl = {
    register: async (req, res) => {
        try {
            const {name, email, password} = req.body;

            if(!name || !email || !password)
                return res.status(400).json({msg:"Please fill in all fields!"})

             if(!validateEmail(email))
                return res.status(400).json({msg:"Invalid email."})

            const user = await Users.findOne({email})
            if(user)
                return res.status(400).json({msg:"This email already exists."})

            if(password.length < 6)
            return res.status(400).json({msg:"Password must be at least 6 character"})

            const passwordHash = await bcrypt.hash(password,12)

            const newUser = {name, email, password:passwordHash}

            const activation_token = createActivationToken(newUser)

            const url = `${CLIENT_URL}/user/activation/${activation_token}`

            sendMail(email, url, "Verify your email address")

            console.log({activation_token});

             
            res.json({msg:"Register success! Please activate your email to start!"})
        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    activateEmail: async (req, res) => {
        try {
            const {activation_token} = req.body
            const user = jwt.verify(activation_token, process.env.ACTIVATION_TOKEN_SECRET)
           
            const {name, email, password} = user;

            const check = await Users.findOne({email});

            if(check)
                return res.status(400).json({msg:"This email already exists."})

            const newUser = new Users({
                name, email, password
            })

            await newUser.save()

            res.json({msg:"Account has been activated."})

        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    login: async (req, res) => {
        try {
            const {email, password} = req.body
            const user = await Users.findOne({email})
            if(!user)
                return res.status(400).json({msg:"This email does not exists!"})

            const isMatch = await bcrypt.compare(password, user.password)
            if(!isMatch)
                return res.status(400).json({msg:"Password is incorrect!"})

            const refresh_token = createRefreshToken({id:user._id})
            res.cookie("refreshtoken",refresh_token, {
                httpOnly: true,
                path: 'user/refresh_token',
                maxAge: 7*24*60*60*1000
            })
            res.json({msg:"Login success!"})
            
        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    getAccessToken: ( req, res ) => {
        try {
            const rf_token = req.cookies.refreshtoken
            if(!rf_token)
                return res.status(400).json({msg:"Please log in!"})
            
            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if(err) return res.status(400).json({msg:"Please log in!"})

                const access_token = createAcessToken({id:user.id})

                res.json({access_token})
            })
        } catch (err) {
            return res.status(500).json({msg:err.message})
          }
    },
    forgotPassword: async (req, res) =>{
        try {
            const {email} = req.body
            const user = await Users.findOne({email})
            if(!user)
                return res.status(400).json({msg:"This email does not exists"})

            const access_token = createAcessToken({id:user._id})

            const url = `${CLIENT_URL}/user/reset/${access_token}`

            sendMail(email, url, "Reset your password")
        
            res.json({msg:"Re-send your password, please check your email!"})

        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    resetPassword: async (req, res) => {
        try {
            const {password} = req.body
            const passwordHash = await bcrypt.hash(password, 12)
            console.log(req.user);
            await Users.findByIdAndUpdate({_id:req.user.id}, {
                password:passwordHash
            })

            res.json({msg:"Password successfully changed."})
        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    getUserInfor: async (req, res) => {
        try {
            const user = await Users.findById(req.user.id).select("-password")
            res.json(user)
        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    getUserAllInfor: async (req, res) => {
        try {
            console.log(req.user);
            const users = await Users.find().select("-password")
            res.json(users)
        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    logout: async (req, res) => {
        try {
           res.clearCookie('refreshtoken', {path:'user/refresh_token'})
           return res.json({msg:"Logged out"})
        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    updateUser: async (req, res) => {
        try {
          const {name, avatar} = req.body
          await Users.findOneAndUpdate({_id:req.user.id}, {
            name, avatar
          })

          res.json({msg:"Update success!"})

        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    updateUsersRole: async (req, res) => {
        try {
          const {role} = req.body
          await Users.findOneAndUpdate({_id:req.params.id}, {
            role
          })

          res.json({msg:"Update success!"})

        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    },
    deleteUser: async (req, res) => {
        try {
          const {name, avatar} = req.body
          await Users.findByIdAndDelete(req.params.id)

          res.json({msg:"Delete success!"})

        } catch (err) {
            return res.status(500).json({msg:err.message})
        }
    }
}

const validateEmail = (email) => {

    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(email)
}

const createActivationToken = (payload) => {
    return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {expiresIn:'5m'})    
}

const createAcessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'15m'})    
}

const createRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn:'7d'})    
}

module.exports =  userCtrl