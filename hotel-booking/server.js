require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./src/routes');
const { notFound, errorHandler } = require('./src/middleware/error');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', routes);
app.use('/api', notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hotel_booking';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB қосылды:', MONGO_URI);
    app.listen(PORT, () => console.log(`Сервер: http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB қосылу қатесі:', err.message);
    process.exit(1);
  });
