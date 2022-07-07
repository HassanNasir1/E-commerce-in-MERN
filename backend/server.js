const app = require('./app');
const connectDatabase = require('./config/database');
const dotenv = require('dotenv')

process.on('uncaughtException',err=>{
    console.log(`Error Name: ${err.name} And Error Message: ${err.message}`);
    console.log("server is shutting down due to uncaught exception")
    process.exit(1);
})
//setting up config file
dotenv.config({ path:'backend/config/config.env'})

//connecting to database

connectDatabase();


const server = app.listen(process.env.PORT,()=>{
    console.log(`Server is started at port: ${process.env.PORT} in ${process.env.NODE_ENV} mode`)
    
})

process.on('unhandledRejection', err => {
    console.log(`ERROR: ${err.message}`);
    console.log("Shutting down the server due to unhandled promise rejection");
    server.close( () => {
        server.exit(1)
    })
})
