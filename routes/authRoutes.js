const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const {ensureAuthenticated, ensureManager, ensureSalesAgent} = require('../customMiddleware/auth');

const Registration = require('../models/Registration');
const Furniture = require("../models/Furniturestock");
const Wood = require("../models/Woodstock");
const Sale = require("../models/Sale");

router.get("/register", (req, res) => {
  res.render("signup",{
    success_msg: req.flash("success_msg"),
    error_msg: req.flash("error_msg")
  });
});

router.post("/register", async(req, res) =>{
  try {
    const newUser = new Registration(req.body)
    console.log(newUser)
    let user = await Registration.findOne({
      email: req.body.email
    })
    if(user){
      return res.status(400).send('Not registered, that user already exists.')
    }else{
      await Registration.register(newUser, req.body.password,(error)=>{
      if(error){
        throw error;
      }
    })
    req.flash("success_msg", "✅ Account created successfully. You can now log in.");
    res.redirect("/landing")
    }
  } catch (error) {
    console.error(error.message)
    req.flash("error_msg", "❌ Error creating account. Please try again.");
    res.status(400).send('Sorry something went wrong')
  }
});

router.get("/login", (req, res)=>{
  res.render("login", {
    success_msg: req.flash("success_msg"),
    error_msg: req.flash("error_msg")
  })
})

router.post("/login", passport.authenticate("local", {failureRedirect:"/login", failureFlash:true}), (req, res) =>{
  req.session.user = req.user
  req.flash("success_msg", `Welcome back, ${req.user.username}!`);
  if(req.user.role==="Manager"){
    res.redirect("/manager")
  }else if(req.user.role==="Sales Agent"){
    res.redirect("/agent")
  } else{ 
    res.render("nonuser")
  }
});

router.get("/logout", (req,res)=>{
  if(req.session){
    req.flash("success_msg", "👋 You have logged out successfully.");
    req.session.destroy((error)=>{
      if(error){
        return res.status(500).send('Error logging out!')
      }
      res.redirect("/landing")
    })
  }
});

router.get("/reset", (req, res) =>{
  res.render("reset_password",{
    success_msg: req.flash("success_msg"),
    error_msg: req.flash("error_msg")
  })
});

router.post("/reset", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Registration.findOne({ email });
    if (!user) {
      req.flash("error", "No account found with that email.");
      return res.redirect("/reset");
    }

    // Generate a unique token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // valid for 1 hour
    await user.save();

    // Send the reset email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetURL = `http://${req.headers.host}/reset/${token}`;
    const mailOptions = {
      to: user.email,
      from: "no-reply@mayondowood.com",
      subject: "Password Reset Link",
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetURL}\n\nIf you didn’t request this, ignore this email.`,
    };

    await transporter.sendMail(mailOptions);

    res.redirect("/success"); // your “Check your email” page
  } catch (err) {
    console.error(err);
    res.redirect("/reset");
  }
});

router.get("/reset/:token", async (req, res) => {
  const user = await Registration.findOne({
    resetToken: req.params.token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    req.flash("error", "Password reset token is invalid or has expired.");
    return res.redirect("/reset");
  }

  res.render("reset_confirm", { token: req.params.token });
});

router.get("/success", (req,res) => {
  res.render("reset_success")
});

router.get("/confirm", (req,res) => {
  res.render("reset_confirm")
});

router.get("/manager", ensureAuthenticated, ensureManager, async(req, res) => {
  try {
    // Count total furniture and wood stock
    const furnitureCount = await Furniture.countDocuments();
    const woodCount = await Wood.countDocuments();
    const totalProducts = furnitureCount + woodCount;

    // Get sales for the last 7 days (for the chart)
    const salesData = await Sale.aggregate([
      {
        $match: { date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: "$price" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Prepare sales chart data
    const salesLabels = salesData.length
      ? salesData.map(s => s._id)
      : ["No Sales"];
    const salesValues = salesData.length
      ? salesData.map(s => s.total)
      : [0];

    // Count low stock items (quantity < 5)
    const lowFurniture = await Furniture.countDocuments({ quantity: { $lt: 5 } });
    const lowWood = await Wood.countDocuments({ quantity: { $lt: 5 } });
    const lowStock = lowFurniture + lowWood;

    // Calculate total sales (sum of all sales)
    const totalSalesResult = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    const totalSales = totalSalesResult[0]?.total || 0;

    // Pending reports (for demo; replace with real logic)
    const pendingReports = 2;

    // Render the dashboard and pass live data
    res.render("manager_dashboard", {
      totalProducts,
      lowStock,
      totalSales,
      pendingReports,
      furnitureCount,
      woodCount,
      salesLabels,   // leave raw arrays
      salesValues,    // leave raw arrays
      success_msg: req.flash("success_msg"),
      error_msg: req.flash("error_msg")
    });
  } catch (error) {
    console.error("Error loading manager dashboard:", error.message);
    res.status(500).send("Server Error - Could not load dashboard.");
  }
});

router.get("/agent", ensureAuthenticated, ensureSalesAgent, (req, res) => {
  res.render("agent_dashboard", {
     success_msg: req.flash("success_msg"),
     error_msg: req.flash("error_msg")
  });
});

router.post("/agent", ensureAuthenticated, ensureSalesAgent, async (req, res) => {
  try {
    let { customerName, productType, productName, quantity, unitPrice, transport, paymentType, salesAgent, date } = req.body;

    // Convert to numbers
    quantity = parseFloat(quantity);
    unitPrice = parseFloat(unitPrice);

    // Calculate total price
    let totalPrice = quantity * unitPrice;
    if (transport) {
      totalPrice *= 1.05; // Add 5% if transport included
    }

    // Create and save new sale
    const newSale = new Sale({
      customerName,
      productType,
      productName,
      quantity,
      unitPrice,
      paymentType,
      salesAgent,
      date: new Date(date),
      totalPrice: totalPrice.toFixed(2), // save formatted total
    });

    await newSale.save();

    req.flash("success_msg", "✅ Sale recorded successfully!");
    res.redirect("/agent");
  } catch (error) {
    console.error("Error recording sale:", error.message);
    req.flash("error_msg", "❌ Error recording sale. Please try again.");
    res.redirect("/agent");
  }
});

//last line
module.exports = router;
