import express from 'express';
import 'dotenv/config';
import cors from 'cors'
import Stripe from 'stripe'
const app = express();
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 5000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
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
const bookings = database.collection('bookings')
const payments = database.collection('payments')
const favourites = database.collection('favourites')








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

const verifyCustomer = (req, res, next) => {
  if (req.user?.role !== 'customer') {
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

app.delete('/admin/all-equipment/:id', verifyToken, verifyAdmin, async (req, res) => {
  const id = req.params.id
  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'Invalid Equipment ID' })
  }
  const query = {
    _id: new ObjectId(id)
  }
  try {
    const result = await equipments.deleteOne(query)
    if (result.deletedCount === 0) {
      return res.status(404).send({ message: 'Equipment not found' })
    }

    return res.send(result)

  } catch (error) {
    console.log('Equipment Deletion Error:', error.message)
    return res.status(500).send({ message: 'Failed to delete equipment' })
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

app.get('/owner/my-equipments-rental', verifyToken, verifyOwner, async (req, res) => {
  try {
    const query = {
      'owner._id': req.user._id
    }
    const result = await bookings.find(query).sort({ bookingDate: -1 }).toArray()
    res.send(result)
  } catch (error) {
    res.status(500).send({ message: 'Failed to fetch owner equipments' })
  }
})



// Draft booking
app.post('/customer/bookings/draft', verifyToken, verifyCustomer, async (req, res) => {
  const { equipmentId, startDate, endDate, requiredQuantity, contactNumber, deliveryAddress, additionalNotes } = req.body
  if (!startDate || !endDate || !requiredQuantity || !contactNumber || !deliveryAddress) {
    return res.status(400).send({ message: "Please provide all required booking information" });
  }
  if (!ObjectId.isValid(equipmentId)) {
    return res.status(400).send({ message: "Invalid equipment ID" });
  }
  const equipment = await equipments.findOne({ _id: new ObjectId(equipmentId) })
  if (!equipment) {
    return res.status(404).send({ message: 'Equipment not found' })
  }
  if (equipment.approvalStatus !== 'approved') {
    return res.status(400).send({ message: 'Equipment not available for booking' })
  }

  if (equipment.owner._id.toString() === req.user._id.toString()) {
    return res.status(400).send({ message: "You can't book your own equipment" })

  }
  const quantity = Number(requiredQuantity)
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).send({ message: 'Invalid quantity' })
  }
  if (quantity > equipment.availableQuantity) {
    return res.status(400).send({
      message: `Only ${equipment.availableQuantity} available`,
    })
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return res.status(400).send({ message: "Invalid rental dates" })
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  if (start < today) {
    return res.status(400).send({ message: 'Start and End date cannot be in the past' })
  }


  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  let rentalDuration;
  if (equipment.rentalType === "Daily") {
    rentalDuration = totalDays
  } else if (equipment.rentalType === "Weekly") {
    rentalDuration = Math.ceil(totalDays / 7)
  } else if (equipment.rentalType === "Monthly") {
    rentalDuration = Math.ceil(totalDays / 30)
  }
  if (!rentalDuration || rentalDuration < 1) {
    return res.status(400).send({ message: 'Unsupported rental type' })
  }
  const equipmentForBooking = {
    equipmentId: equipment._id,
    equipmentName: equipment.name,
    startDate, endDate,
    requiredQuantity: quantity,
    contactNumber, deliveryAddress,
    additionalNotes: additionalNotes || '',
    equipmentImage: equipment.image,
    rentalType: equipment.rentalType,
    unitPrice: equipment.rentalPrice,
    rentalDuration: rentalDuration,
    bookingDate: new Date(),
    totalAmount: equipment.rentalPrice * rentalDuration * quantity,
    paymentStatus: "unpaid",
    bookingStatus: "pending",
    customer: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
    owner: {
      _id: equipment.owner._id,
      name: equipment.owner.name,
      email: equipment.owner.email
    }
  }

  try {
    const result = await bookings.insertOne(equipmentForBooking)
    if (result.acknowledged) {
      return res.status(201).send({
        message: "Booking created successfully",
        insertedId: result.insertedId
      });
    }
    return res.status(500).send({ message: "Failed to create booking" })

  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Failed to create booking" });
  }
})

// Get draft booking
app.get('/customer/bookings/draft/:id', verifyToken, verifyCustomer, async (req, res) => {
  const id = req.params.id
  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'Invalid booking ID' })
  }

  const query = {
    _id: new ObjectId(id),
    'customer._id': req.user._id
  }

  try {
    const result = await bookings.findOne(query)

    if (!result) {
      return res.status(404).send({ message: 'Booking not found' })
    }

    res.send(result)
  } catch (error) {
    console.error(error)
    res.status(500).send({ message: 'Failed to get booking' })
  }
})






app.post('/customer/payments/checkout-verify', verifyToken, verifyCustomer, async (req, res) => {
  const { sessionId } = req.body

  if (!sessionId) {
    return res.status(400).send({ message: 'Session ID is required' })
  }

  try {
    const {
      status,
      payment_status,
      customer_email,
      metadata,
      payment_intent,
      amount_total,
      currency
    } = await stripe.checkout.sessions.retrieve(sessionId)

    if (status === 'complete' && payment_status === 'paid') {

      const sessionQuery = { sessionId }
      const existingPayments = await payments.findOne(sessionQuery)

      if (existingPayments) {
        return res.send({ message: 'Payment already verified' })
      }

      if (!metadata?.bookingId || !metadata?.userId) {
        return res.status(400).send({ message: 'Invalid payment metadata' })
      }

      const query = {
        _id: new ObjectId(metadata.bookingId),
        'customer._id': new ObjectId(metadata.userId)
      }

      const booking = await bookings.findOne(query)

      if (!booking || metadata.userId !== req.user._id.toString()) {
        return res.status(403).send({ message: 'Unauthorized booking access' })
      }
      const payment = {
        sessionId,
        status,
        payment_status,
        customer_email,
        userId: metadata.userId,
        bookingId: metadata.bookingId,
        payment_date: new Date(),
        payment_intent,
        amount: amount_total / 100,
        currency
      }

      const result = await payments.insertOne(payment)

      const updatedDoc = {
        $set: {
          paymentStatus: 'paid',
          bookingStatus: 'confirmed'
        }
      }

      const updateResult = await bookings.updateOne(query, updatedDoc)
      await equipments.updateOne(
        { _id: new ObjectId(booking.equipmentId) },
        { $inc: { availableQuantity: -booking.requiredQuantity } }
      )
      return res.send({ result, updateResult })
    }

    return res.status(400).send({ message: 'Payment not completed' })
  } catch (error) {
    return res.status(500).send({ message: 'Payment verification failed' })
  }
})



app.post('/customer/favourites', verifyToken, verifyCustomer, async (req, res) => {
  const { equipmentId } = req.body
  if (!ObjectId.isValid(equipmentId)) {
    return res.status(400).send({ message: 'Invalid equipment ID' })
  }
  const query = {
    _id: new ObjectId(equipmentId),
  }
  try {
    const favouriteEquipment = await equipments.findOne(query)
    if (!favouriteEquipment) {
      return res.status(404).send({ message: 'Equipment not found' })
    }
    const existingFavourite = await favourites.findOne({
      customerId: req.user._id,
      equipmentId: favouriteEquipment._id
    })

    if (existingFavourite) {
      return res.status(409).send({ message: 'Already added to favourites' })
    }
    const favouriteToAdd = {
      customerId: req.user._id,
      equipmentId: favouriteEquipment._id,
      createdAt: new Date()
    }

    const result = await favourites.insertOne(favouriteToAdd)
    res.status(201).send(result)
  } catch (error) {
    res.status(500).send({ message: 'Failed to add favourite' })
  }
})

app.get('/customer/favourites/:id', verifyToken, verifyCustomer, async (req, res) => {
  const id = req.params.id
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).send({ message: 'Invalid equipment ID' })
  }
  const query = {
    equipmentId: new ObjectId(id),
    customerId: req.user._id
  }
  const result = await favourites.findOne(query)
  res.json(result)
})

app.delete('/customer/favourites/:id', verifyToken, verifyCustomer, async (req, res) => {
  const id = req.params.id
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).send({ message: 'Invalid equipment ID' })
  }
  const query = {
    equipmentId: new ObjectId(id),
    customerId: req.user._id
  }
  const result = await favourites.deleteOne(query)
  res.send(result)
})

app.get('/customer/favourites', verifyToken, verifyCustomer, async (req, res) => {
  try {
    const result = await favourites.aggregate([
      {
        $match: {
          customerId: req.user._id
        }
      },
      {
        $lookup: {
          from: 'equipments',
          localField: 'equipmentId',
          foreignField: '_id',
          as: 'equipment'
        }
      },
      {
        $unwind: '$equipment'
      },
      {
        $sort: {
          createdAt: -1
        }
      }
    ]).toArray()

    res.send(result)
  } catch (error) {
    res.status(500).send({ message: 'Failed to fetch favourites' })
  }
})

app.get('/customer/rental', verifyToken, verifyCustomer, async (req, res) => {
  const query = {
    'customer._id': req.user._id
  }

  try {
    const result = await bookings.find(query).sort({ bookingDate: -1 }).toArray()
    res.send(result)
  } catch (error) {
    res.status(500).send({ message: 'Failed to fetch rental bookings' })
  }
})


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;