const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://...', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB connected successfully');
  // Secure Admin Upsert
  await User.findOneAndUpdate(
    { email: 'finditadmin@gmail.com' },
    { name: 'System Admin', password: 'password123', role: 'Admin' },
    { upsert: true, new: true }
  );
}).catch(err => console.error('MongoDB connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Student' }
});
const User = mongoose.model('User', userSchema);

const itemSchema = new mongoose.Schema({
  title: String,
  category: String,
  status: { type: String, default: 'Found' },
  location: String,
  description: String,
  postedBy: String,
  imageUrl: String,
  dateLostOrFound: String,
  claimProof: {
    submittedBy: String,
    proofText: String
  }
});
const Item = mongoose.model('Item', itemSchema);

// Auth Routes: Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ error: 'Email already registered' });

    user = new User({ 
      name, 
      email: email.toLowerCase(), 
      password, 
      role: email.toLowerCase() === 'finditadmin@gmail.com' ? 'Admin' : (role || 'Student') 
    });
    await user.save();
    res.json({ user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Routes: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), password });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });
    res.json({ user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Routes: Update Account (Change Email & Password)
app.patch('/api/auth/update-account', async (req, res) => {
  try {
    const { currentEmail, newEmail, newPassword } = req.body;
    
    if (newEmail && newEmail.toLowerCase() !== currentEmail.toLowerCase()) {
      const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'New email address is already registered.' });
      }
    }

    const updateFields = {};
    if (newEmail) updateFields.email = newEmail.toLowerCase();
    if (newPassword) updateFields.password = newPassword;

    const updatedUser = await User.findOneAndUpdate(
      { email: currentEmail.toLowerCase() },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: 'User account not found.' });

    res.json({
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Routes: Reset Password (Forgot Password)
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: 'No account found associated with this email.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successful! You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Item Routes
app.get('/api/items', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    if (category && category !== 'All Items') query.category = category;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }
    const items = await Item.find(query).sort({ _id: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const newItem = new Item(req.body);
    await newItem.save();
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/items/:id/claim', async (req, res) => {
  try {
    const { submittedBy, proofText } = req.body;
    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      { status: 'Claim Pending', claimProof: { submittedBy, proofText } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/items/:id/resolve', async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));