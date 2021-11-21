const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;

require("dotenv").config();
// file upload require
const fileUpload = require('express-fileupload')

const app = express();
const port = process.env.PORT || 500;


//middlewere
app.use(cors());
app.use(express.json());
// file upload middlewere
app.use(fileUpload());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0tkjs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db("bookList");
        const booksCollection = database.collection("books");

        // GET API
        app.get('/books', async (req, res) => {
            const cursor = booksCollection.find({});
            const book = await cursor.toArray();


            res.json(book)

        })

        //   add a single book
        app.post('/books', async (req, res) => {
            const title = req.body.title;
            const author = req.body.author;
            const image = req.files.image;
            const imageData = image.data;
            const encodedImage = imageData.toString('base64');

            const imageBuffer = Buffer.from(encodedImage, 'base64');
            const book = {
                title,
                author,
                image: imageBuffer
            }

            const result = await booksCollection.insertOne(book);
            res.json(result);
        });


        // UPDATE BOOKS
        // get a single book
        app.get('/books/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const book = await booksCollection.findOne(query);
            res.send(book)
        })
        app.put('/books/:id', async (req, res) => {
            const id = req.params.id;
            const updateBook = req.body;
            const query = { _id: ObjectId(id) };
            const option = { upsert: true };
            const updateDoc = {
                $set: {
                    image: updateBook.image,
                    title: updateBook.title,
                    author: updateBook.author
                },
            }
            const result = await booksCollection.updateOne(query, updateDoc, option);


            res.json(result)
        })



        // DELETE API
        app.delete('/books/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await booksCollection.deleteOne(query);
            res.json(result)
        })


        // get search book
        app.get("/searchEvent", async (req, res) => {
            const result = await booksCollection.find({
                title: { $regex: req.query.search }
            }).toArray();
            // res.send(result);
            console.log('find books', result);
        });


    }
    finally {
        //   await client.close();
    }
}
run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Book List is Running at Server.')
})

app.listen(port, () => {
    console.log('Book List Running on', port)
})
