const Category = require('../models/categoryModel');

const loadCategory = async (req, res) => {
    try {
        const categories = await Category.find({ is_Listed: true });
        res.render("categories", { category: categories });
    } catch (error) {
        console.log(error.message);
        res.render("categories", { error: "Something went wrong. Please try again later." });
    }
};

const loadAddCategory = async (req, res) => {
    try {
        console.log("enter in to post cartegory")
        const { name, description, order } = req.body;
        const existingCategory = await Category.findOne({
            $or: [{ name: name }, { description: description }]
        });
        const categories = await Category.find({ is_Listed: true });
        if (existingCategory) {
            return res.render('categories', {category:categories, message: "Category with the same name or description already exists" });
        }
        const newCategory = new Category({
            name,
            description,
            order
        });

        await newCategory.save();      
       res.redirect("/admin/categories")
    } catch (error) {
        console.error(error.message);
        
    }
};

const renderEditCategory = async (req, res) => {
    try {
        const categoryId = req.query.id;
        const category = await Category.findById(categoryId);
        res.render("editcategory", { category: category });
    } catch (error) {
        console.log(error.message);
        res.render("editcategory", { error: "Something went wrong. Please try again later." });
    }
};

const editCategory = async (req, res) => {
    try {
        const { id, name, description, order } = req.body;

        // Check if category with same name or description already exists
        const existingCategory = await Category.findOne({
            $and: [
                { _id: { $ne: id } },  // Exclude the current category being edited
                { $or: [{ name: name }, { description: description }] }
            ]
        });

        if (existingCategory) {
            return res.render('categories', { message: "Category with the same name or description already exists" });
        }

        // Update category if it doesn't exist
        const updateData = { name, description, order };
        await Category.findByIdAndUpdate(id, updateData, { new: true });

        // Fetch all categories and render the categories view
        const categories = await Category.find({ is_Listed: true });
        res.render("categories", { category: categories, message: "Category updated successfully" });
    } catch (error) {
        console.log(error.message);
        res.status(500).render('categories', { error: "Something went wrong. Please try again later." });
    }
};

const listCategory = async (req, res) => {
    try {
        const categoryId = req.query.id;
        await Category.findByIdAndUpdate(categoryId, { is_Listed: true });

        // Fetch all categories and render the categories view
        const categories = await Category.find({ is_Listed: true });
        res.render("categories", { category: categories, message: "Category listed successfully" });
    } catch (error) {
        console.log(error.message);
        res.status(500).render("categories", { error: "Server Error" });
    }
};

const unlistCategory = async (req, res) => {
    try {
        const categoryId = req.query.id;
        await Category.findByIdAndUpdate(categoryId, { is_Listed: false });

        // Fetch all categories and render the categories view
        const categories = await Category.find({ is_Listed: true });
        res.render("categories", { category: categories, message: "Category unlisted successfully" });
    } catch (error) {
        console.log(error.message);
        res.status(500).render("categories", { error: "Server Error" });
    }
};

const showUnlistedCategory = async (req, res) => {
    try {
        const unlistedCategory = await Category.find({ is_Listed: false });
        res.render("showunlistedcategory", { Categories: unlistedCategory });
    } catch (error) {
        console.log(error.message);
        res.status(500).render("showunlistedcategory", { error: "Server Error" });
    }
};





module.exports = {
    loadCategory,
    loadAddCategory,
    renderEditCategory,
    editCategory,
    listCategory,
    unlistCategory,
    showUnlistedCategory,
   
};
