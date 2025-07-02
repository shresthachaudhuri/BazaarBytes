import os
import sys
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

# Add Backend folder to system path to import chatbot
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Backend'))

# Now, import the chatbot after appending the Backend folder to the sys path
from chatbot import CulturalEcommerceChatbot

# Define correct Frontend path (Mac-friendly)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "Frontend")

# FastAPI App Setup
app = FastAPI()

# Serve static files (CSS, JS, etc.)
app.mount("/static", StaticFiles(directory="/Users/shresthachaudhuri/Documents/BazaarBytes/Frontend"), name="static")

# Serve HTML files
@app.get("/", response_class=HTMLResponse)
def get_index():
    return FileResponse(os.path.join(FRONTEND_DIR, "index1.html"))

@app.get("/support", response_class=HTMLResponse)
def get_support():
    return FileResponse(os.path.join(FRONTEND_DIR, "support.html"))

# Chatbot Instance
chatbot = CulturalEcommerceChatbot()

# WebSocket Chat Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    user_id = "user1"
    logging.debug(f"WebSocket connection accepted for user {user_id}")

    try:
        while True:
            data = await websocket.receive_text()
            logging.debug(f"Received from {user_id}: {data!r}")

            try:
                chatbot.save_session(user_id, {"last_user_msg": data})
            except Exception:
                logging.error("Error saving session after user message", exc_info=True)

            try:
                response = await chatbot.handle_message(user_id, data)
            except Exception:
                logging.error("Error generating response", exc_info=True)
                response = {"message": "Oops! Something went wrong."}

            try:
                await websocket.send_json(response)
            except Exception:
                logging.error("Error sending response", exc_info=True)
                break

            try:
                chatbot.save_session(user_id, {"last_bot_msg": response})
            except Exception:
                logging.error("Error saving bot session", exc_info=True)

    except WebSocketDisconnect:
        logging.info(f"WebSocket disconnected for user {user_id}")
    finally:
        await websocket.close()

# Run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
