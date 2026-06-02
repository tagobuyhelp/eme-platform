import PropTypes from "prop-types";

function ErrorAlert({ message = "Something went wrong. Please try again later." }) {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl bg-rose-50 p-8 text-center dark:bg-rose-900/10 dark:border dark:border-rose-900/20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-500">
          <span className="material-icons text-4xl">error_outline</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-rose-900 dark:text-rose-400">Error Occurred</h3>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-500/80">{message}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-rose-700 active:scale-95"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

ErrorAlert.propTypes = {
  message: PropTypes.string,
};

export default ErrorAlert;
