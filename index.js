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

app.get('/all-equipments', async(req,res)=>{
  const result = await equipments.find({}).toArray()
  res.send(result)
})

export default app;