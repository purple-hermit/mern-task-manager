const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const path = require('path');

const User = require('./models/User');
const Task = require('./models/Task');

const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many attempts, please try again later.' }
});

const app = express();
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5000',
  credentials: true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CONNECT TO MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// --- AUTHENTICATION MIDDLEWARE ---
// This checks if the user sending a request has a valid token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"
  
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user; // Attach the decoded user payload to the request
    next();
  });
};

// ==========================================
// AUTH ROUTES
// ==========================================

// Register
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    // Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({ email, password: hashedPassword });
    
    // Generate JWT
    const token = jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: newUser._id, email: newUser.email } });
    } catch (err) {
  console.error(err); // keep the real error in your server logs
  res.status(500).json({ error: 'Something went wrong' });
}
});

// Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // Compare provided password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email } });
    } catch (err) {
  console.error(err); // keep the real error in your server logs
  res.status(500).json({ error: 'Something went wrong' });
}
});

// ==========================================
// TASK ROUTES (Protected by authenticateToken)
// ==========================================

// Get all tasks for the logged-in user
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    // Only find tasks where the 'user' field matches the token's user ID
    const { status, search } = req.query;
    const query = { user: req.user.id };

    if (status && ['todo', 'inprogress', 'done'].includes(status)) {
      query.status = status;
    }
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    // Map _id to id so it matches our React frontend expectations
    const formattedTasks = tasks.map(t => ({ ...t.toObject(), id: t._id }));
    res.json(formattedTasks);
    } catch (err) {
  console.error(err); // keep the real error in your server logs
  res.status(500).json({ error: 'Something went wrong' });
}
});

// Create a new task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    const newTask = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      priority: priority || 'medium',
      category: category?.trim() || '',
      dueDate: dueDate || undefined,
      status: status || 'todo',
      user: req.user.id,
    });
    res.json({ ...newTask.toObject(), id: newTask._id });
    } catch (err) {
  console.error(err); // keep the real error in your server logs
  res.status(500).json({ error: 'Something went wrong' });
}
});

// Update a task (e.g., cycling status)
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, status } = req.body;
const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, description, priority, category, dueDate, status },
      { new: true, runValidators: true }
    );
    res.json({ ...updatedTask.toObject(), id: updatedTask._id });
    } catch (err) {
  console.error(err); // keep the real error in your server logs
  res.status(500).json({ error: 'Something went wrong' });
}
});

// Delete a task
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Task deleted' });
    } catch (err) {
  console.error(err); // keep the real error in your server logs
  res.status(500).json({ error: 'Something went wrong' });
}
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
