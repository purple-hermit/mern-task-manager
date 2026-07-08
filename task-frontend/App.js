import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, useMemo } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api';

// ==========================================
// 1. AUTHENTICATION CONTEXT (Now connected to Backend)
// ==========================================
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  // Check for existing session on mount (just checking if we have a token saved)
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (token && savedUser) {
      setUser({ ...JSON.parse(savedUser), token });
    }
  }, []);

  const register = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to register');

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setUser({ ...data.user, token: data.token });
      setError('');
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to login');

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setUser({ ...data.user, token: data.token });
      setError('');
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// 2. TASK CONTEXT & REDUCER (Now connected to Backend)
// ==========================================
const TaskContext = createContext();

const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TASKS':
      return action.payload;
    case 'ADD_TASK':
      return [action.payload, ...state];
    case 'UPDATE_TASK':
      return state.map(task => task.id === action.payload.id ? action.payload : task);
    case 'DELETE_TASK':
      return state.filter(task => task.id !== action.payload);
    default:
      return state;
  }
};

export const TaskProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [tasks, dispatch] = useReducer(taskReducer, []);

  // Fetch tasks from MongoDB when user logs in
  useEffect(() => {
    if (user && user.token) {
      fetch(`${API_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) dispatch({ type: 'SET_TASKS', payload: data });
      })
      .catch(err => console.error("Error fetching tasks:", err));
    }
  }, [user]);

  const addTask = useCallback(async (taskData) => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(taskData)
      });
      const newTask = await response.json();
      dispatch({ type: 'ADD_TASK', payload: newTask });
    } catch (err) {
      console.error("Error adding task:", err);
    }
  }, [user]);

  const cycleTaskStatus = useCallback(async (task) => {
    const flow = { 'To Do': 'In Progress', 'In Progress': 'Done', 'Done': 'To Do' };
    const nextStatus = flow[task.status];
    
    // Optimistic UI update (update frontend immediately)
    dispatch({ type: 'UPDATE_TASK', payload: { ...task, status: nextStatus } });

    // Send update to MongoDB in the background
    try {
      await fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (err) {
      console.error("Error updating task:", err);
      // If it fails, revert the change (simplified here)
      dispatch({ type: 'UPDATE_TASK', payload: task }); 
    }
  }, [user]);

  const deleteTask = useCallback(async (id) => {
    // Optimistic UI update
    dispatch({ type: 'DELETE_TASK', payload: id });

    // Delete from MongoDB
    try {
      await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  }, [user]);

  return (
    <TaskContext.Provider value={{ tasks, addTask, cycleTaskStatus, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};

// ==========================================
// 3. UI COMPONENTS (No changes needed here!)
// ==========================================

const AuthScreen = () => {
  const { login, register, error } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return alert("Password must be 6+ chars");
    isLogin ? await login(email, password) : await register(email, password);
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Sign In' : 'Register'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password (6+ chars)" required value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">{isLogin ? 'Login' : 'Create Account'}</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem', cursor: 'pointer', color: '#4f46e5' }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Need an account? Register" : "Have an account? Login"}
      </p>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { tasks, addTask, cycleTaskStatus, deleteTask } = useContext(TaskContext);
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      done: tasks.filter(t => t.status === 'Done').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || t.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [tasks, search, filterStatus]);

  const handleAddTask = (e) => {
    e.preventDefault();
    addTask({ title, description: desc, priority, category, dueDate });
    setTitle(''); setDesc(''); setCategory(''); setDueDate(''); setPriority('Medium');
  };

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1 style={{ margin: 0 }}>Task Master</h1>
          <small>Logged in as: {user.email}</small>
        </div>
        <button onClick={logout} className="danger">Logout</button>
      </header>

      <div className="stats-dashboard">
        <div className="stat-card">
          <h3>Total Tasks</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p>{stats.inProgress}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p>{stats.done}</p>
        </div>
      </div>

      <form className="task-form" onSubmit={handleAddTask}>
        <input type="text" placeholder="Task Title" required value={title} onChange={e => setTitle(e.target.value)} />
        <input type="text" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
        <select value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>
        <input type="text" placeholder="Category (e.g. Work)" value={category} onChange={e => setCategory(e.target.value)} />
        <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} />
        <button type="submit" style={{ gridColumn: 'span 2' }}>Add Task</button>
      </form>

      <div className="task-controls">
        <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>

      <div className="task-list">
        {filteredTasks.length === 0 ? <p>No tasks found.</p> : null}
        {filteredTasks.map(task => (
          <div key={task.id} className={`task-card priority-${task.priority}`}>
            <div className="task-info">
              <h4>{task.title}</h4>
              <div className="task-meta">
                {task.dueDate && <span>📅 {task.dueDate.substring(0, 10)}</span>}
                {task.category && <span>📁 {task.category}</span>}
                <span>⚡ {task.priority}</span>
              </div>
              <p className="task-desc">{task.description}</p>
            </div>
            <div className="task-actions">
              <button 
                className={`status-badge status-${task.status.replace(' ', '')}`}
                onClick={() => cycleTaskStatus(task)}
              >
                {task.status} ↻
              </button>
              <button className="danger" onClick={() => deleteTask(task.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN APP COMPONENT
// ==========================================
export default function App() {
  return (
    <AuthProvider>
      <AuthContext.Consumer>
        {({ user }) => (
          user ? (
            <TaskProvider>
              <Dashboard />
            </TaskProvider>
          ) : (
            <AuthScreen />
          )
        )}
      </AuthContext.Consumer>
    </AuthProvider>
  );
}
