import PropTypes from "prop-types";

function StatCard({ label, value, tone = "primary" }) {
  const toneClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
    success: "text-emerald-600",
  };

  return (
    <article className="card hover:-translate-y-1">
      <p className="text-sm font-medium text-textSecondary dark:text-gray-400">{label}</p>
      <p className={`mt-4 font-heading text-4xl font-bold ${toneClasses[tone] || toneClasses.primary}`}>{value}</p>
    </article>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  tone: PropTypes.string,
};

export default StatCard;
