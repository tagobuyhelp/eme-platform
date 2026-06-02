import PropTypes from "prop-types";

function ResultCard({ result, examTitle }) {
  const passed = result.status === "pass";

  return (
    <article className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 ${
            passed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}>
            <span className="material-icons text-3xl">{passed ? "emoji_events" : "cancel"}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Exam Result</p>
            <h3 className="mt-0.5 font-heading text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">{examTitle || "Assessment"}</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Final Score:</span>
              <span className={`text-sm font-black ${passed ? "text-emerald-600" : "text-rose-600"}`}>
                {result.score} marks
              </span>
            </div>
          </div>
        </div>

        <div
          className={`rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider text-center shrink-0 border ${
            passed ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {passed ? "PASSED" : "FAILED"}
        </div>
      </div>
    </article>
  );
}

ResultCard.propTypes = {
  result: PropTypes.shape({
    score: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  examTitle: PropTypes.string,
};

export default ResultCard;
