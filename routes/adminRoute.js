
const express = require("express");
const admin_route = express();
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController");
const categoryController = require("../controllers/categoryController");
const orderController = require("../controllers/orderController");
const { upload } = require("../Helpers/multerStorage");
const middleware = require("../middleware/auth");


admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");
admin_route.use(express.static("public"));

admin_route.get('/', adminController.loadLogin);
admin_route.post('/', adminController.isAdmin);
admin_route.get('/home', middleware.requireAuth, adminController.loadHome);
admin_route.get('/userList', adminController.userList);
admin_route.get('/productList', productController.loadProductList);
admin_route.get('/addProduct', productController.loadAddProducts);
admin_route.get('/categories', categoryController.loadCategory);
admin_route.post('/categories', categoryController.loadAddCategory);
admin_route.get('/editcategory', categoryController.renderEditCategory);
admin_route.post('/editcategory', categoryController.editCategory);
admin_route.get('/orderlist',adminController.orderlist);
admin_route.get('/viewOrderDetails',adminController.viewOrderDetails);
admin_route.post('/orderStatus',adminController.orderStatus);


admin_route.get('/listcategory',categoryController.listCategory);
admin_route.get('/unlistcategory',categoryController.unlistCategory);
admin_route.get('/showunlistedcategory',categoryController.showUnlistedCategory);
admin_route.post('/addProduct', upload.array('files', 5), productController.addProduct);
admin_route.get('/editProduct', productController.renderEditProductPage);
admin_route.post('/editProduct', upload.array('files', 10), productController.editProduct);

admin_route.get('/listProduct', productController.listProduct);
admin_route.get('/unlistProduct', productController.unlistProduct);
admin_route.get('/showunlisted', productController.showUnlisted);

admin_route.get('/Userlist', adminController.userList);
admin_route.post('/toggleUserstatus', adminController.toggleUserStatus);

admin_route.get('/logout', adminController.logout);

module.exports = admin_route;


