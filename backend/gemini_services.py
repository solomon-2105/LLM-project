import google.generativeai as genai
import json, os

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
# We are using 1.0-pro. This will FAIL until you set up billing in Google Cloud.
model = genai.GenerativeModel('gemini-2.5-pro')

def parse_json_from_gemini(text):
    """Safely extracts JSON from Gemini's markdown-formatted text."""
    try:
        # Find the start and end of the JSON block
        start = text.find('```json') + 7
        end = text.rfind('```')
        if start == 6 or end == -1: # if ```json not found
             start = text.find('[') # Assume it starts with [
             end = text.rfind(']') + 1 # Assume it ends with ]
             if start == -1 or end == 0:
                 print("No JSON found in text.")
                 return None
        json_text = text[start:end].strip()
        return json.loads(json_text)
    except Exception as e:
        print(f"Error parsing JSON: {e}\nText was: {text}")
        return None

# --- FUNCTION FOR NOTES ---
def get_gemini_notes(topic):
    """Generates notes for the learn page."""
    prompt = f"""
    Generate clear, concise, and easy-to-understand notes for a high school student 
    on the topic of '{topic}'. 
    
    Use markdown formatting. For example:
    - Use headings (##) for sub-topics.
    - Use bullet points (*) for lists.
    - Use bold (**) for key terms.
    
    Start directly with the content. Do not include a title like "Notes on {topic}".
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating notes: {e}")
        # Return the error message so the frontend can display it
        return f"Error: {e}"

# --- THIS IS THE NEW FUNCTION YOU WANTED ---
def get_gemini_video_link(topic):
    """Asks Gemini to find a relevant YouTube video URL."""
    prompt = f"""
    Find a good, introductory YouTube video tutorial for a high school student 
    on the topic of '{topic}'. 
    
    Please provide ONLY the full YouTube URL (e.g., [https://www.youtube.com/watch?v=](https://www.youtube.com/watch?v=)...) 
    and nothing else. If you cannot find a suitable video, return the text "NOT_FOUND".
    """
    try:
        # NOTE: This prompt may fail if the model (e.g., 1.0-pro) doesn't have web-browsing.
        # If it fails, you MUST use a newer model like 'gemini-1.5-flash'
        response = model.generate_content(prompt)
        url = response.text.strip()
        
        # Check if the response is a valid YouTube link
        if "youtube.com" in url or "youtu.be" in url:
            return url
        else:
            print(f"Gemini did not return a valid YouTube URL for '{topic}'. Response: {url}")
            return None # Indicate failure
    except Exception as e:
        print(f"Error getting video link from Gemini: {e}")
        return None # Indicate failure

# --- FUNCTION FOR TEST QUESTIONS ---
def generate_test_questions(topic):
    """Generates 5 initial test questions."""
    prompt = f"""
    Generate 5 multiple-choice quiz questions for a high school student on the topic of '{topic}'.
    For each question, provide 4 options (A, B, C, D) and specify the correct answer key (e.g., "B").
    Also, identify the specific sub-concept being tested (e.g., 'retardation', 'Ohm's Law').
    
    Return the output ONLY as a valid JSON list.
    
    Example format:
    [
      {{
        "question": "What is retardation?",
        "options": {{
          "A": "Positive acceleration",
          "B": "Negative acceleration",
          "C": "Constant velocity",
          "D": "Zero velocity"
        }},
        "answer": "B",
        "concept": "retardation"
      }}
    ]
    """
    try:
        response = model.generate_content(prompt)
        return parse_json_from_gemini(response.text)
    except Exception as e:
        print(f"Error generating test questions: {e}")
        return None

# --- FUNCTION FOR ANALYSIS ---
def analyze_wrong_answers(questions, user_answers, topic):
    """Generates the analysis page content."""
    prompt = f"""
    Here is a test a student took on '{topic}'.
    Questions: {json.dumps(questions)}
    Student's Answers: {json.dumps(user_answers)}

    Please identify the specific concepts the student misunderstood.
    For each misunderstood concept, provide:
    1.  'concept_name': The name of the concept (e.g., "retardation").
    2.  'explanation': A clear, elegant explanation of the concept with a simple example.
    3.  'practice_questions': An array of 5 new practice questions (MCQ format) on this concept.
    
    Return ONLY a valid JSON list, with one object for each misunderstood concept.
    """
    try:
        response = model.generate_content(prompt)
        return parse_json_from_gemini(response.text)
    except Exception as e:
        print(f"Error analyzing answers: {e}")
        return None

# --- FUNCTION FOR DYNAMIC TEST ---
def generate_dynamic_assessment(topic, weak_concepts):
    """Generates the 3 Easy, 5 Medium, 2 Hard test."""
    prompt = f"""
    A student is struggling with the following concepts related to '{topic}': {', '.join(weak_concepts)}.
    
    Please generate a new "dynamic assessment test" for them. The test must contain:
    - 3 EASY questions
    - 5 MEDIUM questions
    - 2 HARD questions
    
    Focus the questions on the student's weak concepts.
    Return ONLY a valid JSON list of 10 question objects.
    
    Example format:
    [
      {{
        "question": "An easy question about a weak concept...",
        "options": {{...}},
        "answer": "...",
        "concept": "...",
        "difficulty": "Easy"
      }}
    ]
    """
    try:
        response = model.generate_content(prompt)
        return parse_json_from_gemini(response.text)
    except Exception as e:
        print(f"Error generating dynamic assessment: {e}")
        return None