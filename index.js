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


import { MongoClient, ObjectId } from 'mongodb';

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
const sessions = database.collection('session')
const users = database.collection('user')









const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      res.status(401).send({ message: 'Unauthorized access' })
      return
    }
    const token = authHeader.split(' ')[1]
    if (!token) {
      res.status(401).send({ message: 'Unauthorized access' })
      return
    }
    const query = { token }
    const session = await sessions.findOne(query)
    if (!session) {
      res.status(401).send({ message: 'Unauthorized access' })
      return
    }
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      res.status(401).send({ message: 'Session expired' })
      return
    }
    const userId = session.userId
    const userQuery = { _id: new ObjectId(userId) }
    const user = await users.findOne(userQuery)
    if (!user) {
      res.status(401).send({ message: 'Unauthorized access' })
      return
    }
    req.user = user
    next()
  } catch (error) {
    return res.status(401).send({ message: 'Unauthorized access' })
  }
}

const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    res.status(403).send({ message: 'Forbidden access' })
    return
  }
  next()
}


const verifyOwner = (req, res, next) => {
  if (req.user?.role !== 'owner') {
    res.status(403).send({ message: 'Forbidden access' })
    return
  }
  next()
}
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
app.get('/all-equipments/:id', verifyToken, async (req, res) => {
  // console.log('headers on the server: ',req.headers )
  const id = req.params.id
  const query = { _id: new ObjectId(id) }
  const result = await equipments.findOne(query)
  res.send(result)
})



app.post('/add-equipment', verifyToken, verifyOwner, async (req, res) => {
  const equipmentToInsert = req.body
  const result = await equipments.insertOne(equipmentToInsert)
  res.send(result)
})




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;