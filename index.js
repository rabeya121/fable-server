const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://fable-client-omega.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Dummy email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "ethereal_user",
    pass: "ethereal_pass",
  },
});

const sendEmail = async (to, subject, text) => {
  console.log(`📧 Email sent to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Message: ${text}`);
};

// MongoDB Connection
const client = new MongoClient(process.env.MONGODB_URL);
const db = client.db("fable");

async function connectDB() {
  try {
    await client.connect();
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("DB connection failed:", error.message);
    process.exit(1);
  }
}
connectDB();

// Collections
const users = () => db.collection("user");
const ebooks = () => db.collection("ebooks");
const purchases = () => db.collection("purchases");
const transactions = () => db.collection("transactions");

// ==================== MIDDLEWARE ====================

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  next();
};

const verifyWriter = (req, res, next) => {
  if (req.user?.role !== "writer" && req.user?.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  next();
};

// ==================== ROUTES ====================

app.get("/", (req, res) => res.send("Fable Server Running"));

// ---------- USER ROUTES ----------

// Update user profile
app.patch("/api/users/:email/profile", async (req, res) => {
  try {
    const { name, image } = req.body;
    await users().updateOne(
      { email: req.params.email },
      { $set: { name, image } },
    );
    res.json({ message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single user
app.get("/api/users/:email", async (req, res) => {
  try {
    const user = await users().findOne({ email: req.params.email });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- ADMIN ROUTES ----------

// Analytics
app.get("/api/admin/analytics", async (req, res) => {
  try {
    const totalUsers = await users().countDocuments();
    const totalWriters = await users().countDocuments({ role: "writer" });
    const totalEbooks = await ebooks().countDocuments();
    const totalPurchases = await purchases().countDocuments();
    const revenueData = await transactions()
      .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
      .toArray();

    const monthlySales = await purchases()
      .aggregate([
        {
          $group: {
            _id: { $month: "$purchasedAt" },
            sales: { $sum: 1 },
            revenue: { $sum: "$price" },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const genreData = await ebooks()
      .aggregate([
        { $match: { status: "published" } },
        { $group: { _id: "$genre", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();
    const recentPurchases = await purchases()
      .find()
      .sort({ purchasedAt: -1 })
      .limit(5)
      .toArray();
    const recentBookmarks = await users()
      .find({ bookmarks: { $exists: true, $ne: [] } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();

    res.json({
      totalUsers,
      totalWriters,
      totalEbooks,
      totalPurchases,
      totalRevenue: revenueData[0]?.total || 0,
      monthlySales,
      genreData,
      recentPurchases,
      recentBookmarks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (admin)
app.get("/api/admin/users", async (req, res) => {
  try {
    const result = await users().find().toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user role/ban (admin)
app.patch("/api/admin/users/:email/role", async (req, res) => {
  try {
    const { role, banned } = req.body;
    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (banned !== undefined) updateData.banned = banned;
    await users().updateOne({ email: req.params.email }, { $set: updateData });
    res.json({ message: "User updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (admin)
app.delete("/api/admin/users/:email", async (req, res) => {
  try {
    await users().deleteOne({ email: req.params.email });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all ebooks (admin)
app.get("/api/admin/ebooks", async (req, res) => {
  try {
    const result = await ebooks().find().sort({ createdAt: -1 }).toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all transactions (admin)
app.get("/api/admin/transactions", async (req, res) => {
  try {
    const result = await transactions()
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- EBOOK ROUTES ----------

// Get featured ebooks
app.get("/api/ebooks/featured", async (req, res) => {
  try {
    const result = await ebooks()
      .find({ status: "published" })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get writer's ebooks
app.get("/api/ebooks/writer/:email", async (req, res) => {
  try {
    const result = await ebooks()
      .find({ writerEmail: req.params.email })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get writer sales
app.get("/api/sales/writer/:email", async (req, res) => {
  try {
    const result = await purchases()
      .find({ writerEmail: req.params.email })
      .sort({ purchasedAt: -1 })
      .toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all ebooks
app.get("/api/ebooks", async (req, res) => {
  try {
    const { genre, search, sort, minPrice, maxPrice } = req.query;
    let query = { status: "published" };

    if (genre) query.genre = genre;
    if (search)
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { writerName: { $regex: search, $options: "i" } },
      ];
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_low") sortOption = { price: 1 };
    if (sort === "price_high") sortOption = { price: -1 };

    const result = await ebooks().find(query).sort(sortOption).toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get top writers
app.get("/api/writers/top", async (req, res) => {
  try {
    const fromPurchases = await purchases()
      .aggregate([
        {
          $group: {
            _id: "$writerEmail",
            totalSales: { $sum: 1 },
            writerName: { $first: "$writerName" },
          },
        },
        { $sort: { totalSales: -1 } },
        { $limit: 3 },
      ])
      .toArray();

    if (fromPurchases.length > 0) return res.json(fromPurchases);

    const fromEbooks = await ebooks()
      .aggregate([
        { $match: { status: "published" } },
        {
          $group: {
            _id: "$writerEmail",
            writerName: { $first: "$writerName" },
            totalSales: { $sum: "$sales" },
          },
        },
        { $sort: { totalSales: -1 } },
        { $limit: 3 },
      ])
      .toArray();

    res.json(fromEbooks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single ebook
app.get("/api/ebooks/:id", async (req, res) => {
  try {
    const ebook = await ebooks().findOne({ _id: new ObjectId(req.params.id) });
    if (!ebook) return res.status(404).json({ message: "Ebook not found" });
    res.json(ebook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add ebook
app.post("/api/ebooks", async (req, res) => {
  try {
    const ebook = {
      ...req.body,
      status: req.body.status || "published",
      sales: 0,
      createdAt: new Date(),
    };
    const result = await ebooks().insertOne(ebook);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update ebook
app.put("/api/ebooks/:id", async (req, res) => {
  try {
    const result = await ebooks().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle ebook status
app.patch("/api/ebooks/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await ebooks().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status } },
    );
    res.json({ message: "Status updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete ebook
app.delete("/api/ebooks/:id", async (req, res) => {
  try {
    await ebooks().deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "Ebook deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- BOOKMARK ROUTES ----------

// Add bookmark
app.post("/api/bookmarks", async (req, res) => {
  try {
    const { ebookId, userEmail } = req.body;
    await users().updateOne(
      { email: userEmail },
      { $addToSet: { bookmarks: ebookId } },
    );
    res.json({ message: "Bookmarked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove bookmark
app.delete("/api/bookmarks/:ebookId", async (req, res) => {
  try {
    const { userEmail } = req.body;
    await users().updateOne(
      { email: userEmail },
      { $pull: { bookmarks: req.params.ebookId } },
    );
    res.json({ message: "Bookmark removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get bookmarks
app.get("/api/bookmarks/:email", async (req, res) => {
  try {
    const user = await users().findOne({ email: req.params.email });
    const bookmarkIds = user?.bookmarks || [];
    if (bookmarkIds.length === 0) return res.json([]);
    const bookmarkedEbooks = await ebooks()
      .find({ _id: { $in: bookmarkIds.map((id) => new ObjectId(id)) } })
      .toArray();
    res.json(bookmarkedEbooks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- PURCHASE ROUTES ----------

// Get user purchases
app.get("/api/purchases/:email", async (req, res) => {
  try {
    const result = await purchases()
      .find({ userEmail: req.params.email })
      .toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Stripe checkout session
app.post("/api/payment/create-checkout", async (req, res) => {
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const { ebookId, ebookTitle, price, userEmail } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: ebookTitle },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.BETTER_AUTH_URL}/payment/success?ebookId=${ebookId}&userEmail=${userEmail}`,
      cancel_url: `${process.env.BETTER_AUTH_URL}/payment/cancel`,
      metadata: { ebookId, userEmail },
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save purchase after success

app.post("/api/payment/save-purchase", async (req, res) => {
  try {
    const { ebookId, userEmail, ebookTitle, price, writerEmail, writerName } = req.body;

    const existing = await purchases().findOne({ ebookId, userEmail });
    if (existing) return res.json({ message: "Already purchased" });

    await purchases().insertOne({
      ebookId,
      userEmail,
      ebookTitle,
      price,
      writerEmail,
      writerName,
      purchasedAt: new Date(),
    });

    await ebooks().updateOne(
      { _id: new ObjectId(ebookId) },
      { $inc: { sales: 1 } }
    );

    await transactions().insertOne({
      type: "purchase",
      userEmail,
      writerEmail,
      writerName,
      amount: price,
      ebookTitle,
      createdAt: new Date(),
    });


    
    // 📧 Dummy Email Notification
    await sendEmail(
      userEmail,
      "Purchase Successful – Fable",
      `Hi! You have successfully purchased "${ebookTitle}" for $${price}. Enjoy reading!`
    );

    await sendEmail(
      writerEmail,
      "New Sale – Fable",
      `Hi ${writerName}! Your ebook "${ebookTitle}" was purchased by ${userEmail} for $${price}.`
    );


    res.json({ message: "Purchase saved!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update transaction status (admin)
app.patch("/api/admin/transactions/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await transactions().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status } },
    );
    res.json({ message: "Status updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
