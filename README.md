# AI-Powered Weather Application

An intelligent weather application that uses an AI agent to process natural language queries and provide weather information with dynamic, condition-based UI theming.

## Features

- **Natural Language Processing**: Ask weather questions in plain English
- **AI-Powered Agent**: LangChain-based agent processes queries intelligently
- **Dynamic UI Theming**: Background changes based on weather conditions
- **Real-time Weather Data**: Live weather information for any city worldwide
- **Robust Error Handling**: Graceful handling of API failures and edge cases
- **Modern Tech Stack**: FastAPI backend with React frontend

## Technologies Used

### Backend
- **FastAPI**: Modern Python web framework
- **LangChain**: AI agent orchestration
- **OpenRouter**: LLM API
- **Requests**: Weather API integration

### Frontend
- **React**: UI framework
- **Vite**: Build tool and dev server
- **Axios**: HTTP client
- **CSS3**: Dynamic styling based on weather conditions

## Prerequisites

- **Node.js** 16+ (for frontend)
- **Python** 3.9+ (for backend)
- **OpenRouter API Key**: Get one from [OpenRouter.ai](https://openrouter.ai/keys)

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment (recommended)**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   # Copy the example file
   cp api.env.example api.env
   
   # Edit api.env and add your OpenRouter API key
   # OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```

5. **Run the backend server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

   The application will open at `http://localhost:5173`

## Screenshots

### Tokyo Weather
![Tokyo Weather](screenshots/tokyo.png)

### Mumbai Weather
![Mumbai Weather](screenshots/mumbai.png)

### New York Weather
![New York Weather](screenshots/new%20york.png)

### Pune Weather
![Pune Weather](screenshots/pune.png)

### London Weather
![London Weather](screenshots/london.png)

## Project Structure

```
WeatherApp/
├── backend/
│   ├── main.py              # FastAPI application and agent logic
│   ├── requirements.txt     # Python dependencies
│   └── api.env             # Environment variables 
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── App.css         # Styling with dynamic themes
│   │   └── main.jsx        # React entry point
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
├── screenshots/            # Application screenshots
└── README.md              # This file
```

## How It Works

1. **User Input**: User enters a natural language query (e.g., "What's the weather in Tokyo?")
2. **AI Agent Processing**: LangChain agent parses the query and extracts the city name
3. **Weather API Call**: Backend fetches real-time weather data
4. **Response Generation**: AI formats the weather information in a user-friendly way
5. **Dynamic UI**: Frontend updates background and styling based on weather conditions

## API Endpoints

### POST `/chat`
Processes natural language weather queries

**Request Body:**
```json
{
  "message": "What's the weather in London?"
}
```

**Response:**
```json
{
  "response": "The weather in London is currently 15°C with partly cloudy skies..."
}
```

## Environment Variables

Create `backend/api.env` with the following:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## Troubleshooting

**Backend won't start:**
- Ensure Python 3.9+ is installed
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify your API key is correctly set in `api.env`

**Frontend won't connect:**
- Ensure backend is running on port 8000
- Check console for CORS errors
- Verify the API URL in `App.jsx` points to `http://localhost:8000`

**Weather data not loading:**
- Check your internet connection
- Verify the OpenRouter API key is valid
- Check backend logs for error messages
