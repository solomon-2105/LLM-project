from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import pandas as pd
from database import setup_database, hash_password, check_password
from gemini_services import (
    get_gemini_notes,  # <-- NEW
    generate_test_questions, 
    analyze_wrong_answers, 
    generate_dynamic_assessment
)
from youtube_search import search_youtube
import json, os
from dotenv import load_dotenv

# --- IMPORTANT: Make sure this is at the very top ---
load_dotenv() 

# --- 1. SETUP THE APP ---
app = Flask(__name__)
CORS(app)
db_path = "users.db"
setup_database()

# --- APP_DATA now only holds your video links ---
APP_DATA = {
    "Class 10": {
        "Physics": {
            "Motion in a Straight Line": {
                "video": "https://www.youtube.com/watch?v=D-y-N2e2s0E" 
            },
            "Gravity": {
                "video": "https://www.youtube.com/watch?v=E-b-mz14sD8"
            }
        },
        "Chemistry": {
            "The Atom": {
                "video": "https://www.youtube.com/watch?v=1xSQlwWgh8M"
            }
        }
    }
}

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
@app.route("/api/content", methods=["GET"])
def get_content():
    # Send only the keys (Class, Subject, Topic)
    # The notes and videos will be fetched separately
    structure_only = {}
    for class_name, subjects in APP_DATA.items():
        structure_only[class_name] = {}
        for subject_name, topics in subjects.items():
            structure_only[class_name][subject_name] = list(topics.keys())
    return jsonify(structure_only)

# --- NEW ENDPOINT FOR NOTES + VIDEO ---
@app.route("/api/get-topic-details", methods=["POST"])
def api_get_topic_details():
    data = request.get_json()
    class_name = data.get("class")
    subject = data.get("subject")
    topic = data.get("topic")

    if not all([class_name, subject, topic]):
        return jsonify({"error": "Missing class, subject, or topic"}), 400
    
    # 1. Get AI-generated notes
    notes = get_gemini_notes(topic)
    
    # 2. Get video URL from our data
    try:
        video_url = APP_DATA[class_name][subject][topic]["video"]
    except KeyError:
        video_url = "" # No video found
        
    if "Error:" in notes:
        return jsonify({"error": notes}), 500
        
    return jsonify({"notes": notes, "video_url": video_url}), 200


@app.route("/api/generate-test", methods=["POST"])
def api_generate_test():
    data = request.get_json()
    topic = data.get("topic")
    questions = generate_test_questions(topic)
    if questions:
        return jsonify(questions), 200
    else:
        return jsonify({"error": "Failed to generate test"}), 500

@app.route("/api/submit-test", methods=["POST"])
def submit_test():
    data = request.get_json()
    # (Rest of the function is unchanged and correct)
    username = data.get("username")
    subject = data.get("subject")
    topic = data.get("topic")
    score = data.get("score")
    questions = data.get("questions")
    user_answers = data.get("user_answers")
    
    analysis_results = analyze_wrong_answers(questions, user_answers, topic)
    if not analysis_results:
        return jsonify({"error": "Failed to analyze results"}), 500

    weak_concepts = []
    for item in analysis_results:
        concept = item["concept_name"]
        weak_concepts.append(concept)
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
    # (This function is unchanged and correct)
    data = request.get_json()
    topic = data.get("topic")
    weak_concepts = data.get("weak_concepts")
    
    questions = generate_dynamic_assessment(topic, weak_concepts)
    
    if questions:
        return jsonify(questions), 200
    else:
        return jsonify({"error": "Failed to generate dynamic test"}), 500

@app.route("/api/analytics", methods=["GET"])
def get_analytics():
    # (This function is unchanged and correct)
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