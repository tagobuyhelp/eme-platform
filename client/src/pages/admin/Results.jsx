import { useEffect, useMemo, useState } from "react";

import Table from "../../components/Table";
import api from "../../services/api";
import Loader from "../../components/Loader";

function Results() {
  const [selectedExam, setSelectedExam] = useState("all");
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadExams = async () => {
      try {
        const response = await api.get("/exams");
        setExams(response.data.exams || []);
      } catch (err) {
        console.error("Failed to load exams:", err);
      }
    };
    loadExams();
  }, []);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        const url = selectedExam === "all" ? "/results/admin" : `/results/admin?examId=${selectedExam}`;
        const response = await api.get(url);
        setResults(response.data.results || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load result overview");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [selectedExam]);

  const rows = useMemo(() => {
    return results.map((res) => ({
      id: res._id,
      student: res.studentId?.fullName || "N/A",
      email: res.studentId?.email || "N/A",
      exam: res.examId?.title || "N/A",
      score: res.score,
      status: res.status,
    }));
  }, [results]);

  const columns = [
    { key: "student", label: "Student" },
    { key: "email", label: "Email" },
    { key: "exam", label: "Exam" },
    { key: "score", label: "Score" },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const badgeClasses = value === "pass"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : value === "fail"
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : "bg-slate-50 text-slate-700 border-slate-200";

        return <span className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider border ${badgeClasses}`}>{value}</span>;
      },
    },
  ];

  return (
    <div className="w-full space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Results Monitor</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold text-slate-900">Results Overview</h1>
        </div>
        <div className="w-full max-w-xs">
          <label className="block">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Filter by exam</span>
            <select value={selectedExam} onChange={(event) => setSelectedExam(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10">
              <option value="all">All exams</option>
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">{error}</div> : null}

      {loading ? (
        <div className="flex justify-center p-10"><Loader /></div>
      ) : (
        <Table columns={columns} rows={rows} emptyMessage="No results available" />
      )}
    </div>
  );
}

export default Results;
