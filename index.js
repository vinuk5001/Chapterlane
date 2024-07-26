const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/First-Main-Project");

const cookieParser = require('cookie-parser');
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const nocache = require("nocache");
const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false})); 
app.use(cookieParser());
app.use(nocache())

app.use('/',userRoute)
app.use('/admin',adminRoute)

  
const PORT = process.env.PORT || 3000;
app.listen(PORT,function(){
    console.log(`Server is running on port ${PORT}`);
});
