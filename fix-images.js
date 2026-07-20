const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log("Connected to MongoDB.");
    const db = mongoose.connection.db;
    const collection = db.collection('products');
    
    const result = await collection.updateMany(
      {},
      { 
        $set: { "images.$[elem]": "https://dummyimage.com/400x400/000/fff.png&text=Mock+Image" }
      },
      {
        arrayFilters: [{ "elem": "https://via.placeholder.com/400?text=Mock+Image" }]
      }
    );
    
    console.log(`Updated ${result.modifiedCount} products.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
