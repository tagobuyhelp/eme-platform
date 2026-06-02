import PropTypes from "prop-types";
import { useState } from "react";

function InputField({ 
  label, 
  icon, 
  type = "text", 
  error, 
  className = "", 
  ...props 
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl select-none">
            {icon}
          </span>
        )}
        <input
          {...props}
          type={inputType}
          className={`
            w-full rounded-xl border bg-slate-50 text-slate-900 outline-none transition-all duration-200 py-3 text-sm truncate
            focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10
            dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:focus:border-indigo-500
            ${icon ? "pl-12 pr-4" : "px-4"}
            ${isPassword ? "pr-12" : ""}
            ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10" : "border-slate-200"}
            ${className}
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <span className="material-icons text-xl select-none">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs font-bold text-rose-500 ml-1 mt-1 flex items-center gap-1">
          <span className="material-icons text-[14px]">error_outline</span>
          {error}
        </p>
      )}
    </div>
  );
}

InputField.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  type: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
};

export default InputField;
