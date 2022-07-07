const mongoose = require('mongoose');

const connectDatabase = () => {
    const db = mongoose.connect(process.env.DB_LOCAL_URI)
    .then((con) => {console.log(`Mongo Database is connected  with host: ${con.connection.host}`)
    })


}

module.exports = connectDatabase;