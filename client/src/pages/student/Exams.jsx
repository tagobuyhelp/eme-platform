import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import ExamCard from "../../components/ExamCard";
import api from "../../services/api";

function Exams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [examsResponse, resultsResponse] = await Promise.all([
          api.get("/exams"),
          api.get("/results/my"),
        ]);

        setExams(examsResponse.data.exams || []);
        setResults(resultsResponse.data.results || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load exams");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getExamStatus = (examId) => {
    const examResults = results.filter((r) => r.examId === examId);
    const hasPassed = examResults.some((r) => r.status === "pass");
    return {
      attemptsCount: examResults.length,
      hasPassed,
    };
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center rounded-3xl bg-white border border-slate-200/80 p-8 text-sm font-bold text-slate-400">Loading exams...</div>;
  }

  return (
    <div className="w-full space-y-5 md:space-y-8">
      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Exam Center</p>
        <h1 className="mt-1 font-heading text-2xl md:text-3xl font-extrabold text-slate-900">Available Exams</h1>
        <p className="mt-1 md:mt-2 max-w-2xl text-xs md:text-sm font-medium text-slate-500 leading-relaxed">
          Review available exams, see your completion status, and begin your next assessment with confidence.
        </p>
      </section>

      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">{error}</div> : null}

      <section className="grid grid-cols-1 gap-4 md:gap-6">
        {exams.map((exam) => {
          const { attemptsCount, hasPassed } = getExamStatus(exam._id);
          return (
            <ExamCard
              key={exam._id}
              exam={exam}
              attemptsCount={attemptsCount}
              hasPassed={hasPassed}
              onStart={(id) => navigate(`/student/exam/${id}`)}
            />
          );
        })}
      </section>
    </div>
  );
}

export default Exams;
