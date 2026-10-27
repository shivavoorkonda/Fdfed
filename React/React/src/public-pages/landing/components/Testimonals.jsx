import { useEffect, useState } from 'react';
import api from '../../../services/api.js';

const FALLBACK_TESTIMONIALS = [
  {
    rating: "★★★★★",
    text:
      "The placement portal made the entire process transparent and stress-free. I could easily track my application status and know exactly which stage I was in. Requesting referrals from alumni directly through the portal really improved my chances.",
    initials: "SG",
    name: "Sai Ganesh",
    role: "B.Tech CSE, 2026 · Final Year Student",
    gradient:
      "linear-gradient(135deg, #7c3aed, #a855f7)",
  },
  {
    rating: "★★★★★",
    text:
      "Managing placements used to involve significant manual coordination. This system centralizes everything — from opportunity approvals to recruitment tracking — making the process far more organized and transparent.",
    initials: "SI",
    name: "Dr. S. Iyer",
    role: "Senior Placement Officer",
    gradient:
      "linear-gradient(135deg, #2563eb, #38bdf8)",
    featured: true,
  },
  {
    rating: "★★★★★",
    text:
      "The platform simplified our campus recruitment process. We could define eligibility criteria, review applications, and schedule interviews efficiently. The structured workflow helped us focus on selecting the right candidates.",
    initials: "PS",
    name: "Priya Sharma",
    role: "Hiring Manager · TechCorp",
    gradient:
      "linear-gradient(135deg, #ec4899, #f472b6)",
  },
  {
    rating: "★★★★½",
    text:
      "Being able to help juniors through the referral system is a great initiative. The portal makes it easy to review candidate profiles and provide referrals where appropriate. A real game-changer.",
    initials: "RV",
    name: "Rahul Verma",
    role: "Software Engineer · Microsoft · 2024 Graduate",
    gradient:
      "linear-gradient(135deg, #f97316, #fb923c)",
  },
];

const TESTIMONIAL_GRADIENTS = [
  'linear-gradient(135deg, #7c3aed, #a855f7)',
  'linear-gradient(135deg, #2563eb, #38bdf8)',
  'linear-gradient(135deg, #ec4899, #f472b6)',
  'linear-gradient(135deg, #f97316, #fb923c)',
];

function initials(name = '') {
  return name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CN';
}

function stars(rating) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return '★'.repeat(value) + '☆'.repeat(5 - value);
}

function Testimonials() {
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS);

  useEffect(() => {
    let mounted = true;
    api.get('/website-content/testimonials')
      .then(({ data }) => {
        if (!mounted || !Array.isArray(data)) return;
        setTestimonials(
          data
            .filter((testimonial) => testimonial.isActive !== false)
            .map((testimonial, index) => ({
              ...testimonial,
              rating: stars(testimonial.rating),
              initials: testimonial.avatar || initials(testimonial.name),
              role: [testimonial.role, testimonial.college].filter(Boolean).join(' · '),
              gradient: TESTIMONIAL_GRADIENTS[index % TESTIMONIAL_GRADIENTS.length],
              featured: index === 1,
            })),
        );
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <section
      className="testimonials"
      id="testimonials"
    >
      <div className="container">

        <div className="section-header">

          <span className="tag">
            TESTIMONIALS
          </span>

          <h2>
            Loved by Thousands
          </h2>

          <p className="section-subtitle">
            Hear from the people who use CareerNest
            every day.
          </p>

        </div>

        <div className="testimonial-grid">

          {testimonials.map((testimonial) => (
            <div
              className={`testimonial-card ${
                testimonial.featured
                  ? "featured"
                  : ""
              }`}
              key={testimonial.name}
            >

              <div className="testimonial-rating">
                {testimonial.rating}
              </div>

                <p className="testimonial-text">
                  {testimonial.text}
                </p>

              <div className="testimonial-profile">

                <div
                  className="avatar"
                  style={{
                    background:
                      testimonial.gradient,
                  }}
                >
                  {testimonial.initials}
                </div>

                <div>
                  <h4>
                    {testimonial.name}
                  </h4>

                  <span>
                    {testimonial.role}
                  </span>
                </div>

              </div>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Testimonials;
