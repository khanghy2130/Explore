var express = require("express"),
	router = express.Router(),
	passport   = require("passport"),
	User = require("../models/user");


// LANDING
router.get("/", (req, res) => {
	res.render("landing");
});


// register form
router.get("/register", (req, res) => {
	res.render("register");
});
// login form
router.get("/login", (req, res) => {
	// after logging in request, set up flash message
	if (req.query.status) {
		if (req.query.status === "succeeded"){
			req.flash("messageColor", "success");
			req.flash("messageText", "You have been logged in.");
			return res.redirect("/posts");
		} else if (req.query.status === "failed"){
			req.flash("messageColor", "danger");
			req.flash("messageText", "Failed to log in, please retry.");
			return res.redirect("/login");
		}
	}
	res.render("login");
});

// handle signing up
router.post("/register", (req, res) => {
	var newUser = new User({username: req.body.username});
	User.register(newUser, req.body.password, (err, user) => {
		if (err){
			console.log(err);
			req.flash("messageColor", "danger");
			req.flash("messageText", err.message);
			return res.redirect("/register");
		}
		console.log("New user created!");
		req.flash("messageColor", "success");
		req.flash("messageText", "You've been signed up and logged in.");
		
		passport.authenticate("local")(req, res, function() {
			console.log("Logged in!");
			res.redirect("/posts");
		});
	});
});

// handle logging in
router.post("/login", passport.authenticate("local", {
	successRedirect: "/login?status=succeeded",
	failureRedirect: "/login?status=failed",
	successFlash: true,
	failureFlash: true
}), (req, res) => {});

// handle logging out (GET)
router.get("/logout", (req, res) => {
	req.logout();
	req.flash("messageColor", "info");
	req.flash("messageText", "You've been logged out.");
	res.redirect("/posts");
});



module.exports = router;