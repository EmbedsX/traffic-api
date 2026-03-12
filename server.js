const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Key
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

let lastResult = {
status:"WAITING"
};

// ------------------------
// Home route
// ------------------------

app.get("/", (req,res)=>{
res.send("Traffic QR Verification Server Running");
});

// ------------------------
// VERIFY API (ESP32 use)
// ------------------------

app.get("/verify", async (req,res)=>{

try{

const id = req.query.id;

console.log("QR ID:",id);

const doc = await db.collection("vehicles").doc(id).get();

if(!doc.exists){

lastResult = {
status:"INVALID"
};

return res.json({status:"INVALID"});
}

const data = doc.data();

const today = new Date();

const pucExpiry = new Date(data.puc_expiry);
const licenseExpiry = new Date(data.license_expiry);

if(pucExpiry < today || licenseExpiry < today){

lastResult = {
status:"INVALID",
...data
};

return res.json({status:"INVALID"});
}

lastResult = {
status:"VALID",
...data
};

res.json({status:"VALID"});

}

catch(err){

console.log(err);

res.status(500).send("Server Error");

}

});

// ------------------------
// RESULT API (HTML use)
// ------------------------

app.get("/result",(req,res)=>{

res.json(lastResult);

});

// ------------------------

const PORT = process.env.PORT || 10000;

app.listen(PORT,()=>{
console.log("Server running on port",PORT);
});

