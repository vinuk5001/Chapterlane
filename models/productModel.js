const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        validate: [arrayLimit, 'Minimum 2 images required'],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        ref: 'Category',
        required: true
    },
    is_published: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Out-of-stock'],
        default: 'active'
    },
    stock: {
        type: Number,
        required: true,
        default: 1
    },
    ratings: {
        type: Number,
        min: 1,
        max: 5
    },
    highlights: {
        type: String
    },
    reviews: {
        type: String
    },
    isListed: {
        type: Boolean,
        default: true
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    deleted_at: {
        type: Date,
        default: null
    },
    views: {
        type: Number,
        default: 0
    }
    
}, {
    timestamps: true
});

function arrayLimit(val) {
    return val.length >= 2;
}

module.exports = mongoose.model('Product', productSchema);
