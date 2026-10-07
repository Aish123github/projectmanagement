// this file is just an entry point 

import dotenv from "dotenv"
import app from "./app.js"
import connectDB from "./db/index.js";
//process.env.username
dotenv.config({
  path: "./.env",
  override: true
});
//const app = express();
const port = process.env.PORT || 3000;

// app.get("/" , (req ,res)=> {
//   res.send("Hello World !");
// });
// app.get("/instagram" , (req , res)=>{
//   res.send("this is an instagram page") // response wants to send an info
// });
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening o port http://localhost:${port}`);
    });
  })
   .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });

// console.log("dotenv value:", process.env.database);
// let myusername = process.env.username;

// console.log("value:" ,myusername);
// console.log("start of backend project ");
