const express = require('express')
const morgan = require('morgan')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

const Person = require('./models/person')

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

app.use(cors())
app.use(express.json())
app.use(express.static('dist'))

morgan.token('post-data', (req) => {
    if (req.method === 'POST') {
        return JSON.stringify(req.body)
    }
    return '-'
})

app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms :post-data', {
        stream: process.stdout,
    })
)

app.get('/', (request, response) => {
    response.send('<h1>Hello World</h1>')
})

app.get('/api/persons', (request, response) => {
    Person.find({})
        .then(persons => {
            console.log('Found persons:', persons)
            response.status(200).json(persons)
        })
        .catch(err => {
            console.log('Error:', err)
            response.status(500).json({ error: 'Server error' })
        })
})

app.get('/api/persons/:id', (request, response) => {
    Person.findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => {
            console.log(error)
            response.status(500).json({ error: 'Server error' })
        })
})

app.get('/info', async (request, response) => {
    const peopleCount = await Person.countDocuments({})
    const todayDate = new Date()
    response.send(`<p>phonebook has info for ${peopleCount} people<br/>
    ${todayDate}</p>`)
});

app.delete('/api/persons/:id', (request, response) => {
    Person.findByIdAndRemove(request.params.id)
        .then(result => {
            if (result) {
                response.status(204).end()
            } else {
                response.status(404).end()
            }
        })
        .catch(error => {
            console.log(error)
            response.status(500).json({ error: 'Server error' })
        })
})


const generateId = async () => {
    const maxId = await Person.find({})
        .sort({ id: -1 })
        .limit(1)
        .then(persons => persons.length > 0 ? persons[0].id : 0)

    return maxId + 1
}

app.post('/api/persons', (request, response) => {
    const body = request.body

    if (!body.name || !body.number) {
        return response.status(400).json({
            error: 'content missing'
        })
    }

    const isNameFound = body.name && Person.some(
        (person) => person.name && person.name?.toLowerCase() === body.name.toLowerCase()
    )

    const isNumberFound = body.number && Person.some(
        (person) => person.number === body.number
    )

    if (isNameFound || isNumberFound || (isNameFound && isNumberFound)) {
        return response.status(400).json({
            error: 'name must be unique'
        })
    }

    const person = new Person({
        name: body.name,
        number: body.number,
        id: generateId(),
    })

    person.save().then(savedPerson => {
        response.json(savedPerson)
    })
})

app.use(unknownEndpoint)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server runnig on port ${PORT}`)
})