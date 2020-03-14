//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(bodyParser.json());
//app.use(express.json());

app.use(session({                          // Configures session which is an instance to express-session
  secret: "This is Our little secret",     // make this a environment variable i.e. dotenv
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());            // Configures passport which is an instance to passport. initialize method is a strategy (auth mech) for passport
app.use(passport.session());               // get passport and modify its session to above e.g {secret: "",  ....}

//mongoose connection below the passport configuration
mongoose.set('useFindAndModify', false);
mongoose.connect('mongodb://localhost/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});
// mongoose.connect("mongodb+srv://admin-hammed:Testing123@cluster0-a0tew.mongodb.net/todolistDB" , {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true  }); // connect to mongodb server
const itemsSchema = new mongoose.Schema({title: String, list: String });
const Item = mongoose.model("Item", itemsSchema);        //might need it                                                                 // follow the prototype. Note: Item is the model so whenever we want to
// const item1 = new Item({ list: "Welcome to your todolist" });
// const item2 = new Item({ list: "Hit the + button to add a new Item" });
// const item3 = new Item({ list: "[]<-- Hit this button to delete an item"    });
// const defaultItems = [item1, item2, item3];

const userSchema = new mongoose.Schema( {
  // username: String,   // no need as the passport register() method can be created via username in-built variable
  password: String,
  title: String,                 // change name of User schema to title everywhere
  todos: [itemsSchema]                                                                                                    //items: [itemsSchema]
});

userSchema.plugin(passportLocalMongoose);       // configures instance passportLocalMongoose becomes one of the userSchema inbult mongoose functions

const User = new mongoose.model("User", userSchema);                                                           // for our dynamic route parameter

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var email;  //global variable for email
var userTitle; //global variable for new tittle in todoPage
const date = new Date();
const month = date.getMonth() + 1;
const day = date.getDate();
const year = date.getFullYear();
var firstDay = month + "/" + day + "/" + year;     // not const but var  to make it changeable for a new date update


app.get("/workInProgress", function(req , res){
  res.send("<h1>Work In Progress for the users' title list feature. Thank you for your patience!</h1>");
});

app.get("/", function(req, res) {
  res.render("about");
});

app.get("/signup", function(req , res){
  res.render("signup");
});

app.post("/signup" , function(req , res){
  User.register({username: req.body.username }, req.body.password, function(err , user){
    if(err){
      console.log("Found err: " + err);
    }else{
      // console.log(req.isAuthenticated());   // testing
      // passport.authenticate('local');  // not doing anything
      res.redirect("/signin");     // you want to redirect to success or failure login page or just redirect to user's password entry.
    }
   });

});

app.get("/signin", function(req , res){
  res.render("signin");
});

app.post("/signin" , passport.authenticate('local' , {failureRedirect: "/signin"}),  function(req , res){      // read a bit more about:  passport.authenticate("local")
  email = req.body.username;   // stored in the global name called email                                                   //testing

//we can check whether todos array of user schema's length == 1 (i.e.) .todos.length ===1 if so navigate to where the user can enter their own title page
  if(req.isAuthenticated()){
    res.redirect("/todoPage");       //change to "/titles" based on the note *****
  }else{
    res.redirect("/signin");
  }
});


app.get("/todoPage", function(req, res) {
  if(req.isAuthenticated()){
    User.findOne({username: email}, function(err, user) {

        res.render("list", {   //listTitle shouldn't be rendered immediately until a corresponding title button is pressed
          listTitle: firstDay,            //replace it with a global variable called userTitle OR firstDay can be updated
          newListItems: user.todos
        });

    });
  }else{
    res.redirect("/");
  }

});


app.post("/todoTitle", function(req, res) {
  userNewTitle = req.body.newTitle;
 //firstDay = req.body.newList;
  User.findOne({ username: email  }, function(err, user) {
        //firstDay = req.body.newTitle;  //no need for a new date update for now until titles page is activated
        res.redirect("/todoPage");

    //consider below to avoid immediate title rendering
    //*** now you check for username if found then check for title if found use the n = new Item({ }). And if not found
  });

});

//titles get request
app.get("/titles" , function(req , res){
  if(req.isAuthenticated() ){
    User.findOne({username: email }, function(err , user){
      res.render("titles" , {listTitle: user.todos});
    });

  }else{
    // document.getElementById("   ").innerHTML = "You nentered wrong Username or Password!";
    // document.getElementById("  ").css({color: "red"});
    res.redirect("/signin");
  }
});

//aim now is to check if it's a new title provided that a new title page is created
app.post("/todoPage", function(req, res) {
  const listTitle = req.body.list;      // list from list.ejs form post html form
  const newList = req.body.newList;     // newList from list.ejs delele html form
//make sure you check if the user is authenticated by using req.isAuthenticated()
    User.findOne({ username: email  }, function(err, user) {
      if(err){
        console.log(err);
      }else{
            item = new Item({title: listTitle, list: newList});    // if user title changes   (**)
            user.todos.push(item);
            user.save();
      }
      res.redirect("/todoPage");          //+ listTitle);
    });

});


app.post("/delete", function(req, res) {
  const checkedItemId = req.body.deleteItem;
  const listTitle = req.body.listTitle;
  const todo = req.body.todo;
  const d = "3/11/2020";


User.findOneAndUpdate({ username: email  }, {  $pull: { todos: { _id: checkedItemId }  }  },  function(err, found) {
  if (!err) {
    //console.log(found);
    res.redirect("/todoPage");                         //+ listTitle);  // this for params route
  }
});

 });

 app.get('/signout', function(req, res){
   if(req.isAuthenticated()){
     req.logout();
     res.redirect('/');
   }

 });




let port = process.env.PORT; // to access it both locally and remotely with if condition below
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port 3000 Sucessfully");
});
