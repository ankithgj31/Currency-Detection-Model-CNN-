from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import tensorflow as tf
import numpy as np
from PIL import Image
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

GEMINI_MODEL = "gemini-3.1-flash-lite"

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "currency_detection_project")

# -----------------------------
# Login Credentials
# -----------------------------
# NOTE: hardcoded credentials are fine for a student project demo,
# but should move to env vars / a real user store before any real deployment.

USERNAME = "admin"
PASSWORD = "admin123"

# -----------------------------
# Load Model
# -----------------------------

model = tf.keras.models.load_model("model/currency_model.keras")

# IMPORTANT:
# Replace this order with your model's actual class order
CLASS_NAMES = [
    "Fake ₹2000",
    "Fake ₹500",
    "Real ₹2000",
    "Real ₹500"
]

IMG_SIZE = (128, 128)
THRESHOLD = 0.50


def ai_explanation(prediction, confidence):
    """One-shot opening analysis shown as the assistant's first chat message."""

    prompt = f"""
You are an AI assistant for an Indian Currency Detection System.

CNN Prediction:
{prediction}

Confidence:
{confidence:.2f}%

Generate your response in this format:

Prediction Summary:
(One short sentence)

Security Features to Verify:
• Watermark
• Security Thread
• Latent Image
• Colour Shifting Ink

Recommendation:
If the prediction is Real or Fake, advise the user to manually verify the RBI security features.

If the prediction is Cannot Determine, tell the user to upload a clear image containing only a ₹500 or ₹2000 note.

Keep the response under 120 words.
"""

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )
        return response.text

    except Exception as e:
        print("Gemini Error:", e)
        return "AI analysis unavailable."


CHAT_SYSTEM_PROMPT = """You are the AI Verification Assistant inside an Indian Currency
Note Detection web app. A CNN model has already classified an uploaded note image as
Real/Fake ₹500 or ₹2000 (or "Cannot Determine"), and you are chatting with the person
about that result.

Ground rules:
- You are knowledgeable about RBI-published security features for ₹500 and ₹2000 notes
  (watermark, security thread, latent image, colour-shifting ink, micro-lettering,
  see-through register, etc.) and can explain what each one is and how to check it.
- The CNN prediction is a machine-learning estimate, not a legal or financial verdict.
  Always encourage manual verification of the physical note's security features, and for
  any real financial decision, point the person to a bank or the RBI.
- Keep answers conversational, concise (usually under 100 words), and specific to the
  question asked. Use plain language, not a rigid template, for follow-up questions.
- If asked something unrelated to currency verification, gently steer back or answer
  briefly without pretending to be a general-purpose assistant.
"""


def build_context_block(context):
    if not context:
        return "No prediction has been generated yet in this conversation."

    lines = [
        f"Prediction: {context.get('prediction', 'N/A')}",
        f"Confidence: {context.get('confidence', 'N/A')}%",
    ]
    if context.get("reason"):
        lines.append(f"Reason flagged: {context.get('reason')}")

    probs = context.get("probabilities") or []
    if probs:
        prob_str = ", ".join(
            f"{p.get('class_name')}: {p.get('probability')}%" for p in probs
        )
        lines.append(f"Full class probabilities: {prob_str}")

    return "Current note scan result:\n" + "\n".join(lines)


# -----------------------------
# Login Page
# -----------------------------

@app.route("/")
def login():

    if "user" in session:
        return redirect(url_for("home"))

    return render_template("login.html")


# -----------------------------
# Login Check
# -----------------------------

@app.route("/login", methods=["POST"])
def check_login():

    username = request.form["username"]
    password = request.form["password"]

    if username == USERNAME and password == PASSWORD:

        session["user"] = username

        return redirect(url_for("home"))

    return render_template(
        "login.html",
        error="Invalid Username or Password"
    )


# -----------------------------
# Home
# -----------------------------

@app.route("/home")
def home():

    if "user" not in session:
        return redirect("/")

    return render_template("index.html")


# -----------------------------
# Prediction
# -----------------------------

@app.route("/predict", methods=["POST"])
def predict():

    if "user" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    if "image" not in request.files:
        return jsonify({"error": "No Image Uploaded"})

    file = request.files["image"]

    image = Image.open(file).convert("RGB")
    image = image.resize(IMG_SIZE)
    image = np.array(image)
    image = np.expand_dims(image, axis=0)

    prediction = model.predict(image)
    pred_probs = prediction[0]

    print("\nPrediction Probabilities")
    print("-" * 35)

    probabilities = []
    for cls, prob in zip(CLASS_NAMES, pred_probs):
        prob_pct = float(prob * 100)
        print(f"{cls:<12}: {prob_pct:.2f}%")
        probabilities.append({
            "class_name": cls,
            "probability": round(prob_pct, 2)
        })

    print("-" * 35)

    predicted_index = int(np.argmax(pred_probs))
    confidence_val = float(np.max(pred_probs))
    confidence_pct = round(confidence_val * 100, 2)

    if confidence_val < THRESHOLD:
        predicted_label = "Cannot Determine"
        reason = "Unsupported note or confidence too low."
        is_supported = False
        print("Prediction : Cannot Determine")
        print("Reason : Unsupported note or confidence too low.")
    else:
        predicted_label = CLASS_NAMES[predicted_index]
        reason = ""
        is_supported = True
        print("Prediction :", predicted_label)

    print("Confidence :", confidence_pct, "%")

    # Generate AI opening analysis (becomes the first chat bubble on the frontend)
    ai_result = ai_explanation(
        predicted_label,
        confidence_pct
    )

    return jsonify({
        "prediction": predicted_label,
        "confidence": confidence_pct,
        "threshold": round(THRESHOLD * 100, 2),
        "is_supported": is_supported,
        "reason": reason,
        "probabilities": probabilities,
        "ai_analysis": ai_result
    })


# -----------------------------
# Chat (interactive AI verification assistant)
# -----------------------------

@app.route("/chat", methods=["POST"])
def chat():

    if "user" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    history = data.get("history") or []
    context = data.get("context")

    if not message:
        return jsonify({"error": "Message is empty."}), 400

    if len(message) > 2000:
        return jsonify({"error": "Message is too long."}), 400

    # Rebuild the multi-turn conversation for the Gemini API.
    contents = []
    for turn in history:
        role = turn.get("role")
        text = turn.get("text")
        if role not in ("user", "model") or not text:
            continue
        contents.append({"role": role, "parts": [{"text": text}]})

    contents.append({"role": "user", "parts": [{"text": message}]})

    system_instruction = CHAT_SYSTEM_PROMPT + "\n\n" + build_context_block(context)

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                max_output_tokens=400,
                temperature=0.6,
            ),
        )
        reply = response.text or "I couldn't generate a response for that — could you rephrase?"

    except Exception as e:
        print("Gemini Chat Error:", e)
        return jsonify({"error": "The AI assistant is unavailable right now. Please try again shortly."}), 502

    return jsonify({"reply": reply})


# -----------------------------
# Logout
# -----------------------------

@app.route("/logout")
def logout():

    session.pop("user", None)

    return redirect("/")


# -----------------------------
# Run
# -----------------------------

if __name__ == "__main__":

    app.run(host="0.0.0.0", port=5000, debug=True)
