import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import ErrorAlert from "../../components/ErrorAlert";

function Dashboard() {
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [studentsResponse, examsResponse, resultsResponse] = await Promise.all([
          api.get("/students"),
          api.get("/exams"),
          api.get("/results/admin"),
        ]);

        setStudents(studentsResponse.data.students || []);
        setExams(examsResponse.data.exams || []);
        setResults(resultsResponse.data.results || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const certificatesCount = useMemo(() => {
    return results.filter((r) => r.status === "pass").length;
  }, [results]);

  const recentStudents = useMemo(() => students.slice(0, 5), [students]);
  const recentExams = useMemo(() => exams.slice(0, 5), [exams]);

  // Chart computations
  const analytics = useMemo(() => {
    const total = results.length;
    if (!total) return { passPercent: 0, failPercent: 0, passCount: 0, failCount: 0 };
    const pass = results.filter((r) => r.status === "pass").length;
    const fail = total - pass;
    return {
      passCount: pass,
      failCount: fail,
      passPercent: Math.round((pass / total) * 100),
      failPercent: Math.round((fail / total) * 100),
    };
  }, [results]);

  const examAttempts = useMemo(() => {
    const map = {};
    results.forEach((r) => {
      const title = r.examId?.title || "Deleted Exam";
      map[title] = (map[title] || 0) + 1;
    });
    const sorted = Object.entries(map)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count);
    return sorted.slice(0, 5);
  }, [results]);

  if (loading) return <Loader />;
  if (error) return <ErrorAlert message={error} />;

  // Donut chart math
  const strokeWidth = 14;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const passStrokeDashoffset = circumference - (analytics.passPercent / 100) * circumference;

  return (
    <div className="w-full space-y-10 pb-10">
      
      {/* 2. Modern Minimalist Stat Cards */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Students", value: students.length, icon: "groups", color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Active Exams", value: exams.length, icon: "assignment", color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Total Attempts", value: results.length, icon: "analytics", color: "text-sky-500", bg: "bg-sky-50" },
          { label: "Certificates", value: certificatesCount, icon: "workspace_premium", color: "text-emerald-500", bg: "bg-emerald-50" }
        ].map((stat, idx) => (
          <div key={idx} className="group relative overflow-hidden rounded-3xl bg-white p-6 border border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                <p className="font-heading text-4xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
              </div>
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${stat.bg} ${stat.color}`}>
                <span className="material-icons text-3xl">{stat.icon}</span>
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${idx === 0 ? 'from-indigo-500 to-indigo-400' : idx === 1 ? 'from-violet-500 to-violet-400' : idx === 2 ? 'from-sky-500 to-sky-400' : 'from-emerald-500 to-emerald-400'} transition-all duration-500 group-hover:w-full`}></div>
          </div>
        ))}
      </section>

      {/* 3. Analytics Panel Redesign */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Donut Chart Card */}
        <article className="lg:col-span-1 rounded-3xl bg-white p-8 shadow-sm border border-slate-200/80 flex flex-col justify-between group hover:shadow-md transition-shadow duration-300">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading text-xl font-bold text-slate-900">Pass Rate Dynamics</h3>
              <span className="material-icons text-slate-400 cursor-help" title="Overall pass vs fail distribution">info_outline</span>
            </div>
            <p className="text-sm font-medium text-slate-500">Institutional performance summary</p>
          </div>

          <div className="flex flex-col items-center justify-center my-8 relative">
            {results.length > 0 ? (
              <div className="relative transform transition-transform duration-700 hover:scale-105">
                <svg width="200" height="200" viewBox="0 0 160 160" className="-rotate-90 filter drop-shadow-md">
                  {/* Background Track */}
                  <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#F1F5F9" strokeWidth={strokeWidth} />
                  {/* Pass Arc */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke="url(#passGradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={passStrokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="passGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full pointer-events-none">
                  <span className="text-4xl font-extrabold text-slate-900">{analytics.passPercent}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mt-1">Pass Rate</span>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-sm text-slate-400 font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100">Awaiting Analytics Data</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
            <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(79,70,229,0.5)]"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Passed</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{analytics.passCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Failed</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{analytics.failCount}</p>
            </div>
          </div>
        </article>

        {/* Top Active Exams Bar Chart Card */}
        <article className="lg:col-span-2 rounded-3xl bg-white p-8 shadow-sm border border-slate-200/80 flex flex-col justify-between group hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
            <div>
              <h3 className="font-heading text-xl font-bold text-slate-900">Top Active Exams</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Exams with the highest engagement</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="material-icons">bar_chart</span>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            {examAttempts.length > 0 ? (
              examAttempts.map((item) => {
                const maxCount = examAttempts[0].count;
                const widthPercent = Math.max(5, Math.round((item.count / maxCount) * 100));
                return (
                  <div key={item.title} className="group/bar relative">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-slate-700 truncate pr-4 max-w-[70%]">{item.title}</span>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                        {item.count} attempts
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 relative overflow-hidden transition-all duration-1000 ease-out"
                        style={{ width: `${widthPercent}%` }}
                      >
                        {/* Shimmer effect inside bar */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/bar:animate-[shimmer_1.5s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-slate-400 font-medium bg-slate-50 px-6 py-3 rounded-full border border-slate-100">Insufficient engagement data</p>
              </div>
            )}
          </div>
        </article>
      </section>

      {/* 4. Operations Activity Grid */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* Latest Students */}
        <article className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
            <h2 className="font-heading text-2xl font-extrabold text-slate-900">Recent Enrollments</h2>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">View All</button>
          </div>
          <div className="space-y-4">
            {recentStudents.length > 0 ? (
              recentStudents.map((student, index) => {
                const bgColors = ["bg-indigo-50 text-indigo-700", "bg-violet-50 text-violet-700", "bg-sky-50 text-sky-700", "bg-emerald-50 text-emerald-700", "bg-rose-50 text-rose-700"];
                const colorTheme = bgColors[index % bgColors.length];

                return (
                  <div key={student._id} className="group flex items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 hover:border-indigo-200 hover:shadow-md hover:bg-white transition-all cursor-pointer">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${colorTheme}`}>
                      {student.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{student.fullName}</p>
                      <p className="text-xs font-medium text-slate-500 truncate">{student.email}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-icons text-slate-300 group-hover:text-indigo-500">chevron_right</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center font-medium bg-slate-50 rounded-2xl border border-slate-100">No students registered yet</p>
            )}
          </div>
        </article>

        {/* Latest Exams */}
        <article className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
            <h2 className="font-heading text-2xl font-extrabold text-slate-900">Recently Created Exams</h2>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Manage</button>
          </div>
          <div className="space-y-4">
            {recentExams.length > 0 ? (
              recentExams.map((exam) => (
                <div key={exam._id} className="group flex items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 hover:border-violet-200 hover:shadow-md hover:bg-white transition-all cursor-pointer">
                  <div className="h-12 w-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-500/30">
                    <span className="material-icons text-xl">quiz</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 truncate group-hover:text-violet-600 transition-colors">{exam.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <span className="material-icons text-[12px]">schedule</span> {exam.duration || 0}m
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-500">
                        <span className="material-icons text-[12px]">fact_check</span> {exam.passMarks}/{exam.totalMarks} Pass
                      </span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-icons text-slate-300 group-hover:text-violet-500">chevron_right</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center font-medium bg-slate-50 rounded-2xl border border-slate-100">No exams created yet</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
