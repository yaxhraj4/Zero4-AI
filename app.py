import os
import base64
import sqlite3
from datetime import datetime
from functools import wraps

from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    session,
    redirect,
    url_for
)

from werkzeug.security import generate_password_hash, check_password_hash

from google import genai
from google.genai import types


app = Flask(__name__)

app.secret_key = os.environ.get(
    "ZERO4_SECRET_KEY",
    "zero4-change-this-secret-key"
)

app.config["MAX_CONTENT_LENGTH"] = 200 * 1024 * 1024

DATABASE = "zero4.db"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

CHAT_MODEL = "gemini-3.8-flash"
IMAGE_MODEL = "gemini-3.1-flash-image"

gemini_client = None

if GEMINI_API_KEY:
    gemini_client = genai.Client(
        api_key=GEMINI_API_KEY
    )


def get_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_db()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            plan TEXT DEFAULT 'Free',
            created_at TEXT NOT NULL
        )
    """)

    connection.commit()
    connection.close()


init_db()


def login_required(function):

    @wraps(function)
    def wrapper(*args, **kwargs):

        if "user_id" not in session:
            return jsonify({
                "success": False,
                "error": "Please login first."
            }), 401

        return function(*args, **kwargs)

    return wrapper


SYSTEM_INSTRUCTION = """
You are Zero4 AI Flash.

You are a fast, friendly and helpful multilingual AI assistant.

You can understand and respond naturally in:

English
Hindi
Hinglish
Roman Hindi
Urdu
Roman Urdu
Bengali
Punjabi
Gujarati
Marathi
Tamil
Telugu
Kannada
Malayalam
Odia
Assamese
Nepali

You can also understand mixed languages.

Always follow the language and style used by the user.

For normal questions:
Give clear and useful answers.

For mathematics:
Prefer:

Given
Formula
Solution
Answer

For coding:
Provide complete working code when requested.

Be friendly, direct and practical.

You are Zero4 AI Flash.
"""


@app.route("/")
def home():

    return render_template(
        "index.html",
        logged_in=("user_id" in session)
    )


@app.route("/register", methods=["POST"])
def register():

    data = request.get_json(silent=True) or {}

    name = str(
        data.get("name", "")
    ).strip()

    email = str(
        data.get("email", "")
    ).strip().lower()

    password = str(
        data.get("password", "")
    )

    if not name or not email or not password:

        return jsonify({
            "success": False,
            "error": "Please fill all fields."
        }), 400

    if len(password) < 6:

        return jsonify({
            "success": False,
            "error": "Password must contain at least 6 characters."
        }), 400

    connection = get_db()

    existing = connection.execute(
        "SELECT id FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    if existing:

        connection.close()

        return jsonify({
            "success": False,
            "error": "An account with this email already exists."
        }), 409

    password_hash = generate_password_hash(password)

    cursor = connection.execute(
        """
        INSERT INTO users
        (name, email, password, plan, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            name,
            email,
            password_hash,
            "Free",
            datetime.utcnow().isoformat()
        )
    )

    connection.commit()

    user_id = cursor.lastrowid

    connection.close()

    session["user_id"] = user_id
    session["name"] = name
    session["email"] = email
    session["plan"] = "Free"

    return jsonify({
        "success": True,
        "message": "Account created successfully."
    })


@app.route("/login", methods=["POST"])
def login():

    data = request.get_json(silent=True) or {}

    email = str(
        data.get("email", "")
    ).strip().lower()

    password = str(
        data.get("password", "")
    )

    if not email or not password:

        return jsonify({
            "success": False,
            "error": "Email and password are required."
        }), 400

    connection = get_db()

    user = connection.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    connection.close()

    if not user:

        return jsonify({
            "success": False,
            "error": "Invalid email or password."
        }), 401

    if not check_password_hash(
        user["password"],
        password
    ):

        return jsonify({
            "success": False,
            "error": "Invalid email or password."
        }), 401

    session["user_id"] = user["id"]
    session["name"] = user["name"]
    session["email"] = user["email"]
    session["plan"] = user["plan"]

    return jsonify({
        "success": True,
        "message": "Login successful."
    })


@app.route("/logout")
def logout():

    session.clear()

    return redirect(
        url_for("home")
    )


@app.route("/me")
@login_required
def me():

    connection = get_db()

    user = connection.execute(
        """
        SELECT
            id,
            name,
            email,
            plan,
            created_at
        FROM users
        WHERE id = ?
        """,
        (session["user_id"],)
    ).fetchone()

    connection.close()

    if not user:

        session.clear()

        return jsonify({
            "success": False,
            "error": "User not found."
        }), 404

    return jsonify({
        "success": True,
        "user": dict(user)
    })


@app.route("/chat", methods=["POST"])
@login_required
def chat():

    if gemini_client is None:

        return jsonify({
            "success": False,
            "error": "Gemini API is not configured on the server."
        }), 500

    data = request.get_json(silent=True) or {}

    message = str(
        data.get("message", "")
    ).strip()

    if not message:

        return jsonify({
            "success": False,
            "error": "Please enter a message."
        }), 400

    try:

        response = gemini_client.models.generate_content(
            model=CHAT_MODEL,
            contents=message,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.7
            )
        )

        answer = response.text

        if not answer:
            answer = "Sorry, I could not generate a response."

        return jsonify({
            "success": True,
            "type": "text",
            "answer": answer
        })

    except Exception as error:

        print(
            "Gemini chat error:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "error": "Gemini could not process your request right now."
        }), 500


@app.route("/generate-image", methods=["POST"])
@login_required
def generate_image():

    if gemini_client is None:

        return jsonify({
            "success": False,
            "error": "Gemini API is not configured."
        }), 500

    data = request.get_json(silent=True) or {}

    prompt = str(
        data.get("prompt", "")
    ).strip()

    if not prompt:

        return jsonify({
            "success": False,
            "error": "Please enter an image prompt."
        }), 400

    try:

        response = gemini_client.models.generate_content(
            model=IMAGE_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"]
            )
        )

        image_part = None

        for part in response.parts:

            if getattr(part, "inline_data", None):

                image_part = part.inline_data
                break

        if image_part is None:

            return jsonify({
                "success": False,
                "error": "Gemini did not return an image."
            }), 500

        image_bytes = image_part.data

        if not isinstance(image_bytes, bytes):
            image_bytes = bytes(image_bytes)

        image_base64 = base64.b64encode(
            image_bytes
        ).decode("utf-8")

        mime_type = (
            image_part.mime_type
            or "image/png"
        )

        return jsonify({
            "success": True,
            "type": "image",
            "image": (
                f"data:{mime_type};base64,"
                f"{image_base64}"
            )
        })

    except Exception as error:

        print(
            "Gemini image error:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "error": "Image generation failed. Please try another prompt."
        }), 500


@app.route("/analyze-file", methods=["POST"])
@login_required
def analyze_file():

    if gemini_client is None:

        return jsonify({
            "success": False,
            "error": "Gemini API is not configured."
        }), 500

    uploaded_file = request.files.get("file")

    user_message = request.form.get(
        "message",
        ""
    ).strip()

    if not uploaded_file:

        return jsonify({
            "success": False,
            "error": "No file was selected."
        }), 400

    file_bytes = uploaded_file.read()

    if not file_bytes:

        return jsonify({
            "success": False,
            "error": "The selected file is empty."
        }), 400

    max_size = 200 * 1024 * 1024

    if len(file_bytes) > max_size:

        return jsonify({
            "success": False,
            "error": "File is too large. Maximum size is 200 MB."
        }), 400

    mime_type = (
        uploaded_file.mimetype
        or "application/octet-stream"
    )

    allowed = (
        mime_type.startswith("image/")
        or mime_type.startswith("text/")
        or mime_type in [
            "application/pdf",
            "application/json",
            "application/csv"
        ]
    )

    if not allowed:

        return jsonify({
            "success": False,
            "error": "This file type is not supported yet."
        }), 400

    try:

        file_part = types.Part.from_bytes(
            data=file_bytes,
            mime_type=mime_type
        )

        prompt = (
            user_message
            if user_message
            else "Analyze this attachment and explain it clearly."
        )

        response = gemini_client.models.generate_content(
            model=CHAT_MODEL,
            contents=[
                file_part,
                prompt
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.5
            )
        )

        answer = response.text

        if not answer:
            answer = "I could not analyze this attachment."

        return jsonify({
            "success": True,
            "type": "text",
            "answer": answer
        })

    except Exception as error:

        print(
            "Gemini attachment error:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "error": (
                "Gemini could not analyze this attachment. "
                "The file may exceed the AI model's supported input limit."
            )
        }), 500


@app.errorhandler(413)
def file_too_large(error):

    return jsonify({
        "success": False,
        "error": "File is too large. Maximum upload size is 200 MB."
    }), 413


if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
