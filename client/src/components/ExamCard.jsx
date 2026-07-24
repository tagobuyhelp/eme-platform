import PropTypes from "prop-types";

function ExamCard({ exam, attemptsCount, hasPassed, onStart }) {
  const isLocked = hasPassed || attemptsCount >= 3;
  
  let statusBadge = "bg-indigo-50 text-indigo-700 border-indigo-200";
  let statusIcon = "stars";
  let statusText = "Available Now";
  let buttonText = "Start Exam";
  
  if (hasPassed) {
    statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50";
    statusIcon = "check_circle";
    statusText = "Passed";
    buttonText = "Passed";
  } else if (attemptsCount >= 3) {
    statusBadge = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700/50";
    statusIcon = "lock";
    statusText = "Max Attempts Reached";
    buttonText = "Locked";
  } else if (attemptsCount > 0) {
    statusBadge = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50";
    statusIcon = "replay";
    statusText = `Attempt ${attemptsCount + 1} of 3`;
    buttonText = "Retake Exam";
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-white dark:bg-slate-900 p-5 md:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border ${statusBadge}`}>
              <span className="material-icons text-[14px]">{statusIcon}</span>
              {statusText}
            </span>
            {exam.course && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <span className="material-icons text-[14px] text-slate-400">school</span>
                {exam.course}
              </span>
            )}
          </div>

          <h3 className="font-heading text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {exam.title}
          </h3>
          
          <div className="flex flex-wrap gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 px-3 py-1.5">
              <span className="material-icons text-sm text-indigo-500">timer</span>
              {exam.duration || 0} Mins
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 px-3 py-1.5">
              <span className="material-icons text-sm text-violet-500">format_list_bulleted</span>
              {exam.questionCount || 0} Questions
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 px-3 py-1.5">
              <span className="material-icons text-sm text-emerald-500">check_circle</span>
              Pass Marks: {exam.passMarks || 0}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onStart(exam._id)}
          disabled={isLocked}
          className={`w-full sm:w-auto shrink-0 rounded-2xl px-6 py-3.5 text-sm font-black transition-all duration-200 whitespace-nowrap active:scale-[0.98] shadow-md ${
            isLocked
              ? "cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
              : "bg-gradient-to-r from-eme-orange to-eme-orange-hover text-white hover:from-eme-orange-hover hover:to-eme-orange hover:shadow-lg hover:shadow-eme-orange/30"
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
