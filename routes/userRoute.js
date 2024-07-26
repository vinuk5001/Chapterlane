const express = require("express");
const user_route = express()
const { isAuthenticated } = require('../middleware/auth');
const middleware = require("../middleware/auth"); 

user_route.set('view engine','ejs');
user_route.set('views','./views/users');


const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));



user_route.use(express.static("public"));


const userController = require("../controllers/userController");
const checkOutController = require("../controllers/checkOutController");
const orderController = require("../controllers/orderController");




user_route.get('/',middleware.isLoggedin,userController.landingPage);
user_route.get('/register',userController.loadRegister);
user_route.post('/register',userController.insertUser);
user_route.get('/login',middleware.isLoggedin,userController.loadLogin);
user_route.get('/logout',userController.logout);







user_route.get('/userProfile',middleware.requirelogin,userController.userProfile);
user_route.get('/editProfile',middleware.requirelogin,userController.editProfile);
user_route.post('/editProfile',middleware.requirelogin,userController.editedProfile);
user_route.post('/updateAddress',middleware.requirelogin,userController.addAddress);
user_route.get('/editAddress',middleware.requirelogin,userController.renderEditAddress);
user_route.post('/editAddress',middleware.requirelogin,userController.editAddress);
user_route.get('/deleteAddress',middleware.requirelogin,userController.deleteAddress);
user_route.get('/profileForgotPassword',middleware.requirelogin,userController.profileForgotPassword);
user_route.post('/update',middleware.requirelogin,userController.updatePassword);
user_route.get('/profileLogout',middleware.requirelogin,userController.profileLogout);


user_route.get('/cart',middleware.requirelogin,userController.loadCart);
user_route.get('/addToCart',userController.addToCart);
user_route.get('/cartRemove',userController.removeItem);
user_route.get('/checkOut',checkOutController.checkOut);
user_route.post('/checkOut',checkOutController.checkOut);
user_route.post('/updateCartQuantity',userController.cartUpdateQuantity)

user_route.get('/order-confirmation',middleware.requirelogin,orderController.orderSucess);
user_route.post('/orderSucess',middleware.requirelogin,orderController.placeorder);  

user_route.post('/forgot-password',userController.forgotPassword);
user_route.get('/reset-password',userController.getResetPassword);
user_route.post('/reset-password',userController.postResetPassword);
user_route.get('/changePassword',userController.changePassword);
user_route.post('/checkCurrentPassword',userController.checkCurrentPassword);
user_route.post('/addressCheckout',checkOutController.addressCheckout);
user_route.get('/deleteAddressCheckout',checkOutController.addressCheckout);
user_route.get('/categorySearch',userController.categorySelect);
user_route.post('/search',userController.searchBook);
user_route.post('/searchShop',userController.searchInShop);

user_route.get('/orderDetails',userController.showOrderDetails)
user_route.post('/cancelOrder',orderController.cancelOrder);
user_route.get('/category',userController.filterByCategory);

user_route.get('/home',middleware.requirelogin,userController.loadHome);  
user_route.get('/singleProduct',middleware.requirelogin,userController.singleProduct);
user_route.get('/shop',middleware.requirelogin,userController.loadShop);
user_route.post('/login',userController.loginUser);
user_route.get('/verify-otp',userController.verifyOTP);
user_route.post('/verify-otp',userController.verifyOTP);
user_route.get('/resend-otp', userController.resendOTP);
user_route.post('/resend-otp', userController.resendOTP);
user_route.get('/otp-verification', (req, res) => {
    const userId = req.query.userId;
    res.render('otp-verification', { userId, message: "Please check your email for the OTP." });
  });
user_route.get('/otp-verification', (req, res) => {
    const { userId, otpExpiry, message } = req.query;
    res.render('otp-verification', { userId, otpExpiry, message });
  });
  

module.exports = user_route;