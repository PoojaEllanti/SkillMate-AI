from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv
import os
import json
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
CORS(app)

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Cache for storing recent requests
request_cache = {}

def generate_prompt(skill, difficulty="beginner"):
    """Generate dynamic prompt with video recommendations"""
    return f"""
    Create a {difficulty}-level learning module about {skill} with:
    1. 5 micro-lessons (each 2-3 sentences)
    2. 5 multiple-choice questions (with 4 options each and correct answer marked with letter A-D)
    3. 3 practical exercises
    4. Key takeaways summary (3-5 bullet points)
    5. 2 high-quality YouTube video recommendations (with embeddable URLs)
    
    For videos, only include videos with these characteristics:
    - From reputable educational channels
    - Under 15 minutes in length
    - Published in the last 2 years
    - Include full embed URL (https://www.youtube.com/embed/VIDEO_ID)
    
    Format response as JSON with this exact structure:
    {{
        "meta": {{
            "skill": "{skill}",
            "difficulty": "{difficulty}",
            "generated_at": "{datetime.now().isoformat()}"
        }},
        "micro_lessons": [],
        "mcqs": [
            {{
                "question": "What is...?",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "answer": 0
            }}
        ],
        "exercises": [],
        "key_takeaways": [],
        "videos": [
            {{
                "title": "Video Title",
                "url": "https://www.youtube.com/embed/abc123",
                "description": "Brief description"
            }}
        ]
    }}
    Return ONLY the JSON object with no additional text or markdown.
    """

@app.route('/generate', methods=['POST'])
def generate_content():
    try:
        start_time = datetime.now()
        data = request.get_json()
        skill = data.get('skill', '').strip().lower()
        difficulty = data.get('difficulty', 'beginner').lower()
        
        # Validate input
        if not skill:
            return jsonify({'error': 'Skill is required'}), 400
            
        if difficulty not in ['beginner', 'intermediate', 'advanced']:
            difficulty = 'beginner'
        
        # Check cache first
        cache_key = f"{skill}:{difficulty}"
        if cache_key in request_cache:
            logger.info(f"Returning cached response for {cache_key}")
            return jsonify(request_cache[cache_key])
        
        prompt = generate_prompt(skill, difficulty)
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "SkillMate AI"
        }

        payload = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are an expert educator that outputs perfect JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 2000,
            "response_format": { "type": "json_object" }
        }

        logger.info(f"Generating content for {skill} at {difficulty} level")
        
        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        
        api_response = response.json()
        content_str = api_response['choices'][0]['message']['content']
        
        try:
            content = json.loads(content_str)
            
            # Validate and clean the response
            if not isinstance(content.get('mcqs', []), list):
                content['mcqs'] = []
            
            if not isinstance(content.get('videos', []), list):
                content['videos'] = []
            
            # Ensure answer indices are valid
            for mcq in content['mcqs']:
                if not 0 <= mcq.get('answer', -1) < len(mcq.get('options', [])):
                    mcq['answer'] = 0
            
            # Add metadata
            content['meta'] = content.get('meta', {})
            content['meta']['generation_time_ms'] = (datetime.now() - start_time).total_seconds() * 1000
            
            # Cache the response
            request_cache[cache_key] = content
            
            return jsonify(content)
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}\nResponse: {content_str}")
            return jsonify({'error': 'Failed to parse AI response', 'details': str(e)}), 500
            
    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        return jsonify({'error': 'Failed to connect to AI service'}), 502
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)