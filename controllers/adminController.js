const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Order = require("../models/orderModel");
const Address = require("../models/addressModel");
const { OrderedBulkOperation } = require("mongodb");
dotenv.config();
const secret = process.env.JWT_SECRET;

const loadLogin = (req, res) => {
    res.render('login');
};

const createToken = (user) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    return jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });
};

const isAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const admin = await User.findOne({ email: email, is_admin: 1 });
        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (passwordMatch) {
                const token = createToken({ id: admin._id });
                res.cookie("admin", token, {
                    httpOnly: true,
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                    secure: process.env.NODE_ENV === 'production', 
                });
                res.redirect('/admin/home');
            } else {
                res.render('login', { error: "Invalid email or password" });
            }
        } else {
            res.render('login', { error: "Invalid email or password" });
        }
    } catch (error) {
        console.log(error.message);
        res.render('login', { error: "Something went wrong. Please try again later." });
    }
};

const loadHome = async (req, res) => {
    try {
        res.render("home");
    } catch (error) {
        console.log(error.message);
        res.render('login', { error: "Session expired. Please log in again." });
    }
};

const userList = async (req, res) => {
    try {
        const usersData = await User.find({ is_admin: 0 });
        res.render("Userlist", { users: usersData });
    } catch (error) {
        console.log(error.message);
        res.render("Userlist", { error: "Something went wrong. Please try again later." });
    }
};

const toggleUserStatus = async (req, res) => {
    const userId = req.query.userId;
    const action = req.query.action;
    try {
        // Find the user by userId
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (action === 'block') {
            user.is_blocked = true;
        } else if (action === 'unblock') {
            user.is_blocked = false;
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
        // Toggle the is_blocked status
        
        await user.save();

        res.json({ message: `${user.username} is ${user.is_blocked ? 'blocked' : 'unblocked'} successfully` });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Server Error' });
    }
};

const logout = async(req, res) => {
    try {
        res.clearCookie('token'); 
        res.redirect('/admin');
    } catch (error) {
        console.log(error.message);
        res.render('error', { message: "Something went wrong." });
    }
};

const orderlist = async(req,res)=>{
    try {
       
        const orders = await Order.find();
        console.log(orders);
        res.render('orderlist',{orders:orders});
    } catch (error) {
       console.log(error.message); 
       res.status(500).send("Server Error");
    }
}

const viewOrderDetails = async(req,res)=>{
    try {
        const orderId = req.query.orderId;
        const order = await Order.findById({_id:orderId});
        const address = await Address.findById(order.shippingAddress);
        const user = await User.findById(order.user);
        if(!order){
            return res.status(404).send("Order not found");
        }
        res.render('viewOrderDetails',{order,address,user});
        console.log("address is == ",address);
        console.log("user details == ",user);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
}

const orderStatus = async(req,res)=>{
    try {
        const {orderId,orderStatus} = req.body;
        const order = await Order.findById(orderId);
        order.orderStatus = orderStatus;
        await order.save();
        res.json({success:true, message:'Order status updated successfully'});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false,message:'Server error'});
    }
}



module.exports = {
    loadLogin,
    isAdmin,
    loadHome,
    userList,
    toggleUserStatus,
    logout,
    orderlist,
    viewOrderDetails,
    orderStatus
};
