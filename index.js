const express = require('express')
const cors = require('cors')
var jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000
require('dotenv').config()
const app = express()
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}
))
app.use(express.json())

app.get(`/`, async (req, res) => {
  res.send('Welcome to my Server')
})

// console.log(process.env.DATABASE_USER);



//MongoDB Connect 


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASS}@cluster0.oqk84kq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const apartmentsDB = client.db('Real-Estate').collection('apartments')
    const userDB = client.db('Real-Estate').collection('users')
    const couponDB = client.db('Real-Estate').collection('coupons')
    const agreementDB = client.db('Real-Estate').collection('agreements')

    //MIDDLE WIRE

    const verifyToken = async (req, res, next) => {
      const token1 = req.headers.authorization
      console.log(token1);
      if (!token1) {
        return res.status(401).send({ auth: false, message: 'Token nai' });
      }
      const token = req.headers?.authorization.split(' ')[1];
      console.log(token);
      jwt.verify(token, process.env.JWT_TOKEN, async (error, decoded) => {
        if (error) {
          console.log("error paise");
          return res.status(403).send({ auth: false, message: "You can't Access this" });

        }
        console.log("Mahmud paise", decoded);
        req.user = decoded
        next()
      })

    }

    const verifyAdmin = async (req, res, next) => {
      const email = req.user.email
      const query = { email: email }
      const result = await userDB.findOne(query)
      if (result?.role !== "admin") {
        return res.status(403).send({ message: "UnAuthorize" })
      }
      next()
    }

    // await client.connect();

    // GET METHOD
    app.get(`/apartments`, async (req, res) => {
      let query = {}
      const sort = req.query.data
      if (sort == 'sortLtoH') {
        query = { rent: 1 }
      }
      if (sort == 'sortHtoL') {
        query = { rent: -1 }
      }

      const result = await apartmentsDB.find().sort(query).toArray()
      res.send(result)

    })

    app.get(`/users/admin`, async (req, res) => {
      const query = { role: 'admin' }
      const result = await userDB.find(query).toArray()
      res.send(result)
    })
    app.get(`/users/member`, async (req, res) => {
      const query = { role: 'member' }
      const result = await userDB.find(query).toArray()
      res.send(result)
    })
    app.get(`/users/admin/:email`, async (req, res) => {
      const email = req.params.email
      // const query1 = { role: 'admin' }
      const query = { email: email, role: 'admin' }
      const result = await userDB.findOne(query)
      if (!result) {
        res.send({ message: "User not found" })
      }
      else {
        res.send(result)
      }
    })
    app.get(`/users/members/:email`, async (req, res) => {
      const email = req.params.email
      // const query = { role: "member" }
      const query = { email: email, role: "member" }
      const result = await userDB.findOne(query)
      if (!result) {
        res.send({ message: "User not found" })
      }
      else {
        res.send(result)
      }

    })

    app.get('/coupons', async (req, res) => {
      const coupons = await couponDB.find().toArray()
      res.send(coupons)
    })

    app.get('/users', async (req, res) => {
      const result = await userDB.find().toArray()
      res.send(result)
    })


    //POST METHOD

    app.post('/apartments', async (req, res) => {
      const data = req.body
      console.log(data);
      const result = await apartmentsDB.insertOne(data)
      res.send(result)
    })
    app.post('/coupons', async (req, res) => {
      const data = req.body
      console.log(data);
      const result = await couponDB.insertOne(data)
      res.send(result)
    })

    app.post(`/agreements`, async (req, res) => {
      const data = req.body
      const result = await agreementDB.insertOne(data)
      res.send(result)
    })



    app.post(`/users`, async (req, res) => {
      const data = req.body
      const query = { email: data.email }
      console.log(query);
      const result = await userDB.findOne(query)
      if (!result) {
        const result = await userDB.insertOne(data)
        console.log(result);
        res.send(result)
      }
    })

    //PUT METHOD

    app.put(`/users`, async (req, res) => {
      const email = req.body
      console.log(email);
      const query = { email: email.userEmail }
      const options = { upsert: true }
      const updateDoc = {
        $set: {
          role: 'member'
        }
      }
      const result = await userDB.updateOne(query, updateDoc, options)
      res.send(result)
    })

    //JWT SECTION

    app.post('/jwt', async (req, res) => {
      const email = req.body
      const token = jwt.sign(email, process.env.JWT_TOKEN, { expiresIn: '1h' })
      res.send(token)
      // console.log(token);
      // console.log(email);
    })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Server is running at ${port}`);
})