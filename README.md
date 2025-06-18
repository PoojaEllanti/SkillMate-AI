# SkillMate AI 🚀

[![Deploy Frontend](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/skillmate-ai)
[![Deploy Backend](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

**AI-powered learning platform** that generates micro-lessons, quizzes, and video resources for any skill.

![SkillMate Demo](https://i.imgur.com/JQ8W5Yn.gif)  
*(Replace with your actual demo GIF)*

## Features ✨

- 🧠 **AI-Generated Content**: 5 micro-lessons + quizzes per topic
- 🎥 **Smart Video Curation**: Auto-finds relevant YouTube tutorials
- 📝 **Interactive Quizzes**: MCQ tests with instant feedback
- 🌙 **Dark/Light Mode**: Eye-friendly themes
- 📱 **Responsive Design**: Works on all devices

## Tech Stack ⚙️

| Component       | Technology                  |
|-----------------|-----------------------------|
| Frontend        | React + Vite + TailwindCSS  |
| Backend         | Python Flask                |
| AI Integration  | OpenRouter API              |
| Deployment      | Vercel (Frontend) + Render (Backend) |

## Quick Start 🏁

### Prerequisites
- Node.js ≥18
- Python ≥3.9
- OpenAI/OpenRouter API key

### Local Development
```bash
# Clone repo
git clone https://github.com/yourusername/skillmate-ai.git
cd skillmate-ai

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Run both (in separate terminals)
flask run --port=5000  # Backend
npm run dev            # Frontend
