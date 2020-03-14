module.exports = todoPage;
const mongoose = require("mongoose");
const itemsSchema = new mongoose.Schema({
todo: String
});
const Item = mongoose.model("Item", itemsSchema);
function todoPage(){

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
      //console.log(foundItem);   // testing
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItem
      }); //foundItem is an Array type due to defaultItems being an Array
    }

  });


}
