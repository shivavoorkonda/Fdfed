export default function StatCard({ label, value, detail, tone = 'blue' }) {
  return <div className={`admin-stat admin-stat--${tone}`}><span>{label}</span><strong>{value ?? '—'}</strong>{detail && <small>{detail}</small>}</div>;
}
