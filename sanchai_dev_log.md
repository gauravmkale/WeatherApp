# SanchAI Analytics - Tech Assessment Development Log

## Project Overview
**Goal:** Build a minimal web application for weather lookup.
**Stack Requirements:**
*   **Frontend:** React
*   **Backend:** FastAPI
*   **AI Engine:** LangChain + LLM (via OpenRouter)
*   **Feature:** Weather tool integration.
*   **Deadline:** 1 week.

## Development Journey

### Phase 1: Backend Setup & LLM Integration (FastAPI + LangChain + OpenRouter)

#### **1. Initial Setup & Environment**
*   **Action:** Created `sanchai_assessment/backend` directory.
*   **Action:** Installed dependencies: `fastapi`, `uvicorn`, `langchain`, `langchain-openai`, `python-dotenv`, `requests`.
*   **Action:** Created `api.env` file in `sanchai_assessment/backend` for API keys.

#### **2. LangChain "Hello World" (Initial Test)**
*   **Goal:** Verify basic LLM connectivity via LangChain and OpenRouter.
*   **File:** `sanchai_assessment/backend/hello_langchain.py`
*   **Challenges:**
    *   **API Key Loading:** Initial issues with `load_dotenv()` not finding `.env` (due to being `api.env`) and `OPENAI_API_KEY` vs `OPENROUTER_API_KEY` confusion.
    *   **Solution:** Explicitly set `dotenv_path` in `load_dotenv()` and added `os.environ["OPENAI_API_KEY"] = openrouter_api_key` as a safeguard for `langchain-openai`'s underlying client.
    *   **Model Availability:** Some free models (`meta-llama/llama-3-8b-instruct:free`, `google/gemma-7b-it:free`) were unavailable or returned 404 errors on OpenRouter.
    *   **Solution:** Switched to more reliable free models like `google/gemini-2.0-flash-lite-preview-02-05:free`.
*   **Status:** Successfully sent prompts to LLM via OpenRouter and received responses.

#### **3. FastAPI Backend Integration & Agent (Initial ReAct Attempt)**
*   **Goal:** Build FastAPI backend with a LangChain Agent and a mock weather tool.
*   **File:** `sanchai_assessment/backend/main.py`
*   **Key Components Implemented:**
    *   FastAPI app with `CORSMiddleware`.
    *   `StructuredTool.from_function` for `get_weather` mock tool.
    *   `create_react_agent` for the agent, using a custom ReAct prompt template.
    *   `/chat` endpoint invoking the `AgentExecutor`.
*   **Challenges:**
    *   **`AttributeError: 'function' object has no attribute 'name'`:** Initially, the `@tool` decorator or list passing was incorrect.
    *   **Solution:** Explicitly created `Tool` objects using `StructuredTool.from_function` to ensure proper LangChain tool registration.
    *   **Model Hallucination/Parsing Errors (ReAct vs. Tool Calling):** When querying "Paris" (an unknown city to the mock tool), the `create_react_agent` with Gemini 2.0 Flash led to JSON outputs and parsing errors, followed by hallucinated answers. The model was trying to use native function calling despite being instructed for ReAct.
    *   **Mistake Identified:** Using `create_react_agent` with modern, powerful models like Gemini 2.0 Flash (which are heavily tuned for native function calling/tool calling) is a mismatch. These models prefer structured JSON for tool calls, not text-based ReAct.
    *   **Lesson Learned:** ReAct is suitable for simpler or older models, or when explicit text-based reasoning is desired. For modern, capable models, **native Tool Calling is the "latest technology" and more robust.**

#### **4. Backend Refinement: Embracing Modern Tool Calling**
*   **Action:** Switched from `create_react_agent` to `create_tool_calling_agent`.
*   **Action:** Simplified the prompt template to leverage `MessagesPlaceholder` for internal tool interaction history, as required by `create_tool_calling_agent`.
*   **Action:** Confirmed model to `google/gemini-2.0-flash-lite-preview-02-05:free` for optimal tool-calling performance on the free tier.
*   **Result:** The agent now reliably calls the `get_weather` tool, handles unknown cities gracefully (by reporting `DATA_MISSING`), and provides structured outputs.

#### **5. Model Selection Research**
*   **Action:** Conducted a search for the best free models on OpenRouter with native tool calling support.
*   **Findings:**
    *   `google/gemini-2.0-flash-lite-preview-02-05:free`: Best overall (Fast, Native Tool Calling).
    *   `openai/gpt-oss-120b:free`: Strong reasoning alternative.
    *   `mistralai/mistral-small`: Good but potentially less consistent for tool calling than Gemini.
*   **Decision:** Stuck with **Gemini 2.0 Flash** as the primary engine.

### Phase 2: Frontend Implementation (React + Vite)

#### **1. Setup & Connectivity**
*   **Action:** Initialized React project with Vite.
*   **Action:** Connected Frontend to Backend using `axios`.
*   **Result:** Frontend successfully sends user input to `localhost:8000/chat` and receives the bot's response.

#### **2. Search Interface Implementation**
*   **Action:** Implemented a "Search Mode" UX instead of a traditional chat history.
*   **Logic:** The `messages` state is cleared/overwritten on every new request. This ensures the UI displays only the result for the current city, keeping the interface clean.
*   **Status:** Working.

#### **3. Feature: Dynamic Mood Theming**
*   **Action:** Implemented dynamic background gradients based on the weather temperature.
*   **Logic:** 
    *   Frontend parses the bot's text response using Regex (`(-?\d+(\.\d+)?)°C`) to extract the temperature.
    *   Sets a CSS class on the main container based on ranges:
        *   `cold`: <= 15°C (Blue/Cyan)
        *   `pleasant`: 15-25°C (Green/Teal)
        *   `hot`: > 25°C (Orange/Red)
*   **Status:** Working.

## Current Status
*   **Backend:** Functional (FastAPI + LangChain). Uses `kwaipilot/kat-coder-pro:free` via OpenRouter.
*   **Frontend:** Functional (React). Search interface with dynamic mood theming implemented.
*   **Overall:** The core requirement of a "minimal web application for weather lookup" is largely met.

## Known Issues
*   **"New York" Ambiguity:** Queries for "New York" sometimes result in the LLM returning two conflicting weather reports in a single response (e.g., one for NYC and one for another location). This can confuse the user and the temperature parser.
    *   *Next Step:* Debug backend `get_weather` logic to handle multiple geocoding results or prompt the LLM to be more specific.

## Next Steps
1.  **Refine Backend:** Address the "New York" ambiguity issue.
2.  **Deployment:** (Optional) Prepare for deployment if required.