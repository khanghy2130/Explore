var Campground = require("../models/campground"),
	Comment    = require("../models/comment");

module.exports = {
	
	// check if logged in middleware
	isLoggedIn : function(req, res, next) {
		if (req.isAuthenticated()){
			return next();
		}
		
		// not logged in?
		req.flash("messageColor", "warning");
		req.flash("messageText", "Please log in to proceed.");
		res.redirect("/login");
	},
	
	// check if is creator of this campground
	checkCampgroundOwnership : function (req, res, next){
		if (req.isAuthenticated()){
			// find the campground that comes with the req
			Campground.findById(req.params.id, (err, foundCampground) => {
				// check error and if the found one is null
				if (err || !foundCampground) {
					req.flash("messageColor", "danger");
					req.flash("messageText", "Campground not found");
					return res.redirect("/campgrounds");
				} 
				// match owner id?
				else if (!foundCampground.author.id.equals(req.user._id)){
					req.flash("messageColor", "warning");
					req.flash("messageText", "You need permission to proceed.");
					return res.redirect("/campgrounds");
				}
				
				// no error?
				next();
			});
		} else {
			req.flash("messageColor", "warning");
			req.flash("messageText", "Please log in to proceed.");
			res.redirect("/login");
		}
	},

	// check if is creator of this comment
	checkCommentOwnership : function (req, res, next){
		if (req.isAuthenticated()){
			// find the comment that comes with the req
			Comment.findById(req.params.comment_id, (err, foundComment) => {
				// check error then not matching id
				if (err  || !foundComment) {
					req.flash("messageColor", "danger");
					req.flash("messageText", err.message);
					res.redirect("back");
				} 
				else if (!foundComment.author.id.equals(req.user._id)){
					req.flash("messageColor", "warning");
					req.flash("messageText", "You need permission to proceed.");
					res.redirect("back");
				}
				else {
					next();
				}
			});
		} else {
			req.flash("messageColor", "warning");
			req.flash("messageText", "Please log in to proceed.");
			res.redirect("/login");
		}
	},

};


