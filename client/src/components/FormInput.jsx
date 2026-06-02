import PropTypes from "prop-types";

function FormInput({ label, as = "input", className = "", ...props }) {
  const sharedClassName = `w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:focus:border-indigo-500 ${className}`;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">{label}</span>
      {as === "textarea" ? (
        <textarea {...props} className={`${sharedClassName} min-h-[100px] resize-none`} />
      ) : (
        <input {...props} className={sharedClassName} />
      )}
    </div>
  );
}

FormInput.propTypes = {
  label: PropTypes.string.isRequired,
  as: PropTypes.oneOf(["input", "textarea"]),
  className: PropTypes.string,
};

export default FormInput;
