import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error("API call failed:", err))
  }, [])

  return (
    <div>
      <h1>AI Trip Planner</h1>
      <p>Backend says: {message}</p>
    </div>
  )
}

export default App