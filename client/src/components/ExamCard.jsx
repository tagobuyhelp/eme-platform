import PropTypes from "prop-types";

function ExamCard({ exam, attemptsCount, hasPassed, onStart }) {
  const isLocked = hasPassed || attemptsCount >= 3;
  
  let statusText = "Available Now";
  let statusColor = "text-indigo-500";
  let buttonText = "Start Exam";
  
  if (hasPassed) {
    statusText = "Passed";
    statusColor = "text-emerald-500";
    buttonText = "Passed";
  } else if (attemptsCount >= 3) {
    statusText = "Max Attempts Reached";
    statusColor = "text-rose-500";
    buttonText = "Locked";
  } else if (attemptsCount > 0) {
    statusText = `Attempt ${attemptsCount + 1} of 3`;
    statusColor = "text-amber-500";
    buttonText = "Retake Exam";
  }

  return (
    <article className="rounded-2xl md:rounded-3xl bg-white p-5 md:p-6 border border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 hover:border-indigo-200 group">
      <div className="flex flex-col gap-4 md:gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${statusColor}`}>
            {statusText}
          </p>
          <h3 className="mt-1 font-heading text-xl md:text-2xl font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">{exam.title}</h3>
          
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-100 px-3 py-1.5">
              <span className="material-icons text-[14px] text-slate-400">timer</span>
              {exam.duration || 0} mins
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-100 px-3 py-1.5">
              <span className="material-icons text-[14px] text-slate-400">replay</span>
              Attempts: {attemptsCount}/3
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-100 px-3 py-1.5">
              <span className="material-icons text-[14px] text-slate-400">check_circle</span>
              Pass: {exam.passMarks || 0}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onStart(exam._id)}
          disabled={isLocked}
          className={`rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 whitespace-nowrap active:scale-[0.98] ${
            isLocked
              ? "cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200/50"
              : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20"
          }`}
        >
          {buttonText}
        </button>
      </div>
    </article>
  );
}

ExamCard.propTypes = {
  exam: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    duration: PropTypes.number,
    totalMarks: PropTypes.number,
    passMarks: PropTypes.number,
  }).isRequired,
  attemptsCount: PropTypes.number.isRequired,
  hasPassed: PropTypes.bool.isRequired,
  onStart: PropTypes.func.isRequired,
};

export default ExamCard;
