const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const campaignScheduler = require('./services/campaignScheduler');

// Import routes
const userRoutes = require('./routes/userRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const contactGroupRoutes = require('./routes/contactGroupRoutes');

const app = express();

app.use(
  cors({
    orig01n: (origin, callback) => callback(null, true),
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/contact-groups', contactGroupRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is running successfully',
    timestamp: new Date().toISOString()
  });
});

mongoose
  .connect(process.env.MONGODBCONNECT)
  .then(() => {
    console.log("MongoDB Connected");
    // Start campaign scheduler after MongoDB connection
    campaignScheduler.start();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start server
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

