
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");
const Order = require('../models/orderModel');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const jwt = require("jsonwebtoken");

 


//create a token

const createToken = (user)=>{
  const JWT_SECRET = process.env.JWT_SECRET
  return jwt.sign(user,JWT_SECRET,{expiresIn:"24h"})

}

// Function to calculate OTP expiry time
const otpExpiryTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  return now;
};



const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const sendOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "vinuk5001@gmail.com",
        pass:"ceen iiaa rqqd ibdi"

      },
    });

    const mailOptions = {
      from: {
        name: "First main Project",
        address: "vinuk5001@gmail.com"
      },
      to: email,
      subject: "OTP Verification",
      html: `<p>Your OTP for email verification is <strong>${otp}</strong>. This OTP is valid for 10 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("OTP email has been sent");
  } catch (error) {
    console.log(error.message);
  }
};

const landingPage = async (req, res) => {
  try {
    res.render("landingpage");
  } catch (error) {
    console.log(error);
  }
};

const loadRegister = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    console.log("user",req.id.id)
    const listedProducts = await Product.find({isListed:true});
    console.log(listedProducts);
    const categories = await Category.find();
    console.log(categories);
    res.render("home", { product: listedProducts,categories:categories});
  } catch (error) {
    console.log(error.message);
    res.status(500).send("An error occurred while loading the home page.");
  }
};


const categorySelect = async (req, res) => {
    try {
        const categoryId = req.query.id;
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.render('home', { message: "Category not found", products: [] });
        }
        const products = await Product.find({ category: categoryId });

        res.render('home', { category, products });
    } catch (error) {
        console.log(error.message);
        res.status(500).render('categoryProducts', { error: "Server Error", products: [] });
    }
};



const loadShop = async (req, res) => {
  try {
    let sortOption = req.query.sort || 'nameAsc';
    let sortCriteria;

    switch(sortOption){
      case 'priceAsc':
        sortCriteria = {price:1};
        break;
      case 'priceDesc':
        sortCriteria = {price:-1};
        break;
      case 'nameAsc':
        sortCriteria = {name:1};
        break;
      case 'nameDesc':
        sortCriteria = {name:-1};
        break;
      default:
        sortCriteria = {name:1};
        break;
    }        
    const products = await Product.find({isListed:true,status:"Active"}).sort(sortCriteria);

    res.render("shop", { product: products,sortOption : sortOption });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("An error occurred while loading the shop page.");
  }
};



const insertUser = async (req, res) => {
  try {
    const { username, email, password, mobile_number, confirmpassword } = req.body;

    if (password !== confirmpassword) {
      return res.render('registration', { message: "Passwords do not match" });
    }
    const spassword = await securePassword(password);
    const otp = generateOTP();
    const otpExpiry = otpExpiryTime();

    const user = new User({
      username,
      email,
      mobile_number,
      password: spassword,
      otp,
      otp_expiry: otpExpiry
    });

    const userData = await user.save();

    if (userData) {
      await sendOTP(email,otp);
      res.redirect(`/otp-verification?userId=${userData._id}&otpExpiry=${otpExpiry.getTime()}`);
    } else {
      res.render('registration', { message: "Your registration has failed" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("An error occurred during registration");
  }
};

const verifyOTP = async (req,res) => {
  try {
    const {userId, otp} = req.body;

    if (!userId || !otp) {
      return res.render('otp-verification', { userId: null, message: "Invalid OTP or OTP has expired." });
    }

    if (!ObjectId.isValid(userId)) {
      return res.render('otp-verification', { userId: null, message: "Invalid user ID." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.render('otp-verification', { userId: null, message: "User not found." });
    }

    if (user.otp !== otp || user.otp_expiry < new Date()) {
      return res.render('otp-verification', { userId: userId, message: "Invalid OTP or OTP has expired." });
    }

    user.is_verified = 1;
    user.otp = '';
    user.otp_expiry = null;
    await user.save();

    res.redirect('/login');
  } catch (error) {
    console.log(error.message);
    res.status(500).send("An error occurred during OTP verification.");
  }
};

const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success:false,message:"User not found."});
    }

    if (user.otp && user.otp_expiry > new Date()) {
      await sendOTP(user.email, user.otp);
      return res.json({ success: true, message: "The existing OTP has been resent.", otpExpiry: user.otp_expiry.getTime() });
    }

    const otp = generateOTP();
    const otpExpiry = otpExpiryTime();

    user.otp = otp;
    user.otp_expiry = otpExpiry;
    await user.save();

    await sendOTP(user.email, otp);
    res.json({ success: true, message: "A new OTP has been sent to your email.", otpExpiry: otpExpiry.getTime() });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: "An error occurred while resending OTP." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        const token = createToken({ id: user._id });

        res.cookie("jwt", token, {
          httpOnly: true,
          maxAge: 60 * 60 * 1000,
        });

        res.redirect("/home");
      } else {
        return res.render('login', { message: "Invalid email or password" });
      }
    } else {
      return res.render('login', { message: "Invalid email or password" });
    }
  } catch (error) { 
    console.log(error);
    res.status(500).send("An error occurred during login");
  }
};

const singleProduct = async (req, res) => {
  try {
    const { id } = req.query;
    const product = await Product.findOne({ _id: id });

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const relatedProducts = await Product.find({ category: product.category });
    res.render("singleProduct", { products: product, relatedProducts: relatedProducts });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("An error occurred while loading the product details.");
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie('jwt');
    res.redirect('/login');
  } catch (error) {
    console.log(error.message);
    res.status(500).send("An error occurred during logout");
  }
};

const userProfile = async (req, res) => {
  try {
    const userId=req.id.id;
    const addresses = await Address.find({ userId });
    const saveData=await User.findById(userId)

    const address = await Address.find({user:userId});
    const orders = await Order.find({ user: userId }).populate('items.product');
    const orderid=req.query.id
    console.log("mdjyckujcy",orders)
    res.render('userProfile',{user:userId,address:addresses,order:orders,saveData:saveData});
  } catch (error) {
    console.log(error.message);
    res.status(500).send("something went wrong");
  }
};


const editProfile = async (req, res) => {
  try {
    const users = req.id.id;
    const saveData=await User.findById(users)
    res.render('editProfile',{user:saveData});
  } catch (error) {
    console.log(error.message);
    res.status(500).send("something went wrong");
  }
};
const editedProfile = async (req,res) =>{
  try {
    const {id,name,email,mobile_number}=req.body;
     const updateData = {
      username : name,
      email:email,
      mobile_number:mobile_number
    }
    const saveData = await User.findByIdAndUpdate(id,updateData,{new:true});

    res.redirect("/userProfile");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("something went wrong");
  }
}

const addAddress = async (req,res) =>{
  try{
      const {address,city,state,pincode} = req.body;
      console.log(req.body)
       const userId=req.id.id
      const userAddress = new Address({
        userId:userId,
           address:address,
          city:city,
          state:state,
          pincode:pincode,
          user:userId
        });
  
  const saveAddress = await userAddress.save();
  const user = await User.findById(userId);
  // user.addresses.push(saveAddress._id);
  await user.save();
  res.redirect("/userProfile");
} catch (error){
  res.status(500).json({error:error.message});
}
}



const renderEditAddress = async(req,res)=>{
  try {
    console.log("enter in to edit adresss")
    const addressId = req.query.id;
    console.log(addressId);
    const address = await Address.findById(addressId);
    if(!address){
      return res.status(404).send("Address not found");
    }
    res.render('editAddress',{address:address});
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Something went wrong");
  }
};
const editAddress = async(req,res)=>{
  try{
    let {address,city,state,pincode,addressId} = req.body;
      console.log(req.body)
    let updateData = {
      address:address,
      city:city,
      state:state,
      pincode:pincode
    }
    // const addressId = req.body.addressId;
    // const Address = await Address.findById(addressId);
    const updateAddress = await Address.findByIdAndUpdate(addressId,updateData,{new:true})
    if(!updateAddress){
    return res.status(404).send("Address not found");
    }
    res.redirect("/userProfile");
  }catch(error){
    console.log(error.message);
    res.status(500).send("server Error");
  }
}

const deleteAddress = async(req,res)=>{
  try{
    const addressId = req.query.addressId;
    const userId = req.id.id;
    const address = await Address.findByIdAndDelete(addressId);
    if(!address) {
      return res.status(404).send("Address not found");
    }
     const userData = await User.findByIdAndUpdate(userId,
      {$pull:{addresses:addressId}
    })
    res.redirect("/userProfile");
  }catch(error){
    console.log(error.message);
    res.status(500).send("Something went wrong");  
  }  
  };




  const loadCart = async (req, res) => {
    try {
      const token = req.cookies.jwt;
      if (!token) {
        throw new Error('JWT cookie not found');
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      const cartItems = await Cart.aggregate([
        {
          $match: { userId: userId }
        },
        {
          $unwind: "$Product"
        },
        {
          $lookup: {
            from: "products",
            localField: "Product.productId",
            foreignField: "_id",
            as: "productDetails"
          }
        },
        {
          $unwind: "$productDetails"
        },
        {
          $lookup: {
            from: "categories",
            localField: "productDetails.category",
            foreignField: "name",  // Match category string with name in Category
            as: "categoryDetails"
          }
        },
        {
          $unwind: "$categoryDetails"
        },
        {
          $project: {
            _id: 0,
            subtotal: { $multiply: ["$Product.quantity", "$productDetails.price"] },
            product: "$productDetails",
            quantity: "$Product.quantity",
            categoryName: "$categoryDetails.name"
          }
        }
      ]);
  
      
  
      // Render the cart page with cart items
      console.log(cartItems);
      res.render('cart', { cartItems });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("An error occurred while loading the cart.");
    }
  };
  

  const addToCart = async (req, res) => {
    try {
      const token = req.cookies.jwt;
      if (!token) {
        throw new Error('JWT cookie not found');
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      const productId = req.query.productId;
      console.log("fjytcdijkytct"+productId);
  
      // Validate productId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
  
      const objectIdProductId = new mongoose.Types.ObjectId(productId);
  
      // Get the product from the database to check its stock
      const product = await Product.findById(objectIdProductId);
      if (!product) {
        throw new Error('Product not found');
      }
      console.log(product)
      let cart = await Cart.findOne({ userId: userId });
      if (!cart) {
        cart = new Cart({
          userId: userId,
          Product: [{ productId: objectIdProductId, quantity: 1 }]
        });
      } else {
        const existingProduct = cart.Product.find(
          item => item.productId.toString() === objectIdProductId.toString()
        );
  
        if (existingProduct) {
          if (existingProduct.quantity >= product.stock) {
            // If stock limit reached, send a response indicating out of stock
            return res.status(400).json({ message: "Out of stock" });
          }
          existingProduct.quantity += 1;
        } else {
          cart.Product.push({ productId: objectIdProductId, quantity: 1 });
        }
      }
    
  
      await cart.save();
      // res.status(200).json({ message: "Product added to cart" });
      res.redirect("/cart");
    } catch (error) {
      console.error(error.message);
      res.status(500).send("An error occurred while adding to cart.");
    }
  };
  
  

 


const cartUpdateQuantity = async (req, res) => {
  try {
      console.log("upfdate")
      const token = req.cookies.jwt;
    if (!token) {
      throw new Error('JWT cookie not found');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

      console.log("iytfiyuv",req.body);
      const { productId, quantity } = req.body;

      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).send('Product not found');
      }

      const cart = await Cart.findOne({ userId: userId });
      if (!cart) {
          return res.status(404).send('Cart not found');
      }

      const cartItemIndex = cart.Product.findIndex(item => item.productId.toString() === productId);
      if (cartItemIndex === -1) {
          return res.status(404).send('Product not found in cart');
      }

      cart.Product[cartItemIndex].quantity = quantity;

      // Recalculate total amount based on updated quantities
      let totalAmount = 0;
      for (const item of cart.Product) {
          const product = await Product.findById(item.productId);
          totalAmount += product.price * item.quantity;
      }

      // Update the total amount in the cart
      cart.totalAmount = totalAmount;
      await cart.save();

      res.redirect('/cart');
  } catch (error) {
      console.error(error);
      res.status(500).render('error');
  }
};

const removeItem = async(req,res)=>{
  try {
    const token = req.cookies.jwt
    if(!token){
      throw new Error("JWT cookie not found");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const productId = req.query.productId;

    console.log(userId,productId);

    const cart = await Cart.findOneAndUpdate({userId:userId},
      {$pull:{Product:{productId:productId}}},
      {new:true});
      
      console.log(cart);

    res.redirect("/cart");
  } catch (error) {
    console.log(error.message);
  }
}
const getResetPassword = (req, res) => {
  const { token } = req.query;
  res.render('resetPassword', { token, message: '' });
};
const forgotPassword = async (req, res) => {
  const { forgotEmail } = req.body;
  try {
      const user = await User.findOne({ email: forgotEmail });
      if (!user) {
          return res.status(404).json({ message: 'No user with that email' });
      }

      const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: 'vinuk5001@gmail.com',
              pass: 'xghs aexg xdhz repf', // Consider using environment variables for sensitive information
          },
      });

      const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
      const mailOptions = {
          from: 'vinuk5001@gmail.com',
          to: forgotEmail,
          subject: 'Password Reset',
          text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
                `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                `${resetLink}\n\n` +
                `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'A password reset link has been sent to your email.' });
  } catch (error) {
      console.error(error); // Log the error for debugging
      res.status(500).json({ message: 'An error occurred while trying to reset the password.' });
  }
};
const postResetPassword = async (req, res) => {
  const { token } = req.body; // Get the token from the form data
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).render('resetPassword', { token, message: "Passwords do not match" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) {
      return res.status(400).send('Password reset token is invalid or has expired');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while resetting the password.');
  }
};
 
const changePassword = async(req,res)=>{
  try{
    const {token} = req.query;
    const message = "Error:wrong Password";
    console.log("hgfxcjgfc ");

    res.render("checkCurrentPassword",{token,message:''});
  }catch(error){
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
}

const checkCurrentPassword = async (req, res) => {
  try {
    const { password, token } = req.body;
    console.log(password);

    // Verify token to get userId
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).send("Invalid token");
    }

    const userId = decoded.id;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Compare the provided password with the hashed password in the database
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      res.redirect(`/profileForgotPassword?token=${token}`);
    } else {
      const message = "Error: wrong Password";
      res.render("checkCurrentPassword", { token, message });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
}

const profileForgotPassword = async(req,res)=>{
  try {
      res.render("profileChangePassword");    
  } catch(error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
}
}
const updatePassword = async (req, res) => {
  try {
    console.log("Request received:",req.body);
    const token = req.cookies.jwt;
    if (!token) {
      throw new Error('JWT cookie not found');
    }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
    const newPassword = req.body.password;
    const  confirmPassword = req.body.confirmPassword;
   console.log("New password:",newPassword);
   console.log("confirm password:",confirmPassword); 
    if (newPassword !== confirmPassword) {
      console.log("Passwords do not match");
      return res.render('profileChangePassword', { message: "Error: Passwords do not match." });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
     await user.save();
    console.log("userData===",user);
    res.redirect('/userProfile');
  } catch (error) {
    if(error.name === 'JsonWebTokenError'){
      return res.status(401).send("Invalid token");
    }else if(error.name === 'TokenExpiredError'){
      return res.status(401).send('Token expired');
    }
    console.error("Error in profileForgotPassword:", error.message);
    res.status(500).send("Internal server error");
  }
}

const profileLogout = (req,res)=> {
  try { 
      res.clearCookie('jwt');
      res.redirect("/login");
      res.render("profileLogout");  
  } catch (error) {
    console.log(error.message);
    res.status(500).send("An error occured during logout");  
  }
};

const searchBook = async(req,res)=>{
  try{
    console.log("enter into search");
    const {search} = req.body;
    console.log(search);
    const categories = await Category.find()
    const regex =  new RegExp(search,'i');
    const products = await Product.find({name:{$regex:regex}});
    res.render('home',{categories:categories,product:products});
  }catch(error){
    console.error('Error occurred while searching for products:',error);
    res.status(500).send({error:'An error occurred while searching for products'});
  }
};

const searchInShop = async(req,res)=>{
  try{
    console.log("enter into search inn shooop");
    const {search} = req.body;
    console.log(search);
    const categories = await Category.find()
    const regex =  new RegExp(search,'i');
    const products = await Product.find({name:{$regex:regex}});
    res.render('shop',{categories:categories,product:products});
  }catch(error){
    console.error('Error occurred while searching for products:',error);
    res.status(500).send({error:'An error occurred while searching for products'});
  }
}




const showOrderDetails = async (req, res) => {
  try {
    console.log("Entering showOrderDetails function");

    const orderId = req.query.orderid; 

    if (!orderId) {
      return res.status(400).send('Order ID is required');
    }

    const order = await Order.findById(orderId).populate('items.product');
    console.log("Order details:", order);
    res.render("orderDetails", { order });

  } catch (error) {
    console.error("Error in showOrderDetails:", error);
    res.status(500).send('Server Error');
  }
};


const filterByCategory = async (req,res)=>{
   try {
    const categoryName = req.query.category;
    const categories = await Category.find();
    const products = await Product.find({category: categoryName});
    res.render("home",{categories : categories,product:products});
   } catch (error) {
    console.error("Error occurred while filtering products by category:",error);
    res.status(500).send({error:'An error occurred while filtering products by category'});
   }
}










module.exports = {
  landingPage,
  loadRegister,
  loadLogin,
  insertUser,
  verifyOTP,
  resendOTP,
  loadHome,
  loginUser,
  singleProduct,
  logout,
  loadShop,
  userProfile,
  editProfile,
  editedProfile,
  addAddress,
  renderEditAddress,
  loadCart,
  addToCart,
  removeItem,
  forgotPassword,
  getResetPassword,
  postResetPassword,
  deleteAddress,
  editAddress,
  profileForgotPassword,
  changePassword,
  checkCurrentPassword,
  updatePassword,
  profileLogout,
  cartUpdateQuantity,
  categorySelect,
  searchBook,
  showOrderDetails,
  searchInShop,
  filterByCategory
};
