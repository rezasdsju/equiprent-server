import express from 'express';
import 'dotenv/config';
import cors from 'cors'
const app = express();
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});


import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoConnection = await connectToMongoDB()
const database = mongoConnection.db('equiprent')
const equipments = database.collection('equipments')

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.get('/all-equipments', async (req, res) => {
  // console.log('query: ', req.query)
  const { category, rentalType, availability, search, minPrice, maxPrice, sort = 'recent' } = req.query
  const query = {
    approvalStatus: 'approved'
  }
  if (category && category !== 'all') {
    query.category = category
  }
  if (rentalType && rentalType !== 'all') {
    query.rentalType = rentalType
  }
  if (minPrice || maxPrice) {
    query.rentalPrice = {}
    if (minPrice) {
      query.rentalPrice.$gte = Number(minPrice)
    }
    if (maxPrice) {
      query.rentalPrice.$lte = Number(maxPrice)
    }
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } }
    ]
  }
  if (availability && availability !== 'any') {
    query.availability = availability
  }
  const sortOption = {}
  if (sort === 'price-asc') {
    sortOption.rentalPrice = 1
  } else if (sort === 'price-desc') {
    sortOption.rentalPrice = -1
  } else if (sort === 'recent') {
    sortOption.createdAt = -1
  }

  const result = await equipments.find(query).sort(sortOption).toArray()
  res.send(result)
})

export default app;