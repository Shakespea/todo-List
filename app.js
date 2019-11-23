//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose= require("mongoose");
const _ = require("lodash");
//mongoose.connect('mongodb://localhost/todolistDB', {useNewUrlParser: true});
mongoose.connect("mongodb+srv://admin-hammed:Testing123@cluster0-a0tew.mongodb.net/todolistDB" , {useNewUrlParser: true, useUnifiedTopology: true  }); // connect to mongodb server
mongoose.set('useFindAndModify', false);
const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


const itemsSchema = new mongoose.Schema({                // data prototype
  name: String
});

const Item = mongoose.model("Item", itemsSchema);       // follow the prototype. Note: Item is the model so whenever we want to
const item1 = new Item({                                // make any changes to the database, we have to make reference to ex List.change()
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add a new Item"
});

const item3 = new Item({
  name: "<-- Hit this button to delete an item"
});
const defaultItems = [item1 , item2, item3];

const listSchema = {                                   // schema of our object version for our dynamic route parameter
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List" , listSchema);       // for our dynamic route parameter

app.get("/", function(req, res) {          // the favicon.ico that apears in the database name seems to be springing from get request domain

  Item.find({  }, function(err, foundItem){

      if(foundItem.length === 0){                        // checking if the document is empty

      Item.insertMany(defaultItems , function(err){      // The default item in this case can be the user items
        if(err){
        console.log(err);
        }else{

        console.log("Successfully saved the default items");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItem});        //foundItem is an Array type due to defaultItems being an Array
    }

  });

});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
  name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName} , function(err , foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req , res){
  const checkedItemId = req.body.deleteItem;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove({_id: checkedItemId} , function(err){
    if(!err){
    console.log("Sucessfully deleted checked item");
    }
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items:{_id: checkedItemId}}}, function(err , found){
    if(!err){
      res.redirect("/" + listName);
    }
    });
  }


  //res.redirect("/");
});

app.get("/:pageName", function (req, res) {
  const pageEntry = _.capitalize(req.params.pageName);     // using lodash to capitalize the the first letter of pageEntry
  List.findOne({name: pageEntry} , function(err , foundList){   // it finds one data in particular that meet the condition
                                                                          // of the first argument and stores in callback 2nd param
    if(!err){
      if(!foundList){                       // foundList which is 2nd argument compare user's pageName entry with the one in the database
        //console.log(foundList.name);
        const list = new List({
          name: pageEntry,                                     //req.params.pageName,
          items: defaultItems
        });
      //  List.deleteMany({} , function(err , foundList){   });
      list.save();
      res.redirect("/" + pageEntry);
      }else{

        //console.log("Does exist");
        res.render("list" , {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
   });

});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;                // to access it both locally and remotely with if condition below
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port 3000 Sucessfully");
});
