const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Ties every task strictly to a specific user
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  priority: { 
  type: String, 
  enum: ['low', 'medium', 'high'],  // 👈 lowercase
  default: 'medium' 
},
  category: { type: String, default: '' },
  dueDate: { type: Date },
  status: { 
  type: String, 
  enum: ['todo', 'inprogress', 'done'],  // 👈 no spaces
  default: 'todo' 
}
}, { timestamps: true }); // Automatically handles createdAt and updatedAt!

module.exports = mongoose.model('Task', taskSchema);
