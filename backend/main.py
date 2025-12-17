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
from datetime import datetime, timedelta
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
    """Get current weather snapshot and hourly timeline data for a given city."""
    print(f"DEBUG: get_weather tool called for location: {location}")
    
    # 1. Geocoding
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
        timezone = geo_data["results"][0].get("timezone", "UTC")

        # 2. Fetch Weather Data (Past 1 day + Forecast 2 days = ~72 hours total)
        weather_url = "https://api.open-meteo.com/v1/forecast"
        weather_params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": ["temperature_2m", "weathercode", "relative_humidity_2m", "apparent_temperature", "is_day", "wind_speed_10m"],
            "timezone": timezone,
            "past_days": 1, # Get yesterday's data
            "forecast_days": 2 # Get today and tomorrow's forecast
        }

        weather_response = requests.get(weather_url, params=weather_params, timeout=10)
        weather_data = weather_response.json()
        
        hourly_raw = weather_data.get("hourly", {})
        times = hourly_raw.get("time", [])
        temps = hourly_raw.get("temperature_2m", [])
        codes = hourly_raw.get("weathercode", [])
        humidities = hourly_raw.get("relative_humidity_2m", [])
        feels_likes = hourly_raw.get("apparent_temperature", [])
        is_days = hourly_raw.get("is_day", [])
        wind_speeds = hourly_raw.get("wind_speed_10m", [])


        # Helper to map codes to text
        def get_condition_text(code):
            if code == 0: return "Clear sky"   
            elif 1<=code<=3: return "Mainly clear, partly cloudy, and overcast"
            elif 45<=code<=48: return "Fog and depositing rime fog"
            elif 51<=code<=57: return "Drizzle: Light, moderate, and dense intensity"
            elif 61<=code<=67: return "Rain: Slight, moderate and heavy intensity"
            elif 71<=code<=77: return "Snow fall: Slight, moderate, and heavy intensity"
            elif 80<=code<=82: return "Rain showers: Slight, moderate, and violent"
            elif 85<=code<=86: return "Snow showers slight and heavy"
            elif 95<=code<=99: return "Thunderstorm: Slight or moderate"
            return "Unknown"


        # 3. Process Hourly Data into a Clean List (timeline_data)
        timeline_data = []
        
        # We need to find the index that corresponds to "now"
        # Since the API returns ISO strings like "2023-10-27T10:00", we can match strings.
        # However, it's safer to parse datetime.
        current_time_dt = datetime.now()
        current_index = -1 
        min_time_diff = float('inf')

        for i, t in enumerate(times):
            # Parse time string to datetime object
            # Format is usually ISO 8601 (YYYY-MM-DDThh:mm)
            dt_obj = datetime.fromisoformat(t)
            
            # Find the closest time to now
            time_diff = abs((dt_obj - current_time_dt).total_seconds())
            if time_diff < min_time_diff:
                min_time_diff = time_diff
                current_index = i

            timeline_data.append({
                "time": t,
                "temp": temps[i],
                "condition": get_condition_text(codes[i]),
                "weather_code": codes[i],
                "humidity": humidities[i],
                "feels_like": feels_likes[i],
                "is_day": is_days[i],
                "wind_speed": wind_speeds[i]
            })
        
        # Fallback if calculation failed (shouldn't happen if data exists)
        if current_index == -1:
            current_index = 0

        # 4. Extract Current Weather Snapshot
        current_snapshot = {}
        if timeline_data:
            snapshot_data = timeline_data[current_index]
            current_snapshot = {
                "city": city_name,
                "condition": snapshot_data["condition"],
                "temp": snapshot_data["temp"],
                "feels_like": snapshot_data["feels_like"],
                "humidity": snapshot_data["humidity"],
                "wind_speed": snapshot_data["wind_speed"],
                "time_of_day": "DAY" if snapshot_data["is_day"] == 1 else "NIGHT",
                "weather_code": snapshot_data["weather_code"]
            }

        # 5. Calculate Trends (Now vs Yesterday Same Time)
        trend_text = "No past data for comparison"
        if current_index >= 24: # Ensure there's data from 24 hours ago
            past_snapshot = timeline_data[current_index - 24]
            past_temp = past_snapshot["temp"]
            current_temp = current_snapshot.get("temp")
            
            if current_temp is not None and past_temp is not None:
                diff = current_temp - past_temp
                if diff > 1:
                    trend_text = f"{int(abs(diff))}° Warmer than yesterday"
                elif diff < -1:
                    trend_text = f"{int(abs(diff))}° Colder than yesterday"
                else:
                    trend_text = "Similar to yesterday"
        
        return {
            "city": city_name,
            "timezone": timezone,
            "current_index": current_index, 
            "trend": trend_text,
            "current_snapshot": current_snapshot, 
            "timeline_data": timeline_data       
        }
    
    except Exception as e:
        print(f"Error retrieving weather data for {location}: {str(e)}")
        # import traceback
        # traceback.print_exc()
        return {"error": f"Error retrieving weather data for {location}: {str(e)}"}
        
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

# --- NARRATOR SETUP ---
narrator_llm = ChatOpenAI(
    api_key=openrouter_api_key,
    base_url="https://openrouter.ai/api/v1",
    model="kwaipilot/kat-coder-pro:free", 
    temperature=0.7, 
)

narrator_prompt_template = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a concise and witty weather narrator. Summarize the provided weather data in a single, engaging sentence (max 20 words). Focus on key changes or implications. E.g., 'Expect a warm and sunny day, perfect for outdoor activities!' or 'A cold front is moving in, so bundle up!'"),
        ("human", "Here is the weather data: {weather_json}"),
    ]
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

class BriefingRequest(BaseModel):
    weather_data: dict


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


@app.post("/narrate")
async def narrate_endpoint(request: BriefingRequest):
    try:
        # Convert relevant weather data to a concise string for the LLM
        summary_data = {
            "city": request.weather_data.get("city"),
            "current_snapshot": request.weather_data.get("current_snapshot"),
            "trend": request.weather_data.get("trend")
        }
        
        narrative_response = narrator_llm.invoke(
            narrator_prompt_template.format_messages(weather_json=json.dumps(summary_data))
        )
        
        return {"briefing": narrative_response.content}
    except Exception as e:
        print(f"Narrate Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    return {"message": "Weather Chat API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)