// Ensure user is authenticated
exports.ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect("/login");
};

// Ensure user is a manager
exports.ensureManager = (req, res, next) => {
  if (req.session.user && req.session.user.role === "Manager") {
    return next();
  }
  res.redirect("/landing");
};

// Ensure user is a sales agent
exports.ensureSalesAgent = (req, res, next) => {
  if (req.session.user && req.session.user.role === "Sales Agent") {
    return next();
  }
  res.redirect("/agent");
};
