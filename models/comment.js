const mongoose = require("mongoose");


var commentSchema = new mongoose.Schema({
	text: String,
	createdDate: String,
	campgroundID: mongoose.Schema.Types.ObjectId,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	}
});

module.exports = mongoose.model("Comment", commentSchema);