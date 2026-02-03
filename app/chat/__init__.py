"""
Coach Assistant chatbot: intent classification and data-driven responses.
Uses only project data and existing analytics — no external LLM.
"""
from app.chat.query import handle_chat_query

__all__ = ["handle_chat_query"]
