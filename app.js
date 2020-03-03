//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
mongoose.connect('mongodb://localhost/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true});
// mongoose.connect("mongodb+srv://admin-hammed:Testing123@cluster0-a0tew.mongodb.net/todolistDB" , {useNewUrlParser: true, useUnifiedTopology: true  }); // connect to mongodb server
mongoose.set('useFindAndModify', false);
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const itemsSchema = new mongoose.Schema({     //Scheam --> data prototype
  todo: String                            //name: String
});

const Item = mongoose.model("Item", itemsSchema); // follow the prototype. Note: Item is the model so whenever we want to
const item1 = new Item({ // make any changes to the database, we have to make reference to ex List.change()
  todo: "Welcome to your todolist"                // name: "Welcome to your todolist"
});

const item2 = new Item({
  todo: "Hit the + button to add a new Item"         //name: "Hit the + button to add a new Item"
});

const item3 = new Item({
todo: "<-- Hit this button to delete an item"          //name: "<-- Hit this button to delete an item"
});
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema( {   // schema of our object version for our dynamic route parameter
  name: String,
  todos: [itemsSchema]                                           //items: [itemsSchema]
});
const List = mongoose.model("List", listSchema); // for our dynamic route parameter



app.get("/todoPage", function(req, res) {

  Item.find({}, function(err, foundItem) {

    if (foundItem.length === 0) { // checking if the document is empty

      Item.insertMany(defaultItems, function(err) { // The default item in this case can be the user items
        if (err) {
          console.log(err);
        } else {

          console.log("Successfully saved the default items");
        }
      });
      res.redirect("/todoPage");
    } else {
      console.log(foundItem);   // testing
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItem
      }); //foundItem is an Array type due to defaultItems being an Array
    }

  });

});

app.post("/todoPage", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    todo: itemName                        //name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/todoPage");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.todos.push(item);          // change from items to todos
      foundList.save();
      res.redirect("/todoPage");   // + listName);
    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.deleteItem;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove({
      _id: checkedItemId
    }, function(err) {
      if (!err) {
        console.log("Sucessfully deleted checked item");
      }
    });
    res.redirect("/todoPage");
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, found) {
      if (!err) {
        res.redirect("/todoPage");         //+ listName);  // this for params route
      }
    });
  }

  //res.redirect("/");
});

app.get("/:pageName", function(req, res) {
  const pageEntry = _.capitalize(req.params.pageName); // using lodash to capitalize the the first letter of pageEntry
  List.findOne({
    name: pageEntry
  }, function(err, foundList) { // it finds one data in particular that meet the condition
    // of the first argument and stores in callback 2nd param
    if (!err) {
      if (!foundList) { // foundList which is 2nd argument compare user's pageName entry with the one in the database
        //console.log(foundList.name);
        const list = new List({
          name: pageEntry, //req.params.pageName,
          todos: defaultItems
        });
        //  List.deleteMany({} , function(err , foundList){   });
        list.save();
        res.redirect("/" + pageEntry);
      } else {

        //console.log("Does exist");
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.todos
        });
      }
    }
  });

});


app.get("/", function(req, res) {
  res.render("about");
});

app.get("/signin", function(req , res){
  res.render("signin");
});
app.get("/signup", function(req , res){
  res.render("signup");
});




let port = process.env.PORT; // to access it both locally and remotely with if condition below
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port 3000 Sucessfully");
});
