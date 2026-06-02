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
      className="space-y-6 select-none"
      onCopy={(e) => { e.preventDefault(); alert("Copying is disabled during the exam."); }}
      onCut={(e) => { e.preventDefault(); alert("Cutting is disabled during the exam."); }}
      onPaste={(e) => { e.preventDefault(); alert("Pasting is disabled during the exam."); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top bar with time and status */}
      <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Exam Interface</p>
            <h1 className="mt-1 font-heading text-2xl md:text-3xl font-extrabold text-slate-900">{exam.title}</h1>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{progressPercent}% Completed</span>
              <div className="w-48 bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-rose-50 border border-rose-100 px-6 py-4 text-center lg:text-right shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-rose-500 font-bold flex items-center justify-center lg:justify-end gap-1">
              <span className="material-icons text-[14px]">timer</span>
              Time Left
            </p>
            <p className="mt-1 text-3xl font-black text-rose-600 tracking-tighter tabular-nums">{formattedTime}</p>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">{error}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main MCQ display area */}
        <section className="lg:col-span-3 space-y-6 flex flex-col h-full">
          <article className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-slate-200/80 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Question <span className="text-indigo-600 text-sm">{currentIndex + 1}</span> of {questions.length}</span>
              <button
                type="button"
                onClick={toggleFlag}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                  flagged[currentIndex]
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 shadow-sm"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <span className="material-icons text-[16px]">{flagged[currentIndex] ? "flag" : "outlined_flag"}</span>
                {flagged[currentIndex] ? "Flagged for Review" : "Flag Question"}
              </button>
            </div>

            <div className="mt-8 flex-1">
              <h2 className="text-xl font-bold leading-relaxed text-slate-900">{currentQuestion.question}</h2>

              <div className="mt-8 grid gap-4">
                {currentQuestion.options.map((option, optionIndex) => {
                  const isSelected = answers[currentIndex] === optionIndex;

                  return (
                    <button
                      key={`${currentQuestion._id}-${optionIndex}`}
                      type="button"
                      onClick={() => handleSelect(optionIndex)}
                      className={`rounded-2xl border px-5 py-4 text-left transition-all flex justify-between items-center w-full group active:scale-[0.99] ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600/20"
                          : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                          isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 group-hover:border-indigo-400"
                        }`}>
                          {isSelected && <span className="h-2 w-2 rounded-full bg-white"></span>}
                        </div>
                        <span className={`text-[15px] ${isSelected ? "font-bold text-indigo-900" : "font-medium text-slate-700"}`}>{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-between border-t border-slate-100 pt-6">
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

        {/* Question Palette Sidebar */}
        <section className="lg:col-span-1">
          <aside className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-6 sticky top-24">
            <div>
              <h3 className="font-heading text-lg md:text-xl font-extrabold text-slate-900">Question Palette</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status Overview</p>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2.5 pt-2">
              {questions.map((_, index) => {
                const isCurrent = index === currentIndex;
                const isAnswered = answers[index] !== -1;
                const isFlagged = flagged[index];

                let btnClass = "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:border-slate-300";
                if (isAnswered) btnClass = "bg-emerald-50 text-emerald-600 border-emerald-200 font-bold hover:bg-emerald-100";
                if (isFlagged) btnClass = "bg-amber-50 text-amber-600 border-amber-200 font-bold hover:bg-amber-100";
                if (isAnswered && isFlagged) btnClass = "bg-gradient-to-br from-emerald-100 to-amber-100 text-slate-800 border-amber-300 font-bold";

                const activeClass = isCurrent ? "ring-2 ring-indigo-500 ring-offset-2 scale-110 z-10 shadow-sm" : "";

                return (
                  <button
                    key={`palette-${index}`}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`h-11 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center ${btnClass} ${activeClass}`}
                    title={`Question ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="border-t border-slate-100 pt-6 space-y-3 text-xs">
              <p className="flex items-center gap-3 font-bold text-slate-600">
                <span className="h-4 w-4 rounded-md bg-slate-50 border border-slate-200 shadow-inner"></span>
                <span className="uppercase tracking-widest text-[10px]">Unanswered</span>
              </p>
              <p className="flex items-center gap-3 font-bold text-emerald-700">
                <span className="h-4 w-4 rounded-md bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                </span>
                <span className="uppercase tracking-widest text-[10px]">Answered</span>
              </p>
              <p className="flex items-center gap-3 font-bold text-amber-700">
                <span className="h-4 w-4 rounded-md bg-amber-100 border border-amber-200 flex items-center justify-center">
                  <span className="material-icons text-[10px] text-amber-600">flag</span>
                </span>
                <span className="uppercase tracking-widest text-[10px]">Flagged</span>
              </p>
            </div>
            
            <div className="pt-2">
               <Button variant="danger" className="w-full text-xs" onClick={handleConfirmSubmit} loading={submitting}>
                 Finish & Submit
               </Button>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

export default Exam;
