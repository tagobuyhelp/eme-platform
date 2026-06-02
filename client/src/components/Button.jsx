import PropTypes from "prop-types";

function Button({ 
  children, 
  loading = false, 
  variant = "primary", 
  type = "button", 
  className = "", 
  disabled = false, 
  ...props 
}) {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 border border-transparent",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
    accent: "bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-600/20 border border-transparent",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20 border border-transparent",
  };

  return (
    <button
      {...props}
      type={type}
      disabled={loading || disabled}
      className={`
        relative flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 active:scale-[0.98]
        ${variants[variant] || variants.primary}
        ${disabled || loading ? "opacity-60 cursor-not-allowed active:scale-100 shadow-none" : ""}
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  loading: PropTypes.bool,
  variant: PropTypes.oneOf(["primary", "secondary", "outline", "accent", "danger"]),
  type: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default Button;
