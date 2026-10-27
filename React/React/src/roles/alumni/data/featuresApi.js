import api from '../../../services/api.js';

// Thin wrappers over the /features endpoints used by the alumni screens.
const unwrap = (request) => request.then((r) => r.data).catch((error) => {
  const message = error.response?.data?.message;
  const status = error.response?.status;
  throw new Error(`${status || ''} ${Array.isArray(message) ? message.join(', ') : message || error.message}`.trim());
});

const featuresApi = {
  getDirectory: (company, batch, dept) =>
    unwrap(api.get('/features/alumni/directory', { params: { company, batch, dept } })),
  getMentorshipReceived: () => unwrap(api.get('/features/alumni/mentorship/received')),
  respondMentorship: (id, status) => unwrap(api.patch(`/features/alumni/mentorship/${id}/respond`, { status })),
  requestMentorship: (body) => unwrap(api.post('/features/alumni/mentorship/request', body)),
  getEvents: () => unwrap(api.get('/features/alumni/events')),
  registerEvent: (id) => unwrap(api.post(`/features/alumni/events/${id}/register`)),
};

export default featuresApi;
