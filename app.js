var express    = require("express"),
	app        = express(),
	bodyParser = require("body-parser"),
	mongoose   = require("mongoose"),
	passport   = require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	flash = require("connect-flash"),
	
	Campground = require("./models/campground"),
	Comment    = require("./models/comment"),
	User       = require("./models/user");

var campgroundsRoute = require("./routes/campgrounds"),
	indexRoute = require("./routes/index");

// dev
// mongoose.connect("mongodb://localhost:27017/campgrounds_app", {useNewUrlParser: true});
// production https://www.youtube.com/watch?v=iJtOoeM_fS8&feature=youtu.be&t=368
mongoose.connect("mongodb+srv://dbUser1:0909988855@cluster0-tb0ia.mongodb.net/test?retryWrites=true&w=majority", {useNewUrlParser: true}).then(() => {
	console.log("Connected to DB");
}).catch(err => {
	console.log("Failed to connect to DB: " + err.message);
});

app.set("view engine", "ejs"); // default view file extension
app.use(bodyParser.urlencoded({extended: true})); // parse form submition
app.use(express.static(__dirname + '/public')); // public folder
app.use(methodOverride("_method")); // override put and delete request
app.use(flash());

// PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "Code is 002526",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// pass user to all routes (our own middleware)
app.use((req, res, next) => {
	res.locals.user = req.user;
	res.locals.flashMessage = {
		color : req.flash("messageColor"), // must complies with bootstrap color naming
		text : req.flash("messageText"),
	};
	next();
});

// use routes
app.use("/campgrounds", campgroundsRoute);
app.use(indexRoute);




// other routes
app.get("/*", (req, res) => {
	req.flash("messageColor", "danger");
	req.flash("messageText", "The requested page doesn't exist.");
	res.redirect("/campgrounds");
});

app.listen(3000, () => {
	console.log("Yelpcamp server started.");
});
