import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../../services/api.js';

const ORGANIZATION_EMPTY = { collegeName: '', collegeCode: '', collegeEmail: '', collegePhone: '', collegeAddress: '', collegeWebsite: '', contactName: '', contactEmail: '', contactDesignation: '', contactPhone: '', expectedStudents: '', message: '' };
const RECRUITER_EMPTY = { name: '', company: '', role: '', email: '', phone: '', collegeId: '', message: '' };

function validateOrganization(form) {
  const errors = {};
  if (form.collegeName.trim().length < 3) errors.collegeName = 'Enter your organization name.';
  if (!/^[A-Z0-9-]{2,12}$/.test(form.collegeCode.trim())) errors.collegeCode = 'Use 2-12 capital letters, numbers or hyphens.';
  if (!/^\S+@\S+\.[A-Za-z]{2,}$/.test(form.collegeEmail.trim())) errors.collegeEmail = 'Enter a valid official email.';
  if (form.collegePhone && !/^[+]?[0-9 ()-]{8,16}$/.test(form.collegePhone)) errors.collegePhone = 'Enter a valid phone number.';
  if (form.collegeWebsite && !/^https?:\/\/.+/.test(form.collegeWebsite)) errors.collegeWebsite = 'Use a full URL starting with http:// or https://.';
  if (form.contactName.trim().length < 2) errors.contactName = 'Enter the contact person name.';
  if (!/^\S+@\S+\.[A-Za-z]{2,}$/.test(form.contactEmail.trim())) errors.contactEmail = 'Enter a valid email.';
  if (form.contactDesignation.trim().length < 2) errors.contactDesignation = 'Enter a designation.';
  if (form.contactPhone && !/^[+]?[0-9 ()-]{8,16}$/.test(form.contactPhone)) errors.contactPhone = 'Enter a valid phone number.';
  if (form.message.length > 1000) errors.message = 'Keep the message under 1000 characters.';
  return errors;
}

function validateRecruiter(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Enter your name.';
  if (form.company.trim().length < 2) errors.company = 'Enter your company name.';
  if (form.role.trim().length < 2) errors.role = 'Enter your designation.';
  if (!/^\S+@\S+\.[A-Za-z]{2,}$/.test(form.email.trim())) errors.email = 'Enter a valid work email.';
  if (form.phone && !/^[+]?[0-9 ()-]{8,16}$/.test(form.phone)) errors.phone = 'Enter a valid phone number.';
  if (!form.collegeId) errors.collegeId = 'Choose the organization you want to contact.';
  if (form.message.length > 1000) errors.message = 'Keep the message under 1000 characters.';
  return errors;
}

export default function ContactSection() {
  const [audience, setAudience] = useState('organization');
  const [organization, setOrganization] = useState(ORGANIZATION_EMPTY);
  const [recruiter, setRecruiter] = useState(RECRUITER_EMPTY);
  const [colleges, setColleges] = useState([]);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState({ state: 'idle', text: '' });
  useEffect(() => { api.get('/contact/colleges').then(({ data }) => setColleges(data)).catch(() => {}); }, []);

  const form = audience === 'organization' ? organization : recruiter;
  const errors = audience === 'organization' ? validateOrganization(organization) : validateRecruiter(recruiter);
  const set = (key) => (event) => {
    const value = audience === 'organization' && key === 'collegeCode' ? event.target.value.toUpperCase() : event.target.value;
    (audience === 'organization' ? setOrganization : setRecruiter)((current) => ({ ...current, [key]: value }));
  };
  const changeAudience = (next) => { setAudience(next); setTouched({}); setStatus({ state: 'idle', text: '' }); };
  const blur = (key) => () => setTouched((current) => ({ ...current, [key]: true }));
  const field = (key, label, props = {}) => <div className={`contact-field ${touched[key] && errors[key] ? 'has-error' : ''}`}><label htmlFor={`${audience}-${key}`}>{label}</label><input id={`${audience}-${key}`} value={form[key]} onChange={set(key)} onBlur={blur(key)} {...props} />{touched[key] && errors[key] && <span className="contact-error">{errors[key]}</span>}</div>;
  const submit = async (event) => {
    event.preventDefault(); setTouched(Object.fromEntries(Object.keys(form).map((key) => [key, true]))); if (Object.keys(errors).length) return;
    setStatus({ state: 'sending', text: '' });
    try {
      if (audience === 'organization') {
        const payload = Object.fromEntries(Object.entries(organization).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value));
        const { data } = await api.post('/contact/college-onboarding', payload); setOrganization(ORGANIZATION_EMPTY); setStatus({ state: 'done', text: data.message });
      } else {
        const payload = { ...recruiter, name: recruiter.name.trim(), company: recruiter.company.trim(), role: recruiter.role.trim(), email: recruiter.email.trim(), collegeId: Number(recruiter.collegeId), ...(recruiter.phone.trim() ? { phone: recruiter.phone.trim() } : {}), ...(recruiter.message.trim() ? { message: recruiter.message.trim() } : {}) };
        const { data } = await api.post('/contact/recruiter', payload); setRecruiter(RECRUITER_EMPTY); setStatus({ state: 'done', text: data.message });
      }
      setTouched({});
    } catch (error) { setStatus({ state: 'error', text: errorMessage(error, 'Could not send your request. Please try again.') }); }
  };
  const copy = audience === 'organization'
    ? { tag: 'FOR ORGANIZATIONS', title: 'Want to digitize your campus placements?', accent: 'Get started with CareerNest', text: 'Share your organization details and we will set up your dedicated placement portal.' }
    : { tag: 'FOR RECRUITERS', title: 'Want to hire from a campus?', accent: 'Talk to the placement cell', text: 'Tell us who you are and which organization you would like to recruit from.' };

  return <section className="contact" id="contact"><div className="container"><div className="section-header"><span className="tag">{copy.tag}</span><h2>{copy.title} <span className="gradient-text">{copy.accent}</span></h2><p>{copy.text}</p></div><div className="contact-card">
    <div className="contact-tabs" role="tablist"><button type="button" className={audience === 'organization' ? 'active' : ''} onClick={() => changeAudience('organization')} role="tab" aria-selected={audience === 'organization'}>For Organizations</button><button type="button" className={audience === 'recruiter' ? 'active' : ''} onClick={() => changeAudience('recruiter')} role="tab" aria-selected={audience === 'recruiter'}>For Recruiters</button></div>
    {status.state === 'done' ? <div className="contact-success"><div className="contact-success-icon">✓</div><h3>Request received</h3><p>{status.text}</p><button className="btn-secondary" onClick={() => setStatus({ state: 'idle', text: '' })}>Send another request</button></div> : <form onSubmit={submit} noValidate>
      {audience === 'organization' ? <><h3 className="contact-form-title">Organization information</h3><div className="contact-grid">{field('collegeName', 'Organization name *', { placeholder: 'NIT Warangal' })}{field('collegeCode', 'Organization code *', { placeholder: 'NITW', maxLength: 12 })}{field('collegeEmail', 'Official email *', { type: 'email', placeholder: 'placements@organization.ac.in' })}{field('collegePhone', 'Organization phone', { placeholder: '+91 98765 43210' })}{field('collegeAddress', 'Organization address', { placeholder: 'City, State' })}{field('collegeWebsite', 'Organization website', { type: 'url', placeholder: 'https://organization.ac.in' })}</div><h3 className="contact-form-title">Primary contact person</h3><div className="contact-grid">{field('contactName', 'Full name *', { placeholder: 'Dr. Ramesh Kumar' })}{field('contactEmail', 'Email *', { type: 'email', placeholder: 'ramesh@organization.ac.in' })}{field('contactDesignation', 'Designation *', { placeholder: 'Training & Placement Officer' })}{field('contactPhone', 'Phone', { placeholder: '+91 98765 43210' })}<div className="contact-field"><label htmlFor="organization-expectedStudents">Expected student strength</label><select id="organization-expectedStudents" value={organization.expectedStudents} onChange={set('expectedStudents')}><option value="">Select range</option><option value="&lt; 200">Less than 200</option><option value="200–500">200–500</option><option value="500–1000">500–1000</option><option value="1000+">1000+</option></select></div></div></> : <><h3 className="contact-form-title">Recruiter information</h3><div className="contact-grid">{field('name', 'Your name *', { placeholder: 'Priya Kapoor' })}{field('email', 'Work email *', { type: 'email', placeholder: 'you@company.com' })}{field('company', 'Company *', { placeholder: 'Google' })}{field('role', 'Designation *', { placeholder: 'University Relations Lead' })}{field('phone', 'Phone', { placeholder: '+91 98765 43210' })}<div className={`contact-field ${touched.collegeId && errors.collegeId ? 'has-error' : ''}`}><label htmlFor="recruiter-collegeId">Organization to recruit from *</label><select id="recruiter-collegeId" value={recruiter.collegeId} onChange={set('collegeId')} onBlur={blur('collegeId')}><option value="">Select an organization</option>{colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}</select>{touched.collegeId && errors.collegeId && <span className="contact-error">{errors.collegeId}</span>}</div></div></>}
      <div className={`contact-field ${touched.message && errors.message ? 'has-error' : ''}`} style={{ marginTop: 16 }}><label htmlFor={`${audience}-message`}>Message</label><textarea id={`${audience}-message`} rows={4} value={form.message} onChange={set('message')} onBlur={blur('message')} placeholder={audience === 'organization' ? 'Tell us about your placement goals or requirements…' : 'Roles you are hiring for, expected hiring window and openings…'} />{touched.message && errors.message && <span className="contact-error">{errors.message}</span>}</div>{status.state === 'error' && <div className="contact-banner">{status.text}</div>}<button type="submit" className="btn-primary btn-lg" disabled={status.state === 'sending'} style={{ marginTop: 20 }}><span>{status.state === 'sending' ? 'Sending…' : audience === 'organization' ? 'Request organization onboarding' : 'Contact the placement cell'}</span></button>
    </form>}</div></div></section>;
}
