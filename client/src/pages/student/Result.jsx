import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import ResultCard from "../../components/ResultCard";
import Button from "../../components/Button";
import api from "../../services/api";

function Result() {
  const location = useLocation();
  const { id } = useParams();
  const [results, setResults] = useState([]);
  const [examTitle, setExamTitle] = useState(location.state?.examTitle || "");
  const [loading, setLoading] = useState(!location.state?.resultPayload);
  const [error, setError] = useState("");

  useEffect(() => {
    if (location.state?.resultPayload) {
      return;
    }

    const loadResults = async () => {
      try {
        setLoading(true);
        const [resultsResponse, examResponse] = await Promise.all([
          api.get("/results/my"),
          api.get(`/exams/${id}`),
        ]);

        setResults(resultsResponse.data.results || []);
        setExamTitle(examResponse.data.exam?.title || "Exam Result");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load result");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [id, location.state?.resultPayload]);

  const result = useMemo(() => {
    if (location.state?.resultPayload) {
      return location.state.resultPayload.result;
    }

    return results.find((item) => item.examId === id) || null;
  }, [id, location.state?.resultPayload, results]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center rounded-3xl bg-white border border-slate-200/80 p-8 text-sm font-bold text-slate-400">Loading result...</div>;
  }

  return (
    <div className="space-y-5 md:space-y-8">
      <section>
        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-indigo-600">Performance</p>
        <h1 className="mt-1 font-heading text-2xl md:text-3xl font-extrabold text-slate-900">Result Summary</h1>
      </section>

      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">{error}</div> : null}

      {result ? <ResultCard result={result} examTitle={examTitle} /> : null}

      {result ? (
        <section className="grid gap-4 md:gap-6 md:grid-cols-3">
          <article className="rounded-2xl md:rounded-3xl bg-white p-5 md:p-6 shadow-sm border border-slate-200/80 relative overflow-hidden group">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Final Score</p>
            <p className="mt-1 md:mt-2 font-heading text-4xl md:text-5xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">{result.score}</p>
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
              <span className="material-icons text-[100px]">military_tech</span>
            </div>
          </article>
          
          <article className={`rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border relative overflow-hidden ${
            result.status === "pass" ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
          }`}>
            <p className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${result.status === "pass" ? "text-emerald-600" : "text-rose-600"}`}>Status</p>
            <p className={`mt-1 md:mt-2 font-heading text-3xl md:text-4xl font-black tracking-tighter ${result.status === "pass" ? "text-emerald-700" : "text-rose-700"}`}>{result.status.toUpperCase()}</p>
          </article>
          
          <article className="rounded-2xl md:rounded-3xl bg-white p-5 md:p-6 shadow-sm border border-slate-200/80 relative overflow-hidden">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Assessment Name</p>
            <p className="mt-1 md:mt-2 font-heading text-xl md:text-2xl font-bold text-slate-800 leading-tight">{examTitle}</p>
          </article>
        </section>
      ) : (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm border border-slate-200/80">
          <div className="mx-auto h-16 w-16 bg-slate-50 flex items-center justify-center rounded-full mb-4">
             <span className="material-icons text-3xl text-slate-300">hide_source</span>
          </div>
          <p className="text-sm font-bold text-slate-500">No result found for this exam.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 pt-4">
        <Link to="/student/exams">
          <Button variant="outline">
            <span className="material-icons text-[18px]">arrow_back</span>
            Back to Exams
          </Button>
        </Link>
        <Link to="/student/certificates">
          <Button variant="primary">
            <span className="material-icons text-[18px]">workspace_premium</span>
            View Certificates
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default Result;
