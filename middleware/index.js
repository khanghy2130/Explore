var Post = require("../models/post"),
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
	
	// check if is creator of this post
	checkPostOwnership : function (req, res, next){
		if (req.isAuthenticated()){
			// find the post that comes with the req
			Post.findById(req.params.id, (err, foundPost) => {
				// check error and if the found one is null
				if (err || !foundPost) {
					req.flash("messageColor", "danger");
					req.flash("messageText", "Post not found");
					return res.redirect("/posts");
				} 
				// match owner id?
				else if (!foundPost.author.id.equals(req.user._id)){
					req.flash("messageColor", "warning");
					req.flash("messageText", "You need permission to proceed.");
					return res.redirect("/posts");
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


