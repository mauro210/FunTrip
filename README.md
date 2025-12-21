# FunTrip – AI Trip Planner 🌍✈️

FunTrip is a full-stack web app powered by an AI agent that makes trip planning effortless. Simply enter your destination, accommodation, trip dates, budget, and activity preferences—and FunTrip will generate a personalized, optimized itinerary for you.

The AI not only tailors activities to your interests but also accounts for:

- ✅ Opening hours & free admission times  
- ✅ Distances between locations & transportation options  
- ✅ Popular attractions and hidden gems  
- ✅ Budget-conscious recommendations

-----

### 🖼️ Live Demo
https://funtrip.vercel.app/

-----

### ℹ️ Status
Core Features Complete - Actively Maintained

The application is fully functional and deployed. Additional features and optimizations are planned and will be added over time.

-----

### ✨ Key Features

  - **User Authentication**: Secure user registration and login.
  - **Trip Management**: Users can create, view, edit, and delete their personalized trips.
  - **Intelligent Itinerary Generation**: An AI agent generates a structured, day-by-day itinerary based on trip details like destination, dates, budget, and preferences.
  - **Itinerary Management**: Users can view and delete generated itineraries.
  - **Smart Input Validation**: Utilizes the Google Places Autocomplete API to validate trip destinations and accommodation addresses, ensuring geographic consistency.
  - **Robust Backend**: A FastAPI backend provides secure and efficient API endpoints for all application functionalities.
  - **Modern Frontend**: A responsive and dynamic React frontend delivers a seamless user experience.

-----

### ⚙️ Tech Stack

#### Backend

  - **Python**: The core language for the backend.
  - **FastAPI**: A modern, fast web framework for building the API.
  - **PostgreSQL**: The production database for scalable and reliable data storage.
  - **SQLAlchemy**: An Object-Relational Mapper (ORM) for interacting with the database.
  - **Alembic**: A database migration tool for managing schema changes.
  - **Google Generative AI SDK**: For integrating with the Gemini 2.5 API for itinerary generation.
  - **passlib**: For secure password hashing and management.
  - **python-jose**: For handling JSON Web Tokens (JWT) for authentication.

#### Frontend

  - **React with TypeScript**: A robust and type-safe foundation for the user interface.
  - **Vite**: A fast, modern build tool for development.
  - **React Router Dom**: For client-side routing and navigation.
  - **Context API**: For global state management (e.g., user authentication).
  - **Google Maps JavaScript API**: With the Places Library for autocomplete functionality.

-----

### 🛠️ Local Development

Follow these steps to get a local copy of the project up and running on your machine for development purposes.

#### 1\. Clone the repository

```bash
git clone [YOUR-REPO-URL]
cd [YOUR-REPO-FOLDER]
```

#### 2\. Backend Setup

1.  Navigate to the `backend` directory:

    ```bash
    cd backend
    ```

2.  Create and activate a Python virtual environment:

    ```bash
    # Create a virtual environment
    python -m venv .venv

    # Activate the virtual environment
    # For macOS and Linux:
    source .venv/bin/activate

    # For Windows:
    # Command Prompt (cmd.exe):
    .venv\Scripts\activate

    # PowerShell:
    .venv\Scripts\Activate.ps1

    # Git Bash or other Unix-like shells on Windows:
    source .venv/Scripts/activate
    ```

3.  Install the required packages, including the PostgreSQL driver:

    ```bash
    pip install -r requirements.txt
    pip install psycopg2-binary
    ```

4.  Set up a local PostgreSQL database and get its connection string.

5.  Create a **`.env` file** in the `backend` directory and add your API keys and database URL:

    ```
    # PostgreSQL connection string for local development
    SQLALCHEMY_DATABASE_URL="postgresql://user:password@host:port/dbname"

    # API Keys & Auth Configuration
    JWT_SECRET_KEY="your_secret_key_here"
    JWT_ALGORITHM="HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
    GEMINI_API_KEY="your_gemini_api_key_here"

    # URL for frontend (useful for CORS, password resets, etc.)
    FRONTEND_URL="http://localhost:5173"
    ```

    **Note:** For `JWT_SECRET_KEY`, use a long, random string.

6.  Run the database migrations to create the tables:

    ```bash
    alembic upgrade head
    ```

7.  Start the FastAPI server:

    ```bash
    uvicorn main:app --reload
    ```

#### 3\. Frontend Setup

1.  Navigate to the `funtrip-frontend` directory:
    ```bash
    cd frontend/funtrip-frontend
    ```
2.  Install the Node.js packages:
    ```bash
    npm install
    ```
3.  Create a **`.env` file** in the `funtrip-frontend` directory and add your Google Maps API key. Make sure the API URL points to your local backend server:
    ```
    # For local development, point to your local backend
    VITE_API_BASE_URL="http://127.0.0.1:8000"
    VITE_GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"
    ```
4.  Start the React development server:
    ```bash
    npm run dev
    ```

The local application should now be running at `http://localhost:5173`.

-----
