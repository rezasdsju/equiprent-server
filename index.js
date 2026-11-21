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



app.get('/admin/all-equipment', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await equipments.find({}).sort({ createdAt: -1 }).toArray()
    res.send(result)
  } catch (error) {
    res.status(500).send({ message: 'Failed to load equipments' })
  }
})

app.patch('/admin/all-equipment/:id/approval', verifyToken, verifyAdmin, async (req, res) => {
  const id = req.params.id
  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'Invalid Equipment ID' })
  }
  const query = {
    _id: new ObjectId(id)
  }
  const allowedStatuses = ['pending', 'approved', 'rejected']
  const { approvalStatus: newApprovalStatus } = req.body
  if (!allowedStatuses.includes(newApprovalStatus)) {
    return res.status(400).send({ message: 'Invalid approval status' })
  }

  try {
    const result = await equipments.updateOne(query, {
      $set: {
        approvalStatus: newApprovalStatus
      }
    })
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: 'Equipment not found' })
    }
    res.send(result)
  } catch (error) {
    console.error('Update approval status error:', error)
    return res.status(500).send({ message: 'Failed to update approval status' })
  }
})

app.patch('/admin/all-equipment/:id', verifyToken, verifyAdmin, async (req, res) => {
  const id = req.params.id
  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'Invalid Equipment ID' })
  }
  const { name, description, category, location, rentalPrice, rentalType,
    availableQuantity, condition, brand, model, image, rentalTerms } = req.body
  if (
    !name || !description || !category || !location || !rentalType ||
    !condition || !brand || !model || !image || !rentalTerms ||
    !Number.isFinite(rentalPrice) || rentalPrice <= 0 ||
    !Number.isInteger(availableQuantity) || availableQuantity <= 0
  ) {
    return res.status(400).send({ message: 'Missing or invalid fields' })
  }

  const validRentalTypes = ['Daily', 'Weekly', 'Monthly']
  if (!validRentalTypes.includes(rentalType)) {
    return res.status(400).send({ message: 'Invalid rental type' })
  }
  const equipmentToUpdate = {
    name, description, category, location, rentalPrice, rentalType,
    availableQuantity, condition, brand, model, image, rentalTerms,
    updatedAt: new Date(),
  }
  const query = {
    _id: new ObjectId(id),
  }
  try {
    const result = await equipments.updateOne(query, {
      $set: equipmentToUpdate
    })
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: 'Equipment not found or unauthorized' })
    }
    res.send(result)
  } catch (error) {
    console.error('Update error:', error)
    res.status(500).send({ message: 'Failed to update equipment' })
  }
})

app.get('/admin/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await users.find({}).sort({ createdAt: -1 }).toArray()
    res.send(result)
  } catch (error) {
    res.status(500).send({ message: 'Failed to get users' })
  }
})


app.patch('/admin/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { role: newRole } = req.body
  const allowedRoles = ['admin', 'customer', 'owner']
  if (!allowedRoles.includes(newRole)) {
    return res.status(400).send({ message: 'Invalid role' })
  }
  const id = req.params.id
  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'Invalid user ID' })
  }
  const query = {
    _id: new ObjectId(id)
  }
  if (req.user._id.toString() === id) {
    return res.status(400).send({ message: 'You cannot change your own role' })
  }
  try {
    const result = await users.updateOne(query, {
      $set: { role: newRole }
    })
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: 'User not found' })
    }
    res.send(result)
  } catch (error) {
    res.status(500).send({ message: 'Failed to update user role' })
  }
})




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



app.post('/owner/add-equipment', verifyToken, verifyOwner, async (req, res) => {
  const { name, description, category, location, rentalPrice, rentalType, availableQuantity, condition, brand, model, image, rentalTerms } = req.body

  if (
    !Number.isFinite(rentalPrice) ||
    rentalPrice <= 0 ||
    !Number.isInteger(availableQuantity) ||
    availableQuantity <= 0
  ) {
    return res.status(400).send({
      message: 'Invalid rental price or available quantity'
    })
  }
  if (!name || !description || !category || !location || !rentalType || !condition || !brand || !model || !image || !rentalTerms) {
    return res.status(400).send({
      message: 'Please provide all required fields'
    })
  }
  const validRentalTypes = ["Daily", "Weekly", "Monthly"]
  if (!validRentalTypes.includes(rentalType)) {
    return res.status(400).send({
      message: 'Invalid rental type'
    })
  }
  const equipmentToInsert = {
    name,
    description,
    category,
    location,
    rentalPrice,
    rentalType,
    availableQuantity,
    condition,
    brand,
    model,
    image,
    rentalTerms,
    owner: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email
    },
    approvalStatus: 'pending',
    createdAt: new Date()
  }
  try {
    const result = await equipments.insertOne(equipmentToInsert)
    res.status(201).send(result)
  } catch (error) {
    console.error('Add equipment error:', error)
    res.status(500).send({ message: 'Failed to add equipment' })
  }
})


app.get('/owner/my-equipments', verifyToken, verifyOwner, async (req, res) => {
  const query = {
    'owner._id': req.user._id
  }
  const result = await equipments.find(query).toArray()
  res.send(result)
})


app.patch('/owner/my-equipments/:id', verifyToken, verifyOwner, async (req, res) => {
  const id = req.params.id

  const { name, description, category, location, rentalPrice, rentalType,
    availableQuantity, condition, brand, model, image, rentalTerms } = req.body
  if (
    !name || !description || !category || !location || !rentalType ||
    !condition || !brand || !model || !image || !rentalTerms ||
    !Number.isFinite(rentalPrice) || rentalPrice <= 0 ||
    !Number.isInteger(availableQuantity) || availableQuantity <= 0
  ) {
    return res.status(400).send({ message: 'Missing or invalid fields' })
  }

  const validRentalTypes = ['Daily', 'Weekly', 'Monthly']
  if (!validRentalTypes.includes(rentalType)) {
    return res.status(400).send({ message: 'Invalid rental type' })
  }
  const equipmentToUpdate = {
    name, description, category, location, rentalPrice, rentalType,
    availableQuantity, condition, brand, model, image, rentalTerms,
    updatedAt: new Date(),
  }
  try {
    const query = {
      _id: new ObjectId(id),
      'owner._id': req.user._id
    }
    const result = await equipments.updateOne(query, {
      $set: equipmentToUpdate
    })
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: 'Equipment not found or unauthorized' })
    }
    res.send(result)
  } catch (error) {
    console.error('Update error:', error)
    res.status(500).send({ message: 'Failed to update equipment' })
  }
})

app.delete('/owner/my-equipments/:id', verifyToken, verifyOwner, async (req, res) => {
  const id = req.params.id

  try {
    const query = {
      _id: new ObjectId(id),
      'owner._id': req.user._id
    }
    const result = await equipments.deleteOne(query)
    if (result.deletedCount === 0) {
      return res.status(404).send({ message: 'Equipment not found or unauthorized' })

    }
    res.send(result)
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).send({ message: 'Failed to delete equipment' })
  }
})


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;