from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import pandas as pd
from database import setup_database, hash_password, check_password
# --- Correct Imports ---
from gemini_services import (
    get_gemini_notes,
    # We DON'T need get_gemini_video_link anymore
    generate_test_questions,
    analyze_wrong_answers,
    generate_dynamic_assessment
)
# We still need youtube_search for the ANALYSIS page videos
from youtube_search import search_youtube
# --- END Correct Imports ---
import json, os
from dotenv import load_dotenv

# --- IMPORTANT: Make sure this is at the very top ---
load_dotenv()

# --- 1. SETUP THE APP ---
app = Flask(__name__)
CORS(app)
db_path = "users.db"
setup_database()

# --- APP_DATA now has HARD-CODED video links again ---
APP_DATA = {
    "Class 10": {
        "Physics": {
            "Motion in a Straight Line": {
                # Add back your specific video URL
                "video": "https://youtu.be/ZM8ECpBuQYE?si=AVUhoGBwYLCYUsfE"
            },
            "Gravity": {
                # Add back your specific video URL
                "video": "https://youtu.be/1_ZFWFFoPu8?si=6_5G83t6V0I7B5CV"
            }
        },
        "Chemistry": {
            "The Atom": {
                # Add back your specific video URL
                "video": "https://youtu.be/ORZOEoWKH1A?si=LQ5ANm8rnAmylP5n"
            }
        }
    }
}
# --- END APP_DATA ---

def get_db():
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

# --- 2. AUTHENTICATION ENDPOINTS (Unchanged) ---
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    hashed_pass = hash_password(data["password"])
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (data["username"], hashed_pass))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Account created!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username already taken"}), 409

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT password_hash FROM users WHERE username = ?", (data["username"],))
    result = c.fetchone()
    conn.close()
    if result and check_password(result["password_hash"], data["password"]):
        return jsonify({"success": True, "username": data["username"]}), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401

# --- 3. CONTENT ENDPOINTS ---

# --- /api/content now sends structure with topics ---
@app.route("/api/content", methods=["GET"])
def get_content():
    # Send structure including topics again
    structure_only = {}
    for class_name, subjects in APP_DATA.items():
        structure_only[class_name] = {}
        for subject_name, topics in subjects.items():
             # Extract topic names (keys) from the inner dictionary
            structure_only[class_name][subject_name] = list(topics.keys())
    return jsonify(structure_only)


# --- /api/get-topic-details uses HARD-CODED video ---
@app.route("/api/get-topic-details", methods=["POST"])
def api_get_topic_details():
    data = request.get_json()
    # Need class and subject again to look up video
    class_name = data.get("class")
    subject = data.get("subject")
    topic = data.get("topic")

    if not all([class_name, subject, topic]):
        return jsonify({"error": "Missing class, subject, or topic"}), 400

    # 1. Get AI-generated notes
    notes = get_gemini_notes(topic)

    # 2. Get video URL from our hard-coded data
    try:
        # Look up the video URL in APP_DATA
        video_url = APP_DATA[class_name][subject][topic]["video"]
    except KeyError:
        print(f"Warning: No hard-coded video found for {class_name}/{subject}/{topic}")
        video_url = "" # No video found

    # Check if notes generation failed
    if "Error:" in notes:
        # Pass the specific error message from Gemini
        return jsonify({"error": notes}), 500

    return jsonify({"notes": notes, "video_url": video_url}), 200


# --- (The rest of the file is unchanged and correct) ---

@app.route("/api/generate-test", methods=["POST"])
def api_generate_test():
    data = request.get_json()
    topic = data.get("topic")
    questions = generate_test_questions(topic)
    if questions:
        return jsonify(questions), 200
    else:
        # Pass the actual error if generation failed
        error_message = f"Failed to generate test questions for topic: {topic}"
        print(error_message) # Log it on the server
        return jsonify({"error": error_message}), 500

@app.route("/api/submit-test", methods=["POST"])
def submit_test():
    data = request.get_json()
    username = data.get("username")
    subject = data.get("subject")
    topic = data.get("topic")
    score = data.get("score")
    questions = data.get("questions")
    user_answers = data.get("user_answers")

    analysis_results = analyze_wrong_answers(questions, user_answers, topic)
    if not analysis_results:
        # Pass the actual error if analysis failed
        error_message = f"Failed to analyze results for topic: {topic}"
        print(error_message) # Log it on the server
        return jsonify({"error": error_message}), 500

    weak_concepts = []
    for item in analysis_results:
        concept = item["concept_name"]
        weak_concepts.append(concept)
        # Use YouTube API for analysis videos
        item["video_url"] = search_youtube(f"{concept} tutorial")

    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("""
            INSERT INTO test_results (username, subject, topic, score, weak_concepts)
            VALUES (?, ?, ?, ?, ?)
        """, (username, subject, topic, int(score), ', '.join(set(weak_concepts))))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error saving to DB: {e}")
        return jsonify({"error": "Failed to save results"}), 500

    return jsonify(analysis_results), 200


@app.route("/api/generate-dynamic-test", methods=["POST"])
def api_generate_dynamic_test():
    data = request.get_json()
    topic = data.get("topic")
    weak_concepts = data.get("weak_concepts")

    questions = generate_dynamic_assessment(topic, weak_concepts)

    if questions:
        return jsonify(questions), 200
    else:
        # Pass the actual error if generation failed
        error_message = f"Failed to generate dynamic test for topic: {topic}"
        print(error_message) # Log it on the server
        return jsonify({"error": error_message}), 500

@app.route("/api/analytics", methods=["GET"])
def get_analytics():
    username = request.args.get("username")
    try:
        conn = get_db()
        query = "SELECT test_date, subject, topic, score FROM test_results WHERE username = ?"
        df = pd.read_sql(query, conn, params=(username,))
        conn.close()

        if df.empty:
            return jsonify({"error": "No data found"}), 404

        return df.to_json(orient="records"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- 4. RUN THE APP ---
if __name__ == "__main__":
    app.run(debug=True, port=5000)