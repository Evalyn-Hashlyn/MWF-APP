// 1. Dependencies come first
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const passport = require('passport');
const flash = require('connect-flash');
const expressSession = require("express-session")({
  secret:process.env.SESSION_SECRET || "dev_secret",
  resave:false,
  saveUninitialized:false,
})
require("dotenv").config();

//Import registration model
const Registration = require("./models/Registration");

// Import Routes
const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require("./routes/authRoutes");
const stockRoutes = require("./routes/stockRoutes");

// 2. Instantiations
const app = express();
const port = 3000;

// 3. Configurations
//setting up database connections
mongoose.connect(process.env.MONGO_URI);
mongoose.connection
  .once("open", ()=>{
    console.log("mongoose connection open");
  })
  .on("error", (error)=>{
    console.error(`connection error:${error.message}`)
  });
  
//set view engine to pug
app.set("view engine", "pug"); // setting up pug as the view engine
app.set("views", path.join(__dirname, "views")); // specifying the views directory

// 4. Middleware
app.use(express.urlencoded({ extended: false }));//without this, you cannot push data to the database
app.use(express.static(path.join(__dirname, "public"))); //serving static files
app.use(express.json());
app.use('/public/images/uploads', express.static(__dirname + '/public/images/uploads'));


//Express session configs
app.use(expressSession);
app.use(passport.initialize());
app.use(passport.session());
//Passport Configs
passport.use(Registration.createStrategy());
passport.serializeUser(Registration.serializeUser());
passport.deserializeUser(Registration.deserializeUser());
app.use(flash());
// Global variables to be accessed by all views
app.use((req, res,next) => {
  res.locals.currentUser = req.session.user;
  next();
});
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error'); // passport often uses this
  res.locals.currentUser = req.user || null;
  next();
});

// 5. Use imported Routes
app.use("/", indexRoutes);
app.use("/", authRoutes );
app.use("/", stockRoutes);

//handling non-existent routes
app.use((req, res) => {
  res.status(404).send("Oops! Route not found.");
});

// 6. Bootstrapping Server
// should always be the last line in your file
app.listen(port, () => console.log(`listening on port ${port}`));