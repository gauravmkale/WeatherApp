# SanchAI Weather Application
AI-powered weather application with agentic backend

This project implements a minimal web application for weather lookup using a FastAPI backend, a React frontend, and an AI agent for processing natural language queries.

## Features

- Weather lookup for any city.
- Dynamic background theming based on weather conditions.
- Robust error handling for API calls.

## Technologies Used

- **Backend:** FastAPI, LangChain, OpenRouter, Requests
- **Frontend:** React, Vite, Axios
- **LLM:** Kwaipilot/kat-coder-pro:free (via OpenRouter)

## Setup Instructions

### Prerequisites

- Node.js (for frontend)
- Python 3.9+ (for backend)
- `pip` and `npm` or `yarn` package managers

### Backend Setup

1.  Navigate to the `backend` directory: `cd sanchai_assessment/backend`
2.  Create a `.env` file named `api.env` and add your OpenRouter API key:
    ```
    OPENROUTER_API_KEY="sk-YOUR_OPENROUTER_API_KEY"
    ```
3.  Install Python dependencies: `pip install -r requirements.txt` (or `pip install fastapi uvicorn langchain langchain-openai python-dotenv requests`)
4.  Run the backend server: `uvicorn main:app --reload --port 8000`

### Frontend Setup

1.  Navigate to the `frontend` directory: `cd sanchai_assessment/frontend`
2.  Install Node.js dependencies: `npm install`
3.  Run the frontend development server: `npm run dev`

The application should now be accessible in your browser, typically at `http://localhost:5173`.

## Screenshots

*(Placeholder for screenshots - you can add them to the `screenshots/` directory and link them here)*

## How to Share (Temporary - using ngrok)

1.  Ensure both frontend and backend are running locally.
2.  Install ngrok: `brew install ngrok` (or download from ngrok.com)
3.  In separate terminals, expose your local servers:
    *   `ngrok http 5173` (for frontend)
    *   `ngrok http 8000` (for backend)
4.  Copy the public URL for your backend from ngrok (e.g., `https://XXXX-YYYY-ZZZZ.ngrok-free.app`).
5.  In `sanchai_assessment/frontend/src/App.jsx`, update the `axios.post` URL from `http://localhost:8000/chat` to your backend's ngrok URL.
6.  Share the public URL for your frontend (from `ngrok http 5173`) with your team.