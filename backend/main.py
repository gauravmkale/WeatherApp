import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.tools import StructuredTool
from dotenv import load_dotenv
from pathlib import Path
import requests

script_dir = Path(__file__).parent
env_path = script_dir / 'api.env'
load_dotenv(dotenv_path=env_path)

openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

# Check for API key presence
if openrouter_api_key:
    print("OPENROUTER_API_KEY successfully loaded from environment variables or .env file.")
    os.environ["OPENAI_API_KEY"] = openrouter_api_key
else:
    print("Warning: OPENROUTER_API_KEY not found in environment variables or .env file.")
    exit(1)


def get_weather(location: str):
    """Get the current weather for a given city"""
    print(f"DEBUG: get_weather tool called for location: {location}")
    
    geo_url = "https://geocoding-api.open-meteo.com/v1/search"
    geo_params = {"name": location, "count": 1, "language": "en", "format": "json"}

    try:
        geo_response = requests.get(geo_url, params=geo_params, timeout=10)
        geo_data = geo_response.json()

        if not geo_data.get("results"):
            return {"error": f"Could not find location: {location}"}
        
        lat = geo_data["results"][0]["latitude"]
        lon = geo_data["results"][0]["longitude"]
        city_name = geo_data["results"][0]["name"]

        weather_url = "https://api.open-meteo.com/v1/forecast"
        weather_params = {
            "latitude": lat,
            "longitude": lon,
            "current": ["temperature_2m", "weathercode", "relative_humidity_2m", "wind_speed_10m", "apparent_temperature", "is_day"],
        }

        weather_response = requests.get(weather_url, params=weather_params, timeout=10)
        weather_data = weather_response.json()
        current = weather_data.get("current", {})
        
        temp = current.get("temperature_2m")
        code = current.get("weathercode")
        humidity = current.get("relative_humidity_2m")
        wind_speed = current.get("wind_speed_10m")
        feels_like = current.get("apparent_temperature")
        is_day = current.get("is_day", 1)  # 1 = day, 0 = night

        condition = "Unknown"
        if code == 0: condition = "Clear sky"   
        elif 1<=code<=3: condition = "Mainly clear, partly cloudy, and overcast"
        elif 45<=code<=48: condition = "Fog and depositing rime fog"
        elif 51<=code<=57: condition = "Drizzle: Light, moderate, and dense intensity"
        elif 61<=code<=67: condition = "Rain: Slight, moderate and heavy intensity"
        elif 71<=code<=77: condition = "Snow fall: Slight, moderate, and heavy intensity"
        elif 80<=code<=82: condition = "Rain showers: Slight, moderate, and violent"
        elif 85<=code<=86: condition = "Snow showers slight and heavy"
        elif 95<=code<=99: condition = "Thunderstorm: Slight or moderate"

        # Return DICTIONARY directly.
        # With return_direct=True, this Dict is sent as the API response.
        return {
            "city": city_name,
            "condition": condition,
            "temp": temp,
            "feels_like": feels_like,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "time_of_day": "DAY" if is_day == 1 else "NIGHT"
        }
    
    except Exception as e:
        return {"error": f"Error retrieving weather data: {str(e)}"}
        
weather_tool = StructuredTool.from_function(
    func=get_weather,
    name="get_weather",
    description="Get the current weather for a specific city. The input should be the city name.",
    return_direct=True # FAST MODE: Skip 2nd LLM call
)

llm = ChatOpenAI(
    api_key=openrouter_api_key,
    base_url="https://openrouter.ai/api/v1",
    model="kwaipilot/kat-coder-pro:free",
    temperature=0,
)

# Simplified prompt since we don't need the LLM to format anything.
# It just needs to call the tool.
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a weather assistant. Call the 'get_weather' tool for the user's location."),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ]
)

tools = [weather_tool]

agent = create_tool_calling_agent(llm, tools, prompt)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True,
    max_iterations=3,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        response = agent_executor.invoke({
            "input": request.message,
            "chat_history": []
        })
        # response["output"] will be the DICT returned by get_weather
        return {"response": response["output"]}
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    return {"message": "Weather Chat API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
