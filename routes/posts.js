/*
	This route file handles both posts and comments
*/

var express = require("express"),
	moment = require("moment"),
	router = express.Router({mergeParams: true}),
	middleware = require("../middleware"),
	
	Post = require("../models/post"),
	Comment    = require("../models/comment");


// INDEX PAGE
router.get("/", (req, res) => {
	Post.find({}, (err, results) => {
		if (err){
			console.log("ERROR!!\n" + err);
		} else {
			res.render("posts/index", {posts: results,});
		}
	});
});

// ADD POST FORM
router.get("/new", middleware.isLoggedIn, (req, res) => {
	res.render("posts/new");
});

// handle creating new posts
router.post("/", middleware.isLoggedIn, (req, res) => {
	// req.body fits the schema so pass itself in. With added author object below
	req.body.author = {
		id: req.user._id,
		username: req.user.username
	};
	Post.create(req.body, (err, createdPost) => {
		if (err){
			console.log("ERROR!!\n" + err);
			req.flash("messageColor", "danger");
			req.flash("messageText", "Failed to create post.");
		} else {
			console.log("ADDED CAPGROUND '" + createdPost.name + "'");
			console.log(createdPost);
			
			req.flash("messageColor", "success");
			req.flash("messageText", "Post has been created.");
		}
	});
	res.redirect("/posts");
});


// SHOW PAGE
router.get("/:id", (req, res) => {
	// find the post with ID
	Post.findById(req.params.id).populate("comments").exec((err, foundPost) => {
		if (err || !foundPost){
			console.log("ERROR!!\n" + err);
			res.redirect("/doesntexist");
		} else {
			Post.find().distinct("_id", (err, ids) => {
				if (err) console.log(err);
				else {
					var pickedIds = [foundPost._id];
					// if has 3 other posts 
					if (ids.length <= 4) {
						pickedIds = ids;
					}
					// if has more than 3 others => pick 3 random (not repeat)
					else {
						for (let i=0; i < 3; i++){
							var newId = foundPost._id;
							
							// make sure no repeat
							do {
								newId = ids[Math.floor(Math.random() * ids.length)];
							}
							while (pickedIds.some((id) => {
								return newId.toString() === id.toString();
							}));
							
							pickedIds.push(newId);
						}
					}
					
					// take out current post
					pickedIds.shift();
					
					// fetch the post objects for suggestedPosts array
					Post.find({
						'_id': { $in: pickedIds}
					}, function(err, postObjects){
						if (err) console.log(err);
						else {
							return res.render("posts/show", {
								post: foundPost, 
								suggestedPosts: postObjects,  
								moment: moment
							});
						}
					});
					
				}
			});
			
		}
	});
});

// edit form (owner only)
router.get("/:id/edit", middleware.checkPostOwnership, (req, res) => {
	Post.findById(req.params.id, (err, foundPost) => {
		if (err) {
			console.log(err);
			res.redirect("/posts");
		} else {
			res.render("posts/edit", {post: foundPost});
		}
	});
});

// handle edit request (update) (owner only)
router.put("/:id", middleware.checkPostOwnership, (req, res) => {
	// post object in the request is req.body.post
	Post.findByIdAndUpdate(req.params.id, req.body.post, (err, foundPost) => {
		if (err){
			req.flash("messageColor", "danger");
			req.flash("messageText", "Failed to update post.");
			res.redirect("/posts");
		} else {
			req.flash("messageColor", "success");
			req.flash("messageText", "Post has been updated.");
			res.redirect("/posts/" + req.params.id);
		}
	});
});

// handle delete post request (owner only)
router.delete("/:id", middleware.checkPostOwnership, (req, res) => {
	Post.findById(req.params.id, (err, foundPost) => {
		if (err){
			req.flash("messageColor", "danger");
			req.flash("messageText", "Failed to remove post.");
			res.redirect("/posts");
		} else {
			// this also removes all associated comments thanks for the hook in its model
			foundPost.remove();
			
			req.flash("messageColor", "success");
			req.flash("messageText", "Post has been removed.");
			res.redirect("/posts");
		}
	});
});


// ============= COMMENTS =================

// handles creating new comment
router.post("/:id/comments", middleware.isLoggedIn, (req, res) => {
	Post.findById(req.params.id, (err, foundPost) => {
		Comment.create({
			author: {
				id: req.user._id,
				username: req.user.username
			},
			postID: foundPost._id,
			text: req.body.text,
			createdDate: moment().format()
		}, (err, createdComment) => {
			if (err){
				req.flash("messageColor", "danger");
				req.flash("messageText", "Failed to create comment.");
				console.log("ERROR!!\n" + err);
			} else {
				console.log("Added a comment on " + foundPost.name);
				console.log(createdComment);
				// saving for post object
				foundPost.comments.push(createdComment);
				foundPost.save();
				
				req.flash("messageColor", "info");
				req.flash("messageText", "Comment has been created.");
			}
			res.redirect("/posts/" + req.params.id); // redirect here whether error or not
		});
	});
});

// handles deleting a comment
router.delete("/:id/comments/:comment_id", middleware.checkCommentOwnership, (req, res) => {
	Comment.findById(req.params.comment_id, (err, foundComment) => {
		
		if (err){
			req.flash("messageColor", "danger");
			req.flash("messageText", "Failed to remove comment.");
			return res.redirect("back");
		} else {
			// remove its id in its post
			Post.findByIdAndUpdate(
				foundComment.postID,
				{ $pull: { comments : foundComment._id } },
				(err, obj) => {
					if (err){
						req.flash("messageColor", "danger");
						req.flash("messageText", "Failed to remove comment.");
						return res.redirect("back");
					}
				}
			);
			
			foundComment.remove();
			req.flash("messageColor", "info");
			req.flash("messageText", "Comment has been removed.");
			res.redirect("/posts/" + req.params.id);
		}
		
		
	});
});


module.exports = router;