import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/Mosalinx_logo.png'
import './Home.css'

const RINGS = [
  { radius: 110, dotAngle: 20,  duration: 40, reverse: false },
  { radius: 230, dotAngle: 200, duration: 55, reverse: true },
  { radius: 350, dotAngle: 80,  duration: 70, reverse: false },
  { radius: 470, dotAngle: 300, duration: 90, reverse: true },
]

const CENTER = 510
const FADE_DURATION = 400

function Home() {
  const [isExiting, setIsExiting] = useState(false)
  const navigate = useNavigate()

  function handleNavigate(e, path) {
    e.preventDefault()
    setIsExiting(true)
    setTimeout(() => navigate(path), FADE_DURATION)
  }

  return (
    <div className="landing-page">
      <div className="landing">
        <div className={`landing-foreground ${isExiting ? 'fade-out' : ''}`}>
          <svg className="ring-field" viewBox="0 0 1020 1020" aria-hidden="true">
            {RINGS.map((ring, i) => {
              const rad = (ring.dotAngle * Math.PI) / 180
              const dotX = CENTER + ring.radius * Math.cos(rad)
              const dotY = CENTER + ring.radius * Math.sin(rad)
              return (
                <g
                  key={i}
                  className={`ring ${ring.reverse ? 'ring-reverse' : ''}`}
                  style={{ animationDuration: `${ring.duration}s` }}
                >
                  <circle cx={CENTER} cy={CENTER} r={ring.radius} className="ring-circle" />
                  <circle cx={dotX} cy={dotY} r="7" className="ring-dot" />
                </g>
              )
            })}
          </svg>

          <div className="landing-content">
            <img src={logo} alt="Mosalinx" className="landing-logo" />
            <div className="landing-actions">
              <Link to="/signup" className="btn btn-primary" onClick={(e) => handleNavigate(e, '/signup')}>
                Sign up
              </Link>
              <Link to="/login" className="btn btn-ghost" onClick={(e) => handleNavigate(e, '/login')}>
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home