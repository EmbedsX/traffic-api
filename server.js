const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'image/jpeg', limit: '5mb' })); // for ESP32 image

// ------------------------
// FIREBASE SETUP
// ------------------------

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ------------------------
// GLOBAL RESULT (HTML PAGE)
// ------------------------

let lastResult = {
  status: "WAITING"
};

// ------------------------
// HOME
// ------------------------

app.get("/", (req, res) => {
  res.send("🚀 Traffic QR Verification Server Running");
});

// ------------------------
// UPLOAD API (ESP32 IMAGE)
// ------------------------

app.post("/upload", (req, res) => {

  console.log("📸 Upload API hit");

  // ⚠️ IMPORTANT:
  // इथे normally QR decode करायचा असतो (OpenCV / library)
  // पण तुझ्याकडे already ESP32 वर QR ID मिळते

  // 👉 TEST साठी fixed ID देतो
  const qrID = "mWWV1SbDSFzCiHHryXtr";

  console.log("Returning ID:", qrID);

  res.send(qrID);
});

// ------------------------
// VERIFY API (MAIN LOGIC)
// ------------------------

app.get("/verify", async (req, res) => {

  try {

    const id = req.query.id;

    console.log("🔍 QR ID:", id);

    const doc = await db.collection("vehicles").doc(id).get();

    if (!doc.exists) {

      lastResult = {
        status: "INVALID"
      };

      return res.json({ status: "INVALID" });
    }

    const data = doc.data();

    const today = new Date();

    const pucExpiry = new Date(data.puc_expiry);
    const licenseExpiry = new Date(data.license_expiry);
    const insuranceExpiry = new Date(data.insurance_expiry);

    // Expiry check

    if (
      pucExpiry < today ||
      licenseExpiry < today ||
      insuranceExpiry < today
    ) {

      lastResult = {
        status: "INVALID",
        ...data
      };

      return res.json({ status: "INVALID" });
    }

    lastResult = {
      status: "VALID",
      ...data
    };

    res.json({ status: "VALID" });

  } catch (err) {

    console.log("❌ ERROR:", err);
    res.status(500).send("Server Error");

  }

});

// ------------------------
// RESULT API (HTML PAGE)
// ------------------------

app.get("/result", (req, res) => {
  res.json(lastResult);
});

// ------------------------
// SERVER START
// ------------------------

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
