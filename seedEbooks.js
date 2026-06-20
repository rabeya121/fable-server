require("dotenv").config();
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URL);

// Spread createdAt dates over the last ~10 weeks so "Newest First"
// sorting in the Browse page actually has something to sort.
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const ebooksData = [
  {
    title: "The Silent Echo",
    description:
      "A small-town detective uncovers a decades-old secret after a body is found in the lake that everyone swore had no bottom.",
    price: 4.99,
    genre: "Mystery",
    coverImage: "https://picsum.photos/seed/silent-echo/400/600",
    writerName: "Ariana Cole",
    writerEmail: "ariana.cole@fable.com",
    status: "published",
    sales: 132,
    createdAt: daysAgo(2),
  },
  {
    title: "Whispers of the Heart",
    description:
      "Two rival chefs are forced to share a kitchen for a cooking competition, and neither expected to fall for the competition.",
    price: 3.99,
    genre: "Romance",
    coverImage: "https://picsum.photos/seed/whispers-heart/400/600",
    writerName: "Maya Patel",
    writerEmail: "maya.patel@fable.com",
    status: "published",
    sales: 89,
    createdAt: daysAgo(5),
  },
  {
    title: "Starbound Legacy",
    description:
      "When Earth's last colony ship goes dark, a young engineer must decide whether to trust an AI that claims it can save them all.",
    price: 5.99,
    genre: "Sci-Fi",
    coverImage: "https://picsum.photos/seed/starbound-legacy/400/600",
    writerName: "Devon Marsh",
    writerEmail: "devon.marsh@fable.com",
    status: "published",
    sales: 204,
    createdAt: daysAgo(1),
  },
  {
    title: "The Dragon's Oath",
    description:
      "A disgraced knight forms an unlikely bond with the last dragon of the northern peaks to stop a war neither of them started.",
    price: 6.49,
    genre: "Fantasy",
    coverImage: "https://picsum.photos/seed/dragons-oath/400/600",
    writerName: "Liora Bennett",
    writerEmail: "liora.bennett@fable.com",
    status: "published",
    sales: 311,
    createdAt: daysAgo(12),
  },
  {
    title: "Midnight Asylum",
    description:
      "A group of urban explorers livestreams their visit to an abandoned asylum, and what follows them home was never on the tour.",
    price: 4.49,
    genre: "Horror",
    coverImage: "https://picsum.photos/seed/midnight-asylum/400/600",
    writerName: "Caleb Storm",
    writerEmail: "caleb.storm@fable.com",
    status: "published",
    sales: 76,
    createdAt: daysAgo(8),
  },
  {
    title: "Beyond the Horizon",
    description:
      "The unfiltered memoir of a refugee-turned-surgeon who rebuilt her life and career three times across three continents.",
    price: 7.99,
    genre: "Biography",
    coverImage: "https://picsum.photos/seed/beyond-horizon/400/600",
    writerName: "Nadia Hassan",
    writerEmail: "nadia.hassan@fable.com",
    status: "published",
    sales: 58,
    createdAt: daysAgo(20),
  },
  {
    title: "Atomic Habits Reborn",
    description:
      "A practical, no-fluff guide to rebuilding your daily routines around tiny, compounding wins instead of willpower.",
    price: 5.49,
    genre: "Self-Help",
    coverImage: "https://picsum.photos/seed/atomic-habits-reborn/400/600",
    writerName: "Owen Fischer",
    writerEmail: "owen.fischer@fable.com",
    status: "published",
    sales: 415,
    createdAt: daysAgo(3),
  },
  {
    title: "Shadows of Deceit",
    description:
      "A forensic accountant stumbles onto a money trail that leads straight to the people who hired her to find it.",
    price: 5.99,
    genre: "Thriller",
    coverImage: "https://picsum.photos/seed/shadows-deceit/400/600",
    writerName: "Ariana Cole",
    writerEmail: "ariana.cole@fable.com",
    status: "published",
    sales: 147,
    createdAt: daysAgo(15),
  },
  {
    title: "The Last Letter",
    description:
      "After her grandmother's death, a woman finds a stack of unsent letters that rewrite everything she thought she knew about her family.",
    price: 3.49,
    genre: "Fiction",
    coverImage: "https://picsum.photos/seed/last-letter/400/600",
    writerName: "Maya Patel",
    writerEmail: "maya.patel@fable.com",
    status: "published",
    sales: 93,
    createdAt: daysAgo(6),
  },
  {
    title: "Crimson Tide Rising",
    description:
      "A coastal town's fishing season turns deadly when something ancient wakes up in the deep trench just offshore.",
    price: 4.99,
    genre: "Mystery",
    coverImage: "https://picsum.photos/seed/crimson-tide/400/600",
    writerName: "Devon Marsh",
    writerEmail: "devon.marsh@fable.com",
    status: "published",
    sales: 67,
    createdAt: daysAgo(25),
  },
  {
    title: "Paper Hearts",
    description:
      "An origami artist and a failing letter-writing app founder team up to save both their crafts from going extinct.",
    price: 3.99,
    genre: "Romance",
    coverImage: "https://picsum.photos/seed/paper-hearts/400/600",
    writerName: "Sofia Reyes",
    writerEmail: "sofia.reyes@fable.com",
    status: "published",
    sales: 121,
    createdAt: daysAgo(4),
  },
  {
    title: "Quantum Drift",
    description:
      "A physicist discovers her experiments are leaking into parallel timelines, and one of them is actively trying to stop her.",
    price: 6.99,
    genre: "Sci-Fi",
    coverImage: "https://picsum.photos/seed/quantum-drift/400/600",
    writerName: "Devon Marsh",
    writerEmail: "devon.marsh@fable.com",
    status: "published",
    sales: 178,
    createdAt: daysAgo(9),
  },
  {
    title: "The Ember Throne",
    description:
      "Exiled from her own kingdom, a fire-mage princess must raise an army of outcasts to reclaim a throne built on lies.",
    price: 6.49,
    genre: "Fantasy",
    coverImage: "https://picsum.photos/seed/ember-throne/400/600",
    writerName: "Liora Bennett",
    writerEmail: "liora.bennett@fable.com",
    status: "published",
    sales: 256,
    createdAt: daysAgo(18),
  },
  {
    title: "Hollow Static",
    description:
      "A late-night radio host starts receiving calls from listeners who, according to public record, died years ago.",
    price: 4.49,
    genre: "Horror",
    coverImage: "https://picsum.photos/seed/hollow-static/400/600",
    writerName: "Caleb Storm",
    writerEmail: "caleb.storm@fable.com",
    status: "published",
    sales: 102,
    createdAt: daysAgo(7),
  },
  {
    title: "The Founder's Notebook",
    description:
      "An honest, occasionally brutal account of building and losing two startups before finally getting it right on the third.",
    price: 7.49,
    genre: "Biography",
    coverImage: "https://picsum.photos/seed/founders-notebook/400/600",
    writerName: "Nadia Hassan",
    writerEmail: "nadia.hassan@fable.com",
    status: "published",
    sales: 84,
    createdAt: daysAgo(14),
  },
  {
    title: "Deep Work, Deeper Rest",
    description:
      "A short, practical framework for protecting focused work time while avoiding the burnout that usually follows it.",
    price: 4.99,
    genre: "Self-Help",
    coverImage: "https://picsum.photos/seed/deep-work-rest/400/600",
    writerName: "Owen Fischer",
    writerEmail: "owen.fischer@fable.com",
    status: "published",
    sales: 199,
    createdAt: daysAgo(11),
  },
  {
    title: "The Informant's Daughter",
    description:
      "Years after her father vanished from witness protection, a journalist starts receiving the same threats he once did.",
    price: 5.49,
    genre: "Thriller",
    coverImage: "https://picsum.photos/seed/informants-daughter/400/600",
    writerName: "Sofia Reyes",
    writerEmail: "sofia.reyes@fable.com",
    status: "published",
    sales: 143,
    createdAt: daysAgo(10),
  },
  {
    title: "Salt and Light",
    description:
      "Three sisters return to their childhood lighthouse one last summer before it's sold, and dig up more than memories.",
    price: 3.49,
    genre: "Fiction",
    coverImage: "https://picsum.photos/seed/salt-and-light/400/600",
    writerName: "Sofia Reyes",
    writerEmail: "sofia.reyes@fable.com",
    status: "published",
    sales: 71,
    createdAt: daysAgo(22),
  },
  {
    title: "The Glass Orchard",
    description:
      "A blind botanist inherits an impossible greenhouse where every plant seems to remember the people who once tended it.",
    price: 5.99,
    genre: "Fantasy",
    coverImage: "https://picsum.photos/seed/glass-orchard/400/600",
    writerName: "Liora Bennett",
    writerEmail: "liora.bennett@fable.com",
    status: "published",
    sales: 167,
    createdAt: daysAgo(16),
  },
  {
    title: "Static Horizon",
    description:
      "A satellite repair crew loses contact with Earth mid-mission, and the silence on the radio turns out not to be empty.",
    price: 6.99,
    genre: "Sci-Fi",
    coverImage: "https://picsum.photos/seed/static-horizon/400/600",
    writerName: "Owen Fischer",
    writerEmail: "owen.fischer@fable.com",
    status: "published",
    sales: 220,
    createdAt: daysAgo(13),
  },
];

async function seed() {
  try {
    await client.connect();
    const db = client.db("fable");
    const ebooks = db.collection("ebooks");

    if (process.argv.includes("--reset")) {
      const del = await ebooks.deleteMany({});
      console.log(`Cleared ${del.deletedCount} existing ebook(s).`);
    }

    const result = await ebooks.insertMany(ebooksData);
    console.log(`Inserted ${result.insertedCount} ebooks into "fable.ebooks".`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    await client.close();
  }
}

seed();