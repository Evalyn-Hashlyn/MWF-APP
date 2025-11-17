const express = require('express');
const router = express.Router();
const multer = require('multer');
const {ensureAuthenticated, ensureManager, ensureSalesAgent} = require('../customMiddleware/auth');

const Furniture = require('../models/Furniturestock');
const Wood = require('../models/Woodstock');

// Image upload configs
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/images/uploads')
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname)
    }
})
var upload = multer({ storage: storage })

router.get("/registerFurniture", ensureAuthenticated, ensureManager, (req, res) => {
  res.render("register_furniture");
});

router.post("/registerFurniture", ensureAuthenticated, ensureManager, upload.single('image'), async (req, res) =>{
  try {
    const furniture = new Furniture(req.body)
    furniture.image = req.file.path
    console.log(furniture)
    await furniture.save()
    req.flash("success_msg", "✅ Furniture stock registered successfully!");
    res.redirect("/manager")
  } catch (error) {
    console.error(error)
    req.flash("error_msg", "❌ Error registering furniture. Please try again.");
    res.redirect("/registerFurniture")
  }
});

router.get("/registerWood", (req, res) => {
  res.render("register_wood");
});

router.post("/registerWood", ensureAuthenticated, ensureManager, upload.single('image'), async (req, res) => {
  try {
    const wood = new Wood(req.body)
    wood.image = req.file.path
    console.log(wood)
    await wood.save()
    req.flash("success_msg", "✅ Wood stock registered successfully!");
    res.redirect("/manager")
  } catch (error) {
    console.error(error)
    req.flash("error_msg", "❌ Error registering wood. Please try again.");
    res.redirect("/registerWood")
  }
});

router.get("/registeredFurniture",  ensureAuthenticated, async(req, res)=>{
  try {
    const furnitureStock = await Furniture.find();
    res.render("furniture", {furnitureStock,
       currentUser: req.user, // ✅ pass user info
    })
  } catch (error) {
    console.error("Error getting furniture from the DB!")
    res.redirect("/")
  }
});

router.get("/registeredWood",  ensureAuthenticated, async(req, res)=>{
  try {
    const woodStock = await Wood.find();
    res.render("wood", {woodStock,
       currentUser: req.user, // ✅ pass user info
    } )
  } catch (error) {
    console.error("Error getting wood stock from the DB!")
    res.redirect("/registeredWood")
  }
});

router.get('/StockReport', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const furniture = await Furniture.find();
    const wood = await Wood.find();

    const stockItems = [
      ...furniture.map(f => ({
        name: f.furnitureName,
        type: 'Furniture',
        quantity: f.quantity,
        price: f.productPrice,
        threshold: 5 // low stock threshold
      })),
      ...wood.map(w => ({
        name: w.name,
        type: 'Wood',
        quantity: w.quantity,
        price: w.productPrice,
        threshold: 10
      }))
    ];

    // Metrics
    const totalProducts = stockItems.length;
    const totalValue = stockItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const lowStockCount = stockItems.filter(i => i.quantity < i.threshold).length;

    // Chart data
    const stockDistribution = {
      labels: ['Furniture', 'Wood'],
      values: [furniture.length, wood.length]
    };

    const lowStockSummary = {
      labels: stockItems.filter(i => i.quantity < i.threshold).map(i => i.name),
      values: stockItems.filter(i => i.quantity < i.threshold).map(i => i.quantity)
    };

    res.render('stock_report', {
      stockItems,
      totalProducts,
      totalValue,
      lowStockCount,
      stockDistribution,
      lowStockSummary
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error generating stock report');
    res.redirect('/manager');
  }
});


module.exports= router;