import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../services/api.js';
import './RecruiterContact.css';

const EMPTY = { name: '', company: '', role: '', email: '', phone: '', collegeId: '', message: '' };
const validate = (form) => {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Please enter your name.';
  if (form.company.trim().length < 2) errors.company = 'Please enter your company name.';
  if (form.role.trim().length < 2) errors.role = 'Please enter your designation.';
  if (!/^\S+@\S+\.[A-Za-z]{2,}$/.test(form.email.trim())) errors.email = 'Enter a valid work email.';
  if (form.phone && !/^[+]?[0-9 ()-]{8,16}$/.test(form.phone)) errors.phone = 'Enter a valid phone number.';
  if (!form.collegeId) errors.collegeId = 'Choose a college.';
  if (form.message.length > 1000) errors.message = 'Keep the message under 1000 characters.';
  return errors;
};

export default function RecruiterContactPage() {
  const [form, setForm] = useState(EMPTY); const [colleges, setColleges] = useState([]); const [touched, setTouched] = useState({}); const [status, setStatus] = useState({ state: 'idle', text: '' });
  useEffect(() => { api.get('/contact/colleges').then(({ data }) => setColleges(data)).catch(() => {}); }, []);
  const errors = validate(form); const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value })); const blur = (key) => () => setTouched((current) => ({ ...current, [key]: true }));
  const field = (key, label, props = {}) => <div className={`recruiter-contact__field ${touched[key] && errors[key] ? 'is-error' : ''}`}><label htmlFor={`recruiter-${key}`}>{label}</label><input id={`recruiter-${key}`} value={form[key]} onChange={set(key)} onBlur={blur(key)} {...props} />{touched[key] && errors[key] && <small>{errors[key]}</small>}</div>;
  const submit = async (event) => { event.preventDefault(); setTouched(Object.fromEntries(Object.keys(EMPTY).map((key) => [key, true]))); if (Object.keys(errors).length) return; setStatus({ state: 'sending', text: '' }); try { const { data } = await api.post('/contact/recruiter', { ...form, name: form.name.trim(), company: form.company.trim(), role: form.role.trim(), email: form.email.trim(), collegeId: Number(form.collegeId), ...(form.phone.trim() ? { phone: form.phone.trim() } : {}), ...(form.message.trim() ? { message: form.message.trim() } : {}) }); setStatus({ state: 'done', text: data.message }); setForm(EMPTY); setTouched({}); } catch (error) { setStatus({ state: 'error', text: errorMessage(error, 'Could not send your request. Please try again.') }); } };
  return <main className="recruiter-contact"><nav className="recruiter-contact__nav"><Link to="/" className="recruiter-contact__brand">CareerNest</Link><div><Link to="/">← Back to Home</Link><Link className="recruiter-contact__login" to="/login">Login</Link></div></nav><section className="recruiter-contact__content"><span>FOR RECRUITERS</span><h1>Want to hire from a campus?<br /><em>Talk to the placement cell.</em></h1><p>Tell us who you are and which college you would like to recruit from. The placement cell will review your request.</p><div className="recruiter-contact__card">{status.state === 'done' ? <div className="recruiter-contact__success"><strong>Request received</strong><p>{status.text}</p><button onClick={() => setStatus({ state: 'idle', text: '' })}>Send another request</button></div> : <form onSubmit={submit} noValidate><div className="recruiter-contact__grid">{field('name', 'Your name *', { placeholder: 'Priya Kapoor' })}{field('email', 'Work email *', { type: 'email', placeholder: 'you@company.com' })}{field('company', 'Company *', { placeholder: 'Google' })}{field('role', 'Designation *', { placeholder: 'University Relations Lead' })}{field('phone', 'Phone', { placeholder: '+91 98765 43210' })}<div className={`recruiter-contact__field ${touched.collegeId && errors.collegeId ? 'is-error' : ''}`}><label htmlFor="recruiter-college">College to recruit from *</label><select id="recruiter-college" value={form.collegeId} onChange={set('collegeId')} onBlur={blur('collegeId')}><option value="">Select a college</option>{colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}</select>{touched.collegeId && errors.collegeId && <small>{errors.collegeId}</small>}</div></div><div className={`recruiter-contact__field ${touched.message && errors.message ? 'is-error' : ''}`}><label htmlFor="recruiter-message">Message</label><textarea id="recruiter-message" rows={4} value={form.message} onChange={set('message')} onBlur={blur('message')} placeholder="Roles you are hiring for, hiring window and openings…" />{touched.message && errors.message && <small>{errors.message}</small>}</div>{status.state === 'error' && <div className="recruiter-contact__error">{status.text}</div>}<button className="recruiter-contact__submit" disabled={status.state === 'sending'}>{status.state === 'sending' ? 'Sending…' : 'Contact the placement cell'}</button></form>}</div></section></main>;
}
