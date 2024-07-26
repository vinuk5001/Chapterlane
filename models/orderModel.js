const mongoose = require('mongoose');
const {Schema,model} = mongoose;
const {ObjectId} = Schema.Types;
const orderSchema = new mongoose.Schema({
    user: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    cart: {
        type: ObjectId,
        ref: 'Cart'
    },
   
    orderStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Deleted', 'Returned'],
        default: 'Shipped'
    },
    items:{
        type:Array
    },
    billTotal: {
        type: String,
        required: true
    },
    additionalMobile: {
        type: String,
        default: ''
    },
    shippingAddress: {
        type:String,
    },
    paymentMethod: {
        type: String,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    
    cancellationReason: {
        type: String,
        default: ''
    },
    subtotal:{
        type:String
    }
   
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
