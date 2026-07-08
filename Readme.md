# Full-Stack Task Management App

A full-stack task management web application built using the **MERN Stack** (MongoDB, Express.js, React.js, and Node.js). The application provides secure user authentication, task management functionality, and a responsive React frontend backed by a RESTful API.

---

## Features

- **Secure User Authentication**
  - JWT (JSON Web Tokens) for authentication
  - Password hashing using **bcrypt**

- **RESTful API**
  - Full CRUD operations for task management
  - Built using Express.js and Node.js

- **MongoDB Database**
  - Database modeling with **Mongoose**
  - Efficient schema validation and data management

- **Dynamic React Frontend**
  - Functional components
  - React Hooks (`useState`, `useEffect`)
  - Context API for global state management

---

## Tech Stack

### Frontend
- React.js
- Context API
- CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Authentication & Security
- JSON Web Tokens (JWT)
- bcrypt

---

## Project Structure

```
Task-Manager-App/
│
├── task-frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── task-backend/
│   ├── models/
│   ├── routes/
│   ├── public/
│   ├── Server.js
│   ├── package.json
│   └── ...
│
└── README.md
```

---

## Local Development Setup

### Prerequisites

Make sure the following are installed:

- Node.js (v18 or later recommended)
- npm
- MongoDB (Local installation or MongoDB Atlas)

---

# Backend Setup

Navigate to the backend directory:

```bash
cd task-backend
```

Install dependencies:

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file inside the `task-backend` directory.

Example:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### Start the Backend Server

```bash
node Server.js
```

The backend will start on:

```
http://localhost:5000
```

---

# Frontend Setup

Open a **new terminal** and navigate to the frontend directory:

```bash
cd task-frontend
```

Install dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm start
```

The frontend will be available at:

```
http://localhost:3000
```

---

## Application Flow

```
React Frontend (localhost:3000)
            │
            ▼
Express REST API (localhost:5000)
            │
            ▼
MongoDB Database
```

---

## API Features

- User Registration
- User Login
- JWT Authentication
- Create Task
- Read Tasks
- Update Task
- Delete Task

---

## Dependencies

### Backend

- express
- mongoose
- cors
- dotenv
- bcryptjs
- jsonwebtoken

### Frontend

- react
- react-dom
- react-router-dom
- axios

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key used to sign JWT tokens |
| `PORT` | Backend server port |

---

## Screenshots

You can add screenshots here.

Example:

```
screenshots/
├── login.png
├── dashboard.png
└── tasks.png
```

---