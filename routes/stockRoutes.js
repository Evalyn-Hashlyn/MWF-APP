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

// ---------- EDIT / UPDATE Furniture ----------
router.get("/registeredFurniture/:id/edit", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const furniture = await Furniture.findById(req.params.id).lean();
    if (!furniture) {
      req.flash("error_msg", "Furniture not found");
      return res.redirect("/registeredFurniture");
    }
    res.render("update_furniture", { furniture, currentUser: req.user });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading edit form");
    res.redirect("/registeredFurniture");
  }
});

router.post("/registeredFurniture/:id/update", ensureAuthenticated, ensureManager, upload.single('image'), async (req, res) => {
  try {
    const updateData = {
      furnitureName: req.body.furnitureName,
      productPrice: Number(req.body.productPrice) || 0,
      quantity: Number(req.body.quantity) || 0,
      quality: req.body.quality,
      date: req.body.date ? new Date(req.body.date) : undefined,
      // add other fields as needed
    };

    // If an image was uploaded, set path
    if (req.file && req.file.path) updateData.image = req.file.path;

    await Furniture.findByIdAndUpdate(req.params.id, { $set: updateData });
    req.flash("success_msg", "✅ Furniture updated successfully");
    res.redirect("/registeredFurniture");
  } catch (err) {
    console.error("Error updating furniture:", err);
    req.flash("error_msg", "❌ Failed to update furniture");
    res.redirect("/registeredFurniture");
  }
});

// ---------- DELETE Furniture ----------
router.post("/registeredFurniture/:id/delete", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    await Furniture.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "✅ Furniture deleted");
    res.redirect("/registeredFurniture");
  } catch (err) {
    console.error("Error deleting furniture:", err);
    req.flash("error_msg", "❌ Failed to delete furniture");
    res.redirect("/registeredFurniture");
  }
});

// ---------- EDIT / UPDATE Wood ----------
router.get("/registeredWood/:id/edit", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const wood = await Wood.findById(req.params.id).lean();
    if (!wood) {
      req.flash("error_msg", "Wood not found");
      return res.redirect("/registeredWood");
    }
    res.render("update_wood", { wood, currentUser: req.user });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading edit form");
    res.redirect("/registeredWood");
  }
});

router.post("/registeredWood/:id/update", ensureAuthenticated, ensureManager, upload.single('image'), async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      type: req.body.type,
      supplier: req.body.supplier,
      productPrice: Number(req.body.productPrice) || 0,
      quantity: Number(req.body.quantity) || 0,
      quality: req.body.quality,
      color: req.body.color,
      measurements: req.body.measurements,
      date: req.body.date ? new Date(req.body.date) : undefined,
    };

    if (req.file && req.file.path) updateData.image = req.file.path;

    await Wood.findByIdAndUpdate(req.params.id, { $set: updateData });
    req.flash("success_msg", "✅ Wood updated successfully");
    res.redirect("/registeredWood");
  } catch (err) {
    console.error("Error updating wood:", err);
    req.flash("error_msg", "❌ Failed to update wood");
    res.redirect("/registeredWood");
  }
});

// ---------- DELETE Wood ----------
router.post("/registeredWood/:id/delete", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    await Wood.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "✅ Wood deleted");
    res.redirect("/registeredWood");
  } catch (err) {
    console.error("Error deleting wood:", err);
    req.flash("error_msg", "❌ Failed to delete wood");
    res.redirect("/registeredWood");
  }
});

module.exports= router;