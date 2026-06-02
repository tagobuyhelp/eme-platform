import PropTypes from "prop-types";

function Logo({ 
  variant = "full", 
  className = "", 
  theme = "light" 
}) {
  const isDark = theme === "dark";
  const logoSrc = variant === "full" ? "/logo.png" : "/small-logo.png";
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={logoSrc} 
        alt="EME Academy" 
        className={`h-full w-auto object-contain ${isDark ? "brightness-0 invert" : ""}`}
      />
    </div>
  );
}

Logo.propTypes = {
  variant: PropTypes.oneOf(["full", "icon"]),
  className: PropTypes.string,
  theme: PropTypes.oneOf(["light", "dark"]),
};

export default Logo;
