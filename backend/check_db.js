require('dotenv').config();
const mongoose = require('mongoose');

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB:', mongoose.connection.name);
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections found:');
    
    for (const collection of collections) {
      console.log(`\n--- Collection: ${collection.name} ---`);
      const coll = mongoose.connection.db.collection(collection.name);
      
      const count = await coll.countDocuments();
      console.log(`Total documents: ${count}`);
      
      // Fetch up to 3 sample documents
      const sampleDocs = await coll.find().limit(3).toArray();
      console.log('Sample documents (up to 3):');
      console.log(JSON.stringify(sampleDocs, null, 2));
    }
    
    console.log('\nFinished checking DB.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDb();
