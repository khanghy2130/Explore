/*
	This route file handles both campgrounds and comments
*/

var express = require("express"),
	moment = require("moment"),
	router = express.Router({mergeParams: true}),
	middleware = require("../middleware"),
	
	Campground = require("../models/campground"),
	Comment    = require("../models/comment");


// INDEX PAGE
router.get("/", (req, res) => {
	Campground.find({}, (err, results) => {
		if (err){
			console.log("ERROR!!\n" + err);
		} else {
			res.render("campgrounds/index", {campgrounds: results,});
		}
	});
});

// ADD CAMPGROUND FORM
router.get("/new", middleware.isLoggedIn, (req, res) => {
	res.render("campgrounds/new");
});

// handle creating new campgrounds
router.post("/", middleware.isLoggedIn, (req, res) => {
	// req.body fits the schema so pass itself in. With added author object below
	req.body.author = {
		id: req.user._id,
		username: req.user.username
	};
	Campground.create(req.body, (err, createdCampground) => {
		if (err){
			console.log("ERROR!!\n" + err);
			req.flash("messageColor", "danger");
			req.flash("messageText", "Failed to create campground.");
		} else {
			console.log("ADDED CAPGROUND '" + createdCampground.name + "'");
			console.log(createdCampground);
			
			req.flash("messageColor", "success");
			req.flash("messageText", "Campground has been created.");
		}
	});
	res.redirect("/campgrounds");
});


// SHOW PAGE
router.get("/:id", (req, res) => {
	// find the campground with ID
	Campground.findById(req.params.id).populate("comments").exec((err, foundCampground) => {
		if (err || !foundCampground){
			console.log("ERROR!!\n" + err);
			res.redirect("/doesntexist");
		} else {
			Campground.find().distinct("_id", (err, ids) => {
				if (err) console.log(err);
				else {
					var pickedIds = [foundCampground._id];
					// if has 3 other camps 
					if (ids.length <= 4) {
						pickedIds = ids;
					}
					// if has more than 3 others => pick 3 random (not repeat)
					else {
						for (let i=0; i < 3; i++){
							var newId = foundCampground._id;
							
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
					
					// take out current camp
					pickedIds.shift();
					
					// fetch the camp objects for suggestedCamps array
					Campground.find({
						'_id': { $in: pickedIds}
					}, function(err, campObjects){
						if (err) console.log(err);
						else {
							return res.render("campgrounds/show", {
								camp: foundCampground, 
								suggestedCamps: campObjects,  
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
router.get("/:id/edit", middleware.checkCampgroundOwnership, (req, res) => {
	Campground.findById(req.params.id, (err, foundCampground) => {
		if (err) {
			console.log(err);
			res.redirect("/campgrounds");
		} else {
			res.render("campgrounds/edit", {camp: foundCampground});
		}
	});
});

// handle edit request (update) (owner only)
router.put("/:id", middleware.checkCampgroundOwnership, (req, res) => {
	// campground object in the request is req.body.campground
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, foundCampground) => {
		if (err){
			req.flash("messageColor", "danger");
			req.flash("messageText", "Failed to update campground.");
			res.redirect("/campgrounds");
		} else {
			req.flash("messageColor", "success");
			req.flash("messageText", "Campground has been updated.");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

// handle delete campground request (owner only)
router.delete("/:id", middleware.checkCampgroundOwnership, (req, res) => {
	Campground.findById(req.params.id, (err, foundCampground) => {
		if (err){
			req.flash("messageColor", "danger");
			req.flash("messageText", "Failed to remove campground.");
			res.redirect("/campgrounds");
		} else {
			// this also removes all associated comments thanks for the hook in its model
			foundCampground.remove();
			
			req.flash("messageColor", "success");
			req.flash("messageText", "Campground has been removed.");
			res.redirect("/campgrounds");
		}
	});
});


// ============= COMMENTS =================

// handles creating new comment
router.post("/:id/comments", middleware.isLoggedIn, (req, res) => {
	Campground.findById(req.params.id, (err, foundCampground) => {
		Comment.create({
			author: {
				id: req.user._id,
				username: req.user.username
			},
			campgroundID: foundCampground._id,
			text: req.body.text,
			createdDate: moment().format()
		}, (err, createdComment) => {
			if (err){
				req.flash("messageColor", "danger");
				req.flash("messageText", "Failed to create comment.");
				console.log("ERROR!!\n" + err);
			} else {
				console.log("Added a comment on " + foundCampground.name);
				console.log(createdComment);
				// saving for campground object
				foundCampground.comments.push(createdComment);
				foundCampground.save();
				
				req.flash("messageColor", "info");
				req.flash("messageText", "Comment has been created.");
			}
			res.redirect("/campgrounds/" + req.params.id); // redirect here whether error or not
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
			// remove its id in its campground
			Campground.findByIdAndUpdate(
				foundComment.campgroundID,
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
			res.redirect("/campgrounds/" + req.params.id);
		}
		
		
	});
});


module.exports = router;