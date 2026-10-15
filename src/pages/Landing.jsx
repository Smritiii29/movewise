
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Compass,
  ChartNoAxesCombined,
  HeartHandshake,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import '../App.css'

const features = [
  {
    icon: ChartNoAxesCombined,
    title: 'Compare the real numbers',
    text: 'Look beyond annual salary to monthly savings, living costs and moving expenses.',
  },
  {
    icon: MapPin,
    title: 'Understand each city',
    text: 'Estimate your monthly expenses in a potential destination before making a move.',
  },
  {
    icon: HeartHandshake,
    title: 'Consider your readiness',
    text: 'Reflect on your confidence, priorities, family and willingness to adapt.',
  },
]

export default function Landing() {
  return (
    <div className="public-page">
      <header className="public-nav">
        <Link to="/" className="public-brand">
          <Compass size={27} />
          <span>MoveWise<span className="brand-dot">.</span></span>
        </Link>

        <nav className="public-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <Link to="/login" className="nav-login">Log in</Link>
          <Link to="/signup" className="nav-cta">Get started <ArrowRight size={16} /></Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-copy">
            <p className="eyebrow">YOUR NEXT CHAPTER, CONSIDERED</p>
            <h1>
              A new city.
              <br />
              A <span>better-informed</span>
              <br />
              decision.
            </h1>

            <p className="landing-description">
              A higher salary doesn't always mean a better life.
              Compare job opportunities through finances, living costs
              and personal readiness — all in one place.
            </p>

            <div className="landing-actions">
              <Link to="/signup" className="primary-button">
                Plan your next move <ArrowRight size={17} />
              </Link>
              <Link to="/login" className="landing-secondary">
                Already have an account? Log in
              </Link>
            </div>

            <div className="landing-trust">
              <ShieldCheck size={17} />
              Your financial information stays in your account.
            </div>
          </div>

          <div className="landing-visual">
            <div className="visual-sun" />
            <div className="visual-city city-one" />
            <div className="visual-city city-two" />
            <div className="visual-hill" />

            <div className="comparison-preview">
              <p className="eyebrow">YOUR RELOCATION SNAPSHOT</p>
              <h3>Look at the whole picture.</h3>

              <div className="preview-row">
                <span>Monthly take-home</span>
                <strong>Income</strong>
              </div>
              <div className="preview-row">
                <span>Living expenses</span>
                <strong>Costs</strong>
              </div>
              <div className="preview-row">
                <span>Moving expenses</span>
                <strong>One-time</strong>
              </div>

              <div className="preview-bottom">
                <span>What matters most is the outcome.</span>
                <Compass size={23} />
              </div>
            </div>

            <div className="visual-pin"><MapPin size={18} /></div>
          </div>
        </section>

        <section className="landing-features" id="features">
          <div className="section-heading">
            <p className="eyebrow">BUILT AROUND YOUR DECISION</p>
            <h2>More than just a salary.</h2>
            <p>Understand the financial and personal trade-offs before you relocate.</p>
          </div>

          <div className="landing-feature-grid">
            {features.map(({ icon: Icon, title, text }) => (
              <article className="landing-feature-card" key={title}>
                <span className="landing-feature-icon"><Icon size={23} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-how" id="how-it-works">
          <p className="eyebrow">A CLEARER WAY FORWARD</p>
          <h2>Four steps to a more informed move.</h2>

          <div className="landing-steps">
            <div><span>01</span><strong>Build your profile</strong><p>Enter your current finances and priorities.</p></div>
            <div><span>02</span><strong>Add job offers</strong><p>Record salary, destination and relocation costs.</p></div>
            <div><span>03</span><strong>Compare outcomes</strong><p>Estimate monthly savings and break-even time.</p></div>
            <div><span>04</span><strong>Explore scenarios</strong><p>Adjust assumptions and reflect on your readiness.</p></div>
          </div>

          <Link to="/signup" className="primary-button">
            Get started with MoveWise <ArrowRight size={17} />
          </Link>
        </section>
      </main>

      <footer className="public-footer">
        <Link to="/" className="public-brand">
          <Compass size={21} /> MoveWise<span className="brand-dot">.</span>
        </Link>
        <span>Make your next move smarter.</span>
      </footer>
    </div>
  )
}
