require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const router = require('./router/index');
const errorsMiddleware = require('./middlewares/error-middleware');

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use('/', router);
app.use(errorsMiddleware);

const start = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    app.listen(PORT, () => console.log(`Server started on ${PORT}`));
  } catch {
    console.log(e);
  }
};

start();
