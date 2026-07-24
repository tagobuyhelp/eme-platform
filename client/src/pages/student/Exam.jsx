import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../components/Button";
import api from "../../services/api";

function Exam() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fraudWarnings, setFraudWarnings] = useState(0);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  useEffect(() => {
    const loadExam = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/exams/${id}`);
        setExam(response.data.exam);
        const fetchedQuestions = response.data.questions || [];
        setQuestions(fetchedQuestions);
        setAnswers(new Array(fetchedQuestions.length).fill(-1));
        setFlagged(new Array(fetchedQuestions.length).fill(false));
        setTimeLeft((response.data.exam?.duration || 0) * 60);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load exam");
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [id]);

  useEffect(() => {
    if (!timeLeft || loading || submitting) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timerId);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [loading, submitting, timeLeft]);

  const handleSubmit = useCallback(async () => {
    try {
      setSubmitting(true);
      
      const formattedAnswers = questions.map((q, index) => ({
        questionId: q._id,
        selectedOption: answers[index]
      }));

      const response = await api.post(`/exams/${id}/submit`, { answers: formattedAnswers });
      navigate(`/student/result/${id}`, {
        replace: true,
        state: {
          resultPayload: response.data,
          examTitle: exam?.title,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit exam");
      setSubmitting(false);
    }
  }, [answers, questions, exam?.title, id, navigate]);

  useEffect(() => {
    if (!loading && questions.length && timeLeft === 0 && !submitting) {
      handleSubmit();
    }
  }, [handleSubmit, loading, questions.length, timeLeft, submitting]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !loading && !submitting && timeLeft > 0) {
        setFraudWarnings((prev) => {
          const nextWarnings = prev + 1;
          if (nextWarnings >= 3) {
            alert("Maximum tab switching limit reached. Your exam is being automatically submitted.");
            handleSubmit();
          } else {
            alert(`Warning (${nextWarnings}/3): You have switched tabs or minimized the window. Continuing this behavior will result in automatic exam submission.`);
          }
          return nextWarnings;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handleSubmit, loading, submitting, timeLeft]);

  const currentQuestion = questions[currentIndex];

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [timeLeft]);

  const handleSelect = (optionIndex) => {
    setAnswers((previous) => previous.map((answer, index) => (index === currentIndex ? optionIndex : answer)));
  };

  const toggleFlag = () => {
    setFlagged((previous) => previous.map((flag, index) => (index === currentIndex ? !flag : flag)));
  };

  const handleConfirmSubmit = () => {
    const unansweredCount = answers.filter((value) => value === -1).length;
    const flaggedCount = flagged.filter((value) => value).length;

    let confirmMessage = "Are you sure you want to submit your exam?";
    if (unansweredCount > 0 || flaggedCount > 0) {
      confirmMessage = `You have ${unansweredCount} unanswered question(s) and ${flaggedCount} flagged for review. Are you sure you want to submit?`;
    }

    if (window.confirm(confirmMessage)) {
      handleSubmit();
    }
  };

  const progressPercent = useMemo(() => {
    if (!questions.length) return 0;
    const answeredCount = answers.filter((value) => value !== -1).length;
    return Math.round((answeredCount / questions.length) * 100);
  }, [answers, questions.length]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center rounded-3xl bg-white border border-slate-200/80 p-8 text-sm font-bold text-slate-400">Loading exam interface...</div>;
  }

  if (!exam || !currentQuestion) {
    return <div className="rounded-3xl bg-white border border-slate-200/80 p-8 text-sm font-bold text-slate-400">No exam data available.</div>;
  }

  return (
    <div 
      className="space-y-4 md:space-y-6 select-none pb-24 lg:pb-6"
      onCopy={(e) => { e.preventDefault(); alert("Copying is disabled during the exam."); }}
      onCut={(e) => { e.preventDefault(); alert("Cutting is disabled during the exam."); }}
      onPaste={(e) => { e.preventDefault(); alert("Pasting is disabled during the exam."); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. Mobile & Desktop Responsive Header Bar */}
      <section className="sticky top-[64px] z-20 rounded-2xl md:rounded-3xl bg-white dark:bg-slate-900 p-4 md:p-6 shadow-md border border-slate-200/80 dark:border-slate-800 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-eme-blue/15 text-eme-blue dark:text-eme-cyan border border-eme-blue/20">
                Official Assessment
              </span>
              {fraudWarnings > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 animate-pulse">
                  Warning {fraudWarnings}/3
                </span>
              )}
            </div>
            <h1 className="mt-1 font-heading text-lg sm:text-2xl font-black text-slate-900 dark:text-white truncate">
              {exam.title}
            </h1>

            <div className="mt-2.5 flex items-center gap-3">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                {progressPercent}% Done
              </span>
              <div className="flex-1 max-w-xs bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-eme-blue to-eme-cyan h-full transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
            {/* Mobile Question Palette Trigger Button */}
            <button
              type="button"
              onClick={() => setShowMobilePalette(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
            >
              <span className="material-icons text-sm text-eme-blue dark:text-eme-cyan">grid_view</span>
              <span>Q-Palette ({currentIndex + 1}/{questions.length})</span>
            </button>

            {/* Countdown Timer */}
            <div className="rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-4 py-2 sm:px-5 sm:py-3 text-right">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-rose-500 font-extrabold flex items-center justify-end gap-1">
                <span className="material-icons text-[12px] sm:text-[14px]">timer</span>
                Time Left
              </p>
              <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tighter tabular-nums">
                {formattedTime}
              </p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Display Box */}
        <section className="lg:col-span-3 space-y-6 flex flex-col h-full">
          <article className="rounded-2xl md:rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                Question <span className="text-eme-blue dark:text-eme-cyan text-sm sm:text-base font-black">{currentIndex + 1}</span> of {questions.length}
              </span>

              <button
                type="button"
                onClick={toggleFlag}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                  flagged[currentIndex]
                    ? "border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="material-icons text-sm">{flagged[currentIndex] ? "flag" : "outlined_flag"}</span>
                <span className="hidden sm:inline">{flagged[currentIndex] ? "Flagged for Review" : "Flag Question"}</span>
                <span className="sm:hidden">{flagged[currentIndex] ? "Flagged" : "Flag"}</span>
              </button>
            </div>

            <div className="mt-6 sm:mt-8 flex-1">
              <h2 className="text-lg sm:text-xl font-bold leading-relaxed text-slate-900 dark:text-white">
                {currentQuestion.question}
              </h2>

              {/* MCQ Options with A, B, C, D badges */}
              <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4">
                {currentQuestion.options.map((option, optionIndex) => {
                  const isSelected = answers[currentIndex] === optionIndex;
                  const optionLetters = ["A", "B", "C", "D", "E", "F"];

                  return (
                    <button
                      key={`${currentQuestion._id}-${optionIndex}`}
                      type="button"
                      onClick={() => handleSelect(optionIndex)}
                      className={`rounded-2xl border p-4 sm:p-5 text-left transition-all flex items-start justify-between w-full group active:scale-[0.99] min-h-[56px] ${
                        isSelected
                          ? "border-eme-cyan bg-eme-cyan/10 dark:bg-eme-cyan/15 shadow-md ring-2 ring-eme-cyan/30"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-eme-blue/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 pr-2">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-black text-xs transition-colors ${
                          isSelected 
                            ? "bg-eme-navy text-white shadow-sm" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-eme-blue/20 group-hover:text-eme-navy"
                        }`}>
                          {optionLetters[optionIndex] || optionIndex + 1}
                        </span>

                        <span className={`text-sm sm:text-base mt-0.5 ${isSelected ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                          {option}
                        </span>
                      </div>

                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors mt-0.5 ${
                        isSelected ? "border-eme-cyan bg-eme-cyan" : "border-slate-300 dark:border-slate-600 group-hover:border-eme-blue"
                      }`}>
                        {isSelected && <span className="h-2 w-2 rounded-full bg-slate-900"></span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Navigation Buttons */}
            <div className="hidden lg:flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6 mt-10">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((previous) => Math.max(previous - 1, 0))}
                disabled={currentIndex === 0}
              >
                <span className="material-icons text-[18px]">arrow_back</span>
                Previous
              </Button>

              <div className="flex gap-3">
                {currentIndex < questions.length - 1 ? (
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentIndex((previous) => Math.min(previous + 1, questions.length - 1))}
                  >
                    Next
                    <span className="material-icons text-[18px]">arrow_forward</span>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleConfirmSubmit}
                    loading={submitting}
                  >
                    Submit Exam
                  </Button>
                )}
              </div>
            </div>
          </article>
        </section>

        {/* Desktop Question Palette Sidebar */}
        <section className="hidden lg:block lg:col-span-1">
          <aside className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6 sticky top-28">
            <div>
              <h3 className="font-heading text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">Question Palette</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status Overview</p>
            </div>

            <div className="grid grid-cols-4 gap-2.5 pt-2">
              {questions.map((_, index) => {
                const isCurrent = index === currentIndex;
                const isAnswered = answers[index] !== -1;
                const isFlagged = flagged[index];

                let btnClass = "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100";
                if (isAnswered) btnClass = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-300 font-extrabold";
                if (isFlagged) btnClass = "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border-amber-300 font-extrabold";
                if (isAnswered && isFlagged) btnClass = "bg-gradient-to-br from-emerald-100 to-amber-100 text-slate-900 border-amber-400 font-extrabold";

                const activeClass = isCurrent ? "ring-2 ring-eme-cyan ring-offset-2 scale-110 z-10 shadow-sm" : "";

                return (
                  <button
                    key={`palette-${index}`}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${btnClass} ${activeClass}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
               <Button variant="danger" className="w-full text-xs" onClick={handleConfirmSubmit} loading={submitting}>
                 Finish & Submit Exam
               </Button>
            </div>
          </aside>
        </section>
      </div>

      {/* Sticky Bottom Control Navigation Bar for Mobile View */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-3 z-40 flex items-center justify-between gap-2 shadow-2xl">
        <button
          type="button"
          onClick={() => setCurrentIndex((previous) => Math.max(previous - 1, 0))}
          disabled={currentIndex === 0}
          className="flex-1 py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 disabled:opacity-40 flex items-center justify-center gap-1 active:scale-95"
        >
          <span className="material-icons text-sm">arrow_back</span>
          Prev
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((previous) => Math.min(previous + 1, questions.length - 1))}
            className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-eme-navy to-eme-blue text-white text-xs font-black flex items-center justify-center gap-1 active:scale-95 shadow-md"
          >
            Next
            <span className="material-icons text-sm">arrow_forward</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirmSubmit}
            disabled={submitting}
            className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black flex items-center justify-center gap-1 active:scale-95 shadow-md"
          >
            Submit
          </button>
        )}
      </div>

      {/* Mobile Question Palette Modal / Drawer */}
      {showMobilePalette && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0">
          <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl p-6 shadow-2xl border-t border-slate-200 dark:border-slate-800 max-h-[80vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-heading text-lg font-black text-slate-900 dark:text-white">Question Palette</h3>
                <p className="text-xs font-bold text-slate-400">Select any question to jump directly</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowMobilePalette(false)} 
                className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2.5 my-6 overflow-y-auto max-h-60 p-1">
              {questions.map((_, index) => {
                const isCurrent = index === currentIndex;
                const isAnswered = answers[index] !== -1;
                const isFlagged = flagged[index];

                let btnClass = "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700";
                if (isAnswered) btnClass = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300 font-black";
                if (isFlagged) btnClass = "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300 font-black";

                const activeClass = isCurrent ? "ring-2 ring-eme-cyan ring-offset-2 scale-105 z-10" : "";

                return (
                  <button
                    key={`mob-palette-${index}`}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(index);
                      setShowMobilePalette(false);
                    }}
                    className={`h-11 rounded-xl text-xs font-black border flex items-center justify-center ${btnClass} ${activeClass}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowMobilePalette(false)}>
                Close
              </Button>
              <Button variant="danger" className="flex-1 text-xs" onClick={handleConfirmSubmit} loading={submitting}>
                Submit Exam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Exam;
