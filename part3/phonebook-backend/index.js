const express = require('express')
const morgan = require('morgan')
const app = express()
const cors = require('cors')
require('dotenv').config()

const Persons = require('./models/persons')

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    }

    next(error)
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
    Persons.find({})
        .then(person => {
            console.log('Found persons:', person)
            response.status(200).json(person)
        })
        .catch(err => {
            console.log('Error:', err)
            response.status(500).json({ error: 'Server error' })
        })
})

app.get('/api/persons/:id', (request, response, next) => {
    Persons.findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.get('/info', async (request, response) => {
    const peopleCount = await Persons.countDocuments({})
    const todayDate = new Date()
    response.send(`<p>phonebook has info for ${peopleCount} people<br/>
    ${todayDate}</p>`)
});

app.delete('/api/persons/:id', (request, response, next) => {
    Persons.findByIdAndRemove(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

app.post('/api/persons', async (request, response) => {
    const body = request.body

    if (!body.name || !body.number) {
        return response.status(400).json({
            error: 'content missing'
        })
    }

    const sameNamePerson = await Persons.findOne({
        name: body.name
    })

    const sameNumberPerson = await Persons.findOne({
        number: body.number
    })

    if (sameNamePerson || sameNumberPerson) {
        return response.status(400).json({
            error: 'name must be unique'
        })
    }

    const person = new Persons({
        name: body.name,
        number: body.number,
    })

    person.save().then(savedPerson => {
        response.json(savedPerson)
    })
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    const person = {
        name: body.name,
        number: body.number,
    }

    Persons.findByIdAndUpdate(request.params.id, person, { new: true })
        .then(updatePerson => {
            response.json(updatePerson)
        })
        .catch(error => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server runnig on port ${PORT}`)
})