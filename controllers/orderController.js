const Order = require("../models/orderModel");
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const jwt = require('jsonwebtoken');

const placeorder = async (req, res) => {
    try {
        const userId=req.id.id
        console.log("enter into place order");
        const{productId,productname,quantity,price,subtotal,totalAmount,addressId,paymentMethod}=req.body;
        console.log(addressId);

        const cart = await Cart.findOne({ userId });
        
        const cartItems = await Promise.all(cart.Product.map(async (item) => {
            const product = await Product.findById(item.productId);
            if (!product) {
              console.error(`Product with ID ${item.productId} not found`);
              return null; // Return null if the product is not found
            }
            const subtotal = product.price * item.quantity;
            return {
              product: product.toObject(),
              quantity: item.quantity,
              subtotal: subtotal,
              address:addressId
            };
          }));
         
      
          // Filter out null values from cartItems array
          const validCartItems = cartItems.filter(item => item !== null);
          console.log("vallid",validCartItems)
        const newOrder = new Order({
            user: userId,
            items: validCartItems,
            billTotal: totalAmount,
            shippingAddress: req.body.addressId,
            paymentMethod: paymentMethod,
            subtotal:subtotal                                                                                                                                                                                                                                                           
        });
          
        const saveData=await newOrder.save();
        console.log('Order saved successfully:', saveData);
         if(saveData){
            await Promise.all(validCartItems.map(async (item) => {
                const product = await Product.findById(item.product._id);
                if (product) {

                    product.stock -= item.quantity;
                    
                    await product.save();
                }
            }));
            res.json({sucess:true})
            await cart.deleteOne({userId:userId})
            
         }
    
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
const orderSucess=async(req,res)=>{
    try {
        console.log("enter in to order sucess")
        res.render("orderConfirmation")
    } catch (error) {
        console.log(error)
    }
}

const cancelOrder = async(req,res)=>{
    try {
       const {orderId}= req.body;
       const order = await Order.findById(orderId);
       if(!order){
        return res.status(404).send('Order not found');
       }
       order.orderStatus = 'Cancelled';
       await order.save();  
       res.status(200).send('Order cancelled successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};


     module.exports = {
            placeorder,
            orderSucess,
            cancelOrder
        };
