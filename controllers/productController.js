const Product = require('../models/productModel');
const categoryModel = require("../models/categoryModel");
const { upload } = require('../Helpers/multerStorage');

const loadProductList = async (req, res) => {
    try {
        let sortOption = req.query.sort || 'nameAsc';
        let sortCriteria;

        switch (sortOption) {
            case 'priceAsc':
                sortCriteria = { price: 1 };
                break;
            case 'priceDesc':
                sortCriteria = { price: -1 };
                break;
            case 'nameAsc':
                sortCriteria = { name: 1 };
                break;
            case 'nameDesc':
                sortCriteria = { name: -1 };
                break;
            default:
                sortCriteria = { name: 1 };
                break;
        }

        const products = await Product.find({ isListed: true,status:"Active" }).sort(sortCriteria);
        res.render("productlist", { products: products });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};

const renderEditProductPage = async (req, res) => {
    try {
        const productId = req.query.id;
        if (!productId) {
            throw new Error("Product ID is missing from the request");
        }
        const product = await Product.findById(productId);
        console.log(product);
        if (!product) {
            throw new Error("Product not found");
        }
        const categories = await categoryModel.find();
        res.render("editProduct", { product: product, categories: categories });
    } catch (error) {
        console.log(error.message); 
        res.status(500).send("Server Error: " + error.message);
    }
};

const editProduct = async (req, res) => {
    try {
        let { name, author, price, discount, description, category, stock, status, ratings, highlights, reviews, productId } = req.body;
        let removeImages = req.body.removeImages || [];
        if (!Array.isArray(removeImages)) {
            removeImages = [removeImages];
        }

        let updateData = {
            name: name,
            author: author,
            price: price,
            discount: discount,
            description: description,
            category: category,
            stock: stock,
            status: status,
            ratings: ratings,
            highlights: highlights,
            reviews: reviews
        };

        const product = await Product.findById(productId);

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.filename);
            updateData.images = [...product.images, ...newImages];
        } else {
            updateData.images = product.images;
        }

        if (removeImages.length > 0) {
            updateData.images = updateData.images.filter(image => !removeImages.includes(image));
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });
        res.redirect('/admin/productList');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};

const loadAddProducts = async (req, res) => {

    try {
        console.log("enter itn ")
        const categories = await categoryModel.find();
        console.log(categories);
        res.render("addProduct", { categories: categories });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};

const addProduct = async (req, res) => {
    try {
        const { name, author, price, discount, description, category, stock, status, ratings, highlights, reviews } = req.body;
        const uploadedImages = req.files.map(file => file.filename);

        const newProduct = new Product({
            name: name,
            author: author,
            price: price,
            discount: discount,
            description: description,
            category: category,
            stock: stock,
            status: status,
            ratings: ratings,
            highlights: highlights,
            reviews: reviews,
            images: uploadedImages
        });

        await newProduct.save();
        res.redirect("/admin/productlist");
    } catch (error) {
        res.status(500).send("Server Error");
        console.log(error);
    }
};

const listProduct = async (req, res) => {
    try {
        const productId = req.query.id;
        await Product.findByIdAndUpdate(productId, { isListed: true });
        res.redirect("/admin/productList");
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};

const unlistProduct = async (req, res) => {
    try {
        const productId = req.query.id;
        await Product.findByIdAndUpdate(productId, { isListed: false });
        res.redirect("/admin/productList");
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};

const showUnlisted = async (req, res) => {
    try {
        const unlistedProducts = await Product.find({ isListed: false });
        res.render("showunlisted", { unlistedProducts: unlistedProducts });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};



module.exports = {
    loadProductList,
    addProduct,
    loadAddProducts,
    editProduct,
    renderEditProductPage,
    listProduct,
    unlistProduct,
    showUnlisted
};
