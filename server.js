const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(cors());

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});;

const db = admin.firestore();

app.get("/verify", async (req,res)=>{

  const id = req.query.id;

  if(!id){
    return res.status(400).json({error:"ID missing"});
  }

  try{

    const doc = await db.collection("vehicles").doc(id).get();

    if(!doc.exists){
      return res.json({status:"NOT_FOUND"});
    }

    const data = doc.data();

    const today = new Date().toISOString().split("T")[0];

    const pucValid = data.puc_expiry >= today;
    const licenseValid = data.license_expiry >= today;

    let finalStatus = "VALID";

    if(!pucValid || !licenseValid){
      finalStatus = "INVALID";
    }

    res.json({
      owner:data.name,
      vehicle:data.vehicle,
      license:data.license,
      puc_expiry:data.puc_expiry,
      license_expiry:data.license_expiry,
      status:finalStatus
    });

  }
  catch(err){
    res.status(500).json({error:err.message});
  }

});

const PORT = process.env.PORT || 8080;

app.listen(PORT, ()=>{
  console.log("Server running on port " + PORT);
});




