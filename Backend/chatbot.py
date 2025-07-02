import os
import json
import logging
import random
from datetime import datetime
from typing import Dict

# Set up logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

class CulturalEcommerceChatbot:
    def __init__(self):
        self.knowledge_base = self.load_knowledge_base()
        self.user_sessions: Dict[str, dict] = {}
        self.current_date = datetime.now().strftime("%Y-%m-%d")

    def load_knowledge_base(self) -> dict:
        try:
            # Adjust the base directory to point to the project root (BazaarBytes)
            base_dir = os.path.dirname(os.path.abspath(__file__))
            dataset_path = os.path.join(base_dir, "dataset.json")
            with open(dataset_path, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("dataset.json not found. Using default knowledge base.")
            return self.default_knowledge_base()

    def default_knowledge_base(self) -> dict:
        return {
            "greetings": {
                "patterns": ["hello", "hi", "hey", "greetings", "good morning", "good afternoon"],
                "responses": [
                    "Hello! I'm Friday..... How can I assist you today with your cultural shopping needs?",
                    "Hi there! I'm Friday..... Welcome to our cultural e-commerce platform. How may I help you?",
                    "Hey! I'm Friday..... Ready to explore cultural treasures? What do you need help with?"
                ]
            },
            "farewells": {
                "patterns": ["bye", "goodbye", "see you", "exit", "quit"],
                "responses": [
                    "Goodbye! Have a culturally enriching day!",
                    "See you later! Thanks for visiting our cultural store.",
                    "Farewell! Come back soon for more cultural discoveries."
                ]
            },
            "product_inquiries": {
                "patterns": ["tell me about products", "what do you sell", "products available", "cultural items"],
                "responses": [
                    "We offer a wide range of cultural products including traditional art, handicrafts, music, books, clothing, and more from various cultures around the world.",
                    "Our store features authentic cultural items such as indigenous crafts, vintage artifacts, and contemporary cultural products.",
                    "You can find everything from cultural apparel to decorative arts and musical instruments from different regions."
                ]
            },
            "order_status": {
                "patterns": ["track order", "where is my order", "order status", "delivery"],
                "responses": [
                    "To track your order, please provide your order number. I'll check the status for you.",
                    "I can help with your order status. Could you share your order ID and shipping address?",
                    "Let me check on your delivery. Please provide your order details."
                ]
            },
            "payment_issues": {
                "patterns": ["payment failed", "can't pay", "payment problems", "charge issues"],
                "responses": [
                    "I'm sorry to hear about the payment issue. Could you tell me which payment method you're using?",
                    "Let's resolve your payment problem. Please check if your card details are correct or try a different payment method.",
                    "Payment issues can occur due to various reasons. Can you specify the error message you received?"
                ]
            },
            "returns_refunds": {
                "patterns": ["return product", "refund", "exchange", "return policy"],
                "responses": [
                    "Our return policy allows returns within 30 days of purchase. Please provide your order number for assistance.",
                    "For refunds or exchanges, contact our support team with your order details. We'll guide you through the process.",
                    "To initiate a return, visit our returns page and follow the instructions. Need help with specific steps?"
                ]
            },
            "account_help": {
                "patterns": ["forgot password", "account access", "login issues", "create account"],
                "responses": [
                    "If you forgot your password, use the 'Forgot Password' link on the login page to reset it.",
                    "Having login issues? Try resetting your password or contact support with your registered email.",
                    "To create an account, click on the 'Sign Up' button and fill in the required details."
                ]
            },
            "shipping": {
                "patterns": ["shipping cost", "delivery time", "international shipping"],
                "responses": [
                    "Shipping costs vary based on location and order size. Check at checkout for exact rates.",
                    "Delivery times depend on your location. Domestic orders usually take 3-5 days, international may take longer.",
                    "Yes, we ship internationally! Shipping costs and times will be calculated at checkout."
                ]
            },
            "promotions": {
                "patterns": ["discounts", "offers", "promotions", "coupons"],
                "responses": [
                    "Check our website for current promotions and discounts on cultural products!",
                    "We often have special offers on seasonal cultural items. Visit our promotions page for details.",
                    "Use coupon code CULTURE10 at checkout for 10% off your first order!"
                ]
            },
            "feedback": {
                "patterns": ["feedback", "suggestions", "complaints", "rate service"],
                "responses": [
                    "We value your feedback! Please share your thoughts on our service or products.",
                    "If you have suggestions or complaints, please email us at support@culturalstore.com.",
                    "Your input helps us improve. How would you rate your experience today?"
                ]
            },
            "default": {
                "patterns": ["help", "assist", "support", "need help"],
                "responses": [
                    "How can I assist you today? Whether it's products, orders, or accounts, I'm here to help!",
                    "I'm here to support you. What specific issue are you facing?",
                    "Need help with our cultural e-commerce site? Please provide more details."
                ]
            }
        }

    def normalize_text(self, text: str) -> str:
        return text.lower().strip()

    def match_intent(self, user_input: str) -> str:
        normalized_input = self.normalize_text(user_input)
        for intent, data in self.knowledge_base.items():
            if any(pattern in normalized_input for pattern in data["patterns"]):
                return intent
        return "default"

    def generate_response(self, intent: str) -> str:
        responses = self.knowledge_base[intent]["responses"]
        return random.choice(responses)

    async def handle_message(self, user_id: str, message: str) -> dict:
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = {"history": [], "context": {}}

        self.user_sessions[user_id]["history"].append({"user": message, "time": self.current_date})
        intent = self.match_intent(message)
        response = self.generate_response(intent)

        if intent == "order_status" and "order_number" not in self.user_sessions[user_id]["context"]:
            response += " Please provide your order number."

        self.user_sessions[user_id]["history"].append({"bot": response, "time": self.current_date})
        return {"response": response, "user_id": user_id}

    def save_session(self, user_id: str, session_data: dict):
        # Adjust base directory to project root
        base_dir = os.path.dirname(os.path.abspath(__file__))
        sessions_dir = os.path.join(base_dir, "sessions")
        os.makedirs(sessions_dir, exist_ok=True)

        # Save session data
        session_path = os.path.join(sessions_dir, f"session_{user_id}.json")

        logger.debug(f"Saving session to: {session_path}")

        with open(session_path, "w", encoding="utf-8") as f:
            json.dump(session_data, f, ensure_ascii=False, indent=2)

        logger.debug("Session saved successfully.")
