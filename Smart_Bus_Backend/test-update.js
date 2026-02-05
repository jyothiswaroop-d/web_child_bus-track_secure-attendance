// test-update.js
import mongoose from 'mongoose';

// Replace with your MongoDB connection string
const MONGODB_URI = 'mongodb+srv://Bus_User:Epics_18@1stcluster.pbupgv4.mongodb.net/smartbus?retryWrites=true&w=majority';

// Define Bus schema (same as your model)
const busSchema = new mongoose.Schema({
  busId: { type: String, required: true, unique: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
}, {
  timestamps: true
});

const Bus = mongoose.model('Bus', busSchema);

async function updateBusLocation() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update bus 55 with current timestamp
    const result = await Bus.findOneAndUpdate(
      { busId: '55' },
      { 
        latitude: 16.428974,
        longitude: 80.5775,
        updatedAt: new Date() // This sets current time
      },
      { new: true, upsert: true }
    );

    console.log('\n🚌 Bus location updated successfully!');
    console.log('Bus ID:', result.busId);
    console.log('Latitude:', result.latitude);
    console.log('Longitude:', result.longitude);
    console.log('Updated At (UTC):', result.updatedAt);
    console.log('Updated At (IST):', new Date(result.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n MongoDB connection closed');
    process.exit(0);
  }
}

updateBusLocation();