import { Link } from 'react-router-dom';
import ContactSection from '../landing/components/ContactSection.jsx';
import { ThemeProvider, useTheme } from '../landing/context/ThemeContext.jsx';
import '../landing/Landing.css';
import './ContactPage.css';

function ContactContent() {
  const { theme, toggleTheme } = useTheme();
  return <div className="cn-landing contact-page" data-theme={theme}>
    <nav className="contact-page__nav">
      <Link className="contact-page__brand" to="/">CareerNest</Link>
      <div className="contact-page__actions">
        <button type="button" className="contact-page__theme" onClick={toggleTheme} aria-label="Toggle colour theme">{theme === 'dark' ? '☀' : '◐'}</button>
        <Link to="/">Back to Home</Link>
        <Link className="contact-page__login" to="/login">Login</Link>
      </div>
    </nav>
    <main><ContactSection /></main>
  </div>;
}

export default function ContactPage() {
  return <ThemeProvider><ContactContent /></ThemeProvider>;
}
