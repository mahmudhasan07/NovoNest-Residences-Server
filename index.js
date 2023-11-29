const express = require('express')
const cors = require('cors')
var jwt = require('jsonwebtoken');
const stripe = require("stripe")('sk_test_51OEnTBBRuTovkuxKh4v2hS0RK39oKLIp45sAV5YEDObj9lEaN5vGMckfDAdDtAo8v1imqH8js1HM9swzVm9z0hGO00wx32jQwf');
const port = process.env.PORT || 5000
require('dotenv').config()
const app = express()
app.use(cors({
  origin: ['http://localhost:5173','https://novonest-realty.web.app'],
  credentials: true
}
))
app.use(express.json())
app.use(express.static('public'))

app.get(`/`, async (req, res) => {
  res.send('Welcome to my Server')
})

// console.log(process.env.DATABASE_USER);



//MongoDB Connect 


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const noticeDB = client.db('Real-Estate').collection('notices')
    const paymentDB = client.db('Real-Estate').collection('payments')

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
      const email = req?.user?.email
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

    app.get(`/users/admin`, verifyToken, verifyAdmin, async (req, res) => {
      const query = { role: 'admin' }
      const result = await userDB.find(query).toArray()
      res.send(result)
    })
    app.get(`/users/members`, verifyToken, async (req, res) => {
      const query = { role: 'member' }
      const result = await userDB.find(query).toArray()
      res.send(result)
    })
    app.get(`/users/admin/:email`, verifyAdmin, verifyAdmin, async (req, res) => {
      const email = req.params.email
      // const query1 = { role: 'admin' }
      const query = { email: email, role: 'admin' }
      const result = await userDB.findOne(query)
      if (!result) {
        return
      }
      else {
        res.send(result)
      }
    })
    app.get(`/users/members/:email`, verifyToken, async (req, res) => {
      const email = req.params.email
      // const query = { role: "member" }
      const query = { email: email, role: "member" }
      const result = await userDB.findOne(query)
      if (!result) {
        return
      }
      else {
        res.send(result)
      }

    })

    app.get('/coupons', async (req, res) => {
      const coupons = await couponDB.find().toArray()
      res.send(coupons)
    })

    app.get('/users', verifyToken,verifyAdmin,  async (req, res) => {
      const result = await userDB.find().toArray()
      res.send(result)
    })

    app.get(`/agreements`, verifyToken, async (req, res) => {
      // const data =req.query
      // const query = { userEmail: data.data }
      const agreements = await agreementDB.find().toArray();
      res.send(agreements)
    })

    app.get(`/agreements/pending`, verifyToken, async (req, res) => {
      const query = { status: "pending" }
      const result = await agreementDB.find(query).toArray()
      res.send(result)
    })
    app.get(`/agreements/complete`, verifyToken,  async (req, res) => {
      const data = req.query
      // const query = { status: "complete" }
      // console.log(data);
      let query1 = {}
      if (data.data) {
        query1 = { userEmail: data.data, status: "complete" }
      } else {
        query1 = { status: "complete" }
      }
      // console.log(data);
      const result = await agreementDB.find(query1).toArray()
      res.send(result)
    })

    app.get(`/notice`, verifyToken, async (req, res) => {
      let query = {}
      const sort = req.query.data
      if (sort == 'latest') {
        query = { updateDate: -1 }
      }
      if (sort == 'oldest') {
        query = { updateDate: 1 }
      }
      const notice = await noticeDB.find().sort(query).toArray()
      res.send(notice)
    })

    app.get(`/payment`, verifyToken, async (req, res) => {
      const result = await paymentDB.find().toArray()
      res.send(result)
    })

    app.get('/payment/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) }
      const result = await paymentDB.findOne(query)
      res.send(result)
    })

    app.get(`/payment-success/:email`, verifyToken, async (req, res) => {
      let query = {}
      // const sort = req.query.data 
      const email = req.params.email;
      console.log(email);
      const query1 = { email: email }
      if (query1) {
        query = { email: email, payment: "complete" }
      }
      const result = await paymentDB.find(query).toArray()
      res.send(result)


    })


    //POST METHOD

    app.post('/apartments', async (req, res) => {
      const data = req.body
      // console.log(data);
      const result = await apartmentsDB.insertOne(data)
      res.send(result)
    })
    app.post('/coupons', async (req, res) => {
      const data = req.body
      // console.log(data);
      const result = await couponDB.insertOne(data)
      res.send(result)
    })

    app.post(`/agreements`, async (req, res) => {
      const data = req.body
      const query = { userEmail: data.userEmail, floor: data.floor, block: data.block, apartmentNo: data.apartmentNo }
      const result = await agreementDB.findOne(query)
      if (!result) {
        const result = await agreementDB.insertOne(data)
        res.send(result)
      } else {
        res.send({ message: 'Already added this flat' })
      }
    })



    app.post(`/users`, async (req, res) => {
      const data = req.body
      const query = { email: data.email }
      // console.log(query);
      const result = await userDB.findOne(query)
      if (!result) {
        const result = await userDB.insertOne(data)
        console.log(result);
        res.send(result)
      }
    })

    app.post('/notice', async (req, res) => {
      const data = req.body;
      // console.log(data);
      const result = await noticeDB.insertOne(data)
      res.send(result)
    })

    app.post(`/payment`, async (req, res) => {
      const data = req.body;
      const result = await paymentDB.insertOne(data)
      res.send(result)
    })

    // app.post(`/payment/success`, async (req, res) => {
    //   const data = req.body;
    //   let result = await paymentDB.insertOne(data)
    //   res.send(result)
    // })

    //PUT METHOD

    app.put(`/users`, async (req, res) => {
      const email = req.body
      // console.log(email);
      const query = { email: email?.email }
      const options = { upsert: true }
      const updateDoc = {
        $set: {
          role: 'member'
        }
      }
      const result = await userDB.updateOne(query, updateDoc, options)
      res.send(result)
    })
    app.put(`/payment`, async (req, res) => {
      const id = req.body
      console.log(id, "id");
      const query = { _id: new ObjectId(id.ID) }
      console.log(query);
      const options = { upsert: true }
      const updateDoc = {
        $set: {
          payment: "complete",
          rent: id.Rent

        }
      }
      const result = await paymentDB.updateOne(query, updateDoc, options)
      res.send(result)
    })

    app.put('/agreements', async (req, res) => {
      const data = req.body
      // console.log(data);
      const query = { _id: new ObjectId(data.id) }
      const updateDoc = {
        $set: {
          status: 'complete', agreementAcceptTime: data?.updateDate
        }
      }
      const result = await agreementDB.updateOne(query, updateDoc)

      res.send(result)
    })

    //DELETE SECTION
    app.delete(`/agreements/:id`, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await agreementDB.deleteOne(query)
      res.send(result)

    })
    app.delete(`/coupons/:id`, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) }
      const result = await couponDB.deleteOne(query)
      res.send(result)

    })

    app.put(`/users/:id`, async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: ""
        }
      }
      const result = await userDB.updateOne(query, updateDoc)
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


    //Payment API Method

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;

      const amount = parseInt(price * 100)

      console.log(amount, "paise payment");


      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "BDT",
        // payment_method_type : ['Card'],
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        automatic_payment_methods: {
          enabled: true,
        },
      });
      // console.log(paymentIntent);
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });



    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Server is running at ${port}`);
})