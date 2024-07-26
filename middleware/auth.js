const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.JWT_SECRET;
require("dotenv").config()
const { insertUser } = require('../controllers/userController');
const User = require('../models/userModel');


const isAuthenticated = async(req,res,next) =>{
    const token = req.header('Authorization').replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' });
    } 
}
const requireAuth = (req, res, next) => {
    try {
        const token = req.cookies.admin;

        if (token) {
            jwt.verify(token, secret, (err, decodeToken) => {
                if (err) {
                    console.error(err);
                    res.status(401).redirect("/admin");
                } else {
                    req.admin = decodeToken;
                    next();
                }
            });
        } else {
            res.status(401).redirect("/admin");
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};




const requirelogin = (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        

        if (token) {
            jwt.verify(token, secret, (err, decodeToken) => {
                if (err) {
                    console.error(err);
                    res.redirect("/login");
                } else {
                    // console.log("deee",decodeToken)
                    req.id = decodeToken;
                    next();
                }
            });
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};


const isLoggedin=async(req,res,next)=>{
    try {
        console.log(req.cookies);
        const token=req.cookies.jwt
        // console.log(token);
     
        if(token){
            jwt.verify(token,secret,(err,decodeToken)=>{
                if(err){
                    console.log(err);
                    res.redirect("/")
                }
                else{
                    req.id=decodeToken
                    res.redirect("/home")
                }
            })
        }
        else{
           next()
        }
    } catch (error) {
        console.log(error);
    }
}
module.exports = {
    requirelogin,
    requireAuth,
    isLoggedin,
    isAuthenticated
};