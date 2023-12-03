import express from 'express';
import dotenv from 'dotenv';
import expressFileUpload from 'express-fileupload';
dotenv.config();
import cors from 'cors';

const app = express();

// Middlewares
app.use(express.json());
app.use(expressFileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin:
      'https://mailer-iw7k.onrender.com/api/payment, http://localhost:3000/api/payment',
    optionsSuccessStatus: 200,
  })
);

// Routes
import paymentRoute from './routes/payment.route';
app.use('/api', paymentRoute);
app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
