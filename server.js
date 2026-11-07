const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Nodemailer Transporter Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'finditadmin@gmail.com',
    pass: process.env.EMAIL_PASS || 'your_email_app_password'
  }
});

// MongoDB Connection & Auto Expiration Check
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://...', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB connected successfully');
  await User.findOneAndUpdate(
    { email: 'finditadmin@gmail.com' },
    { name: 'System Admin', password: 'password123', role: 'Admin' },
    { upsert: true, new: true }
  );
}).catch(err => console.error('MongoDB connection error:', err));

// Schemas with Reset Code Fields
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Student' },
  resetCode: String,
  resetCodeExpires: Date
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
    submitterEmail: String,
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

// Auth Routes: Step 1 - Request Forgot Password Code
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'No account found with this email address.' });

    // Generate a random 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = verificationCode;
    user.resetCodeExpires = Date.now() + 15 * 60 * 1000; // Code valid for 15 minutes
    await user.save();

    // Send email via Nodemailer
    const mailOptions = {
      from: '"FindIt Security" <finditadmin@gmail.com>',
      to: user.email,
      subject: '[FindIt] Password Reset Verification Code',
      text: `Hello ${user.name},\n\nYou requested a password reset for your FindIt account.\nYour verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.`
    };

    transporter.sendMail(mailOptions, (mailErr) => {
      if (mailErr) console.error('Email error:', mailErr);
    });

    res.json({ message: 'Verification code sent to your email successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Routes: Step 2 - Verify Code & Update Password
app.post('/api/auth/verify-reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.resetCode !== code || user.resetCodeExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful! You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Account Settings Route
app.patch('/api/auth/update-account', async (req, res) => {
  try {
    const { currentEmail, newEmail, newPassword } = req.body;
    if (newEmail && newEmail.toLowerCase() !== currentEmail.toLowerCase()) {
      const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
      if (existingUser) return res.status(400).json({ error: 'New email address is already registered.' });
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
    res.json({ user: { name: updatedUser.name, email: updatedUser.email, role: updatedUser.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Item Routes
app.get('/api/items', async (req, res) => {
  try {
    const { category, status, search, sort, userEmail } = req.query;
    let query = {};
    if (category && category !== 'All Items') query.category = category;
    if (status && status !== 'All') query.status = status;
    if (userEmail) query['claimProof.submitterEmail'] = userEmail.toLowerCase();
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }
    
    const sortOrder = sort === 'oldest' ? 1 : -1;
    const items = await Item.find(query).sort({ _id: sortOrder });
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
    const { submittedBy, submitterEmail, proofText } = req.body;
    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      { status: 'Claim Pending', claimProof: { submittedBy, submitterEmail, proofText } },
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
    
    if (updated.claimProof && updated.claimProof.submitterEmail) {
      const mailOptions = {
        from: '"FindIt Campus Security" <finditadmin@gmail.com>',
        to: updated.claimProof.submitterEmail,
        subject: `[FindIt] Your claim for "${updated.title}" has been verified!`,
        text: `Hello ${updated.claimProof.submittedBy},\n\nYour claim for "${updated.title}" has been verified by Security.\nPlease visit the Campus Security Desk to retrieve your item.`
      };
      transporter.sendMail(mailOptions, (err) => { if (err) console.error(err); });
    }

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