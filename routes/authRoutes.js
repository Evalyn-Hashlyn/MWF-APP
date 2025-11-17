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

router.get("/manager", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const registeredUser = await Registration.find().lean();
    // 1️⃣ Basic counts
    const furnitureCount = await Furniture.countDocuments();
    const woodCount = await Wood.countDocuments();
    const totalProducts = furnitureCount + woodCount;

    // 2️⃣ Low stock threshold (example: less than 10)
    const lowStock = await Furniture.countDocuments({ quantity: { $lt: 10 } }) +
                     await Wood.countDocuments({ quantity: { $lt: 10 } });

    // 3️⃣ Total sales
    const totalSalesAgg = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const totalSales = totalSalesAgg.length ? totalSalesAgg[0].total : 0;

    // 4️⃣ Pending reports (you can adjust logic)
    const pendingReports = 3; // Placeholder, replace with real data if needed

    // 5️⃣ Sales chart (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const sales = await Sale.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo, $lte: today }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: "$totalPrice" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Generate labels for last 7 days (ensuring all days appear)
    const salesLabels = [];
    const salesValues = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const sale = sales.find(s => s._id === dateStr);
      salesLabels.push(date.toLocaleDateString("en-US", { weekday: "short" }));
      salesValues.push(sale ? sale.total : 0);
    }

    // ✅ Render the dashboard
    res.render("manager_dashboard", {
      registeredUser,
      totalProducts,
      lowStock,
      totalSales,
      pendingReports,
      furnitureCount,
      woodCount,
      salesLabels,
      salesValues,
      success_msg: req.flash("success_msg"),
      error_msg: req.flash("error_msg")
    });

  } catch (error) {
    console.error("Error loading manager dashboard:", error.message);
    req.flash("error_msg", "Error loading dashboard data.");
    res.redirect("/login");
  }
});

router.get("/agent", ensureAuthenticated, ensureSalesAgent, (req, res) => {
  res.render("agent_dashboard", {
     success_msg: req.flash("success_msg"),
     error_msg: req.flash("error_msg"),
     currentUser: req.user
  });
});

router.post("/agent", ensureAuthenticated, ensureSalesAgent, async (req, res) => {
  try {
    console.log("🧾 Sale form data received:", req.body);

    // Destructure values from req.body
    let {
      customerName,
      productType,
      productName,
      quantity,
      unitPrice,
      transport,
      paymentType,
      salesAgent,
      date
    } = req.body;

    // Coerce numeric types
    quantity = Number(quantity) || 0;
    unitPrice = Number(unitPrice) || 0;
    const transportIncluded = (transport === 'on' || transport === true || transport === 'true');

    // Server-side total calculation (authoritative)
    let totalPrice = quantity * unitPrice;
    if (transportIncluded) totalPrice = totalPrice * 1.05;

    // Create new sale document
    const newSale = new Sale({
      customerName,
      productType,
      productName,
      quantity,
      unitPrice,
      totalPrice: Number(totalPrice.toFixed(2)),
      paymentType,
      salesAgent,
      date: date ? new Date(date) : new Date()
    });

    await newSale.save();

    console.log("✅ Sale saved:", newSale);

    req.flash("success_msg", "✅ Sale recorded successfully!");
    res.redirect("/agent");
  } catch (error) {
    console.error("Error recording sale:", error);
    req.flash("error_msg", "❌ Error recording sale. Please try again.");
    res.redirect("/agent");
  }
});

router.get("/salesReport", ensureAuthenticated, ensureManager,  async (req, res) => {
  try {
    // Get filters from query params
    const { startDate, endDate, productType = "All" } = req.query;

    // Build query object
    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (productType !== "All") {
      query.productType = productType;
    }

    // Fetch sales with applied filters
    const sales = await Sale.find(query).sort({ date: -1 }).lean();

    // Compute total revenue
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);

    // Render report
    res.render("sales_report", {
      sales,
      totalRevenue,
      startDate: startDate || "",
      endDate: endDate || "",
      productType,
      success_msg: req.flash("success_msg"),
      error_msg: req.flash("error_msg")
    });
  } catch (err) {
    console.error("Error generating sales report:", err);
    req.flash("error_msg", "Failed to load sales report.");
    res.redirect("/manager");
  }
});

module.exports = router;
