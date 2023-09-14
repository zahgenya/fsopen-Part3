const mongoose = require('mongoose')

if (process.argv[2].length < 3) {
    console.log('give a valid password as argument')
    process.exit(1)
}

const password = process.argv[2]
const promptName = process.argv[3]
const promptNumber = process.argv[4]

const url =
    `mongodb+srv://zahgenya:${password}@cluster0.znpepqq.mongodb.net/phonebookApp?
retryWrites=true&w=majority`

mongoose.set('strictQuery', false)
mongoose.connect(url)

const personSchema = new mongoose.Schema({
    name: String,
    number: String,
})

const Persons = mongoose.model('Persons', personSchema)

const person = new Persons({
    name: promptName,
    number: promptNumber,
})

if (process.argv[3] === undefined && process.argv[4] === undefined) {
    console.log("phonebook:")
    Persons.find({}).then(result => {
        result.forEach(person => {
            console.log(`${person.name} ${person.number}`)
        })
        mongoose.connection.close()
    })
} else {
    if (process.argv[3].length > 0 && process.argv[4].length > 0) {
        person.save().then(result => {
            console.log(`added ${promptName} number ${promptNumber} to phonebook`)
            mongoose.connection.close()
        })
    }
}
