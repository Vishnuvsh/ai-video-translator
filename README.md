# AI Video Translator

A full-stack web application to translate videos into any language. This is Phase 1, focusing on creating the foundation of the project.

## Project Overview

This project consists of:
- **Frontend**: A React application built with Vite and styled with Tailwind CSS.
- **Backend**: A Python REST API built with FastAPI.

## Technologies Used

- **Frontend**: React, Vite, Tailwind CSS, Axios
- **Backend**: Python 3.12, FastAPI, Pydantic, Uvicorn

## Folder Structure

```
ai-video-translator/
├── frontend/             # React application (Vite)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application views
│   │   ├── services/     # API integration logic
│   │   ├── App.jsx       # Main application component
│   │   ├── main.jsx      # Application entry point
│   │   └── index.css     # Global styles and Tailwind imports
│   ├── package.json      # Frontend dependencies
│   ├── tailwind.config.js# Tailwind configuration
│   └── .env.example      # Example frontend environment variables
│
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── main.py       # FastAPI application entry point
│   │   ├── config.py     # Application configuration
│   │   └── routes/       # API endpoints
│   │       └── health.py # Health check endpoint
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Example backend environment variables
│
└── README.md             # Project documentation
```

## Setup Instructions

### Backend Installation

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

### Frontend Installation

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

## Running the Application

### Start Backend

1. Ensure your virtual environment is activated in the `backend` directory.
2. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will be available at `http://localhost:8000`.
   You can view the interactive API documentation at `http://localhost:8000/docs`.

### Start Frontend

1. In the `frontend` directory, start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## Testing Frontend-Backend Communication

1. Start both the backend and frontend servers as described above.
2. Open the frontend in your browser (`http://localhost:5173`).
3. You should see a status indicator showing "Backend Connected ✓".
   - If the backend is not running or there is a CORS issue, it will show "Backend Connection Failed".
4. The frontend verifies connection by sending a `GET` request to the backend's `/api/health/` endpoint on startup.
