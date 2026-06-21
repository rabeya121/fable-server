const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());

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
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  next();
};

const verifyWriter = (req, res, next) => {
  if (req.user?.role !== "writer" && req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

// ==================== ROUTES ====================

app.get("/", (req, res) => res.send("Fable Server Running"));


// Update user profile
app.patch("/api/users/:email/profile", async (req, res) => {
  try {
    const { name, image } = req.body;
    await users().updateOne(
      { email: req.params.email },
      { $set: { name, image } }
    );
    res.json({ message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin analytics
app.get("/api/admin/analytics", async (req, res) => {
  try {
    const totalUsers = await users().countDocuments();
    const totalWriters = await users().countDocuments({ role: "writer" });
    const totalEbooks = await ebooks().countDocuments();
    const totalPurchases = await purchases().countDocuments();
    const revenueData = await transactions().aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).toArray();

    res.json({
      totalUsers,
      totalWriters,
      totalEbooks,
      totalPurchases,
      totalRevenue: revenueData[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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

// Get all ebooks
app.get("/api/ebooks", async (req, res) => {
  try {
    const { genre, search, sort, minPrice, maxPrice } = req.query;
    let query = { status: "published" };

    if (genre) query.genre = genre;
    if (search) query.$or = [
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
    const result = await purchases().aggregate([
      { $group: { _id: "$writerEmail", totalSales: { $sum: 1 }, writerName: { $first: "$writerName" } } },
      { $sort: { totalSales: -1 } },
      { $limit: 3 },
    ]).toArray();
    res.json(result);
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

// Add ebook (writer)
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

// Add bookmark
app.post("/api/bookmarks", async (req, res) => {
  try {
    const { ebookId, userEmail } = req.body;
    await users().updateOne(
      { email: userEmail },
      { $addToSet: { bookmarks: ebookId } }
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
      { $pull: { bookmarks: req.params.ebookId } }
    );
    res.json({ message: "Bookmark removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user purchases
app.get("/api/purchases/:email", async (req, res) => {
  try {
    const result = await purchases().find({ userEmail: req.params.email }).toArray();
    res.json(result);
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
      .find({ _id: { $in: bookmarkIds.map(id => new ObjectId(id)) } })
      .toArray();
    res.json(bookmarkedEbooks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));