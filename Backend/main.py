# main.py
import os
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from chatbot import CulturalEcommerceChatbot

# ——— Setup paths ———
frontend_path = os.path.join(os.path.dirname(__file__), "Frontend")
frontend_path = r"C:\Users\sriji\BazaarBytes-main\Frontend"


# ——— FastAPI App Setup ———
app = FastAPI()
app.mount("/static", StaticFiles(directory=frontend_path), name="static")

from flask import render_template

@app.route('/support')
def support():
    return render_template('support.html')

# ——— Chatbot Instance ———
chatbot = CulturalEcommerceChatbot()

# ——— WebSocket Chat Endpoint ———
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
                response = {"error": "Internal error"}

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

# ——— Run App ———
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
