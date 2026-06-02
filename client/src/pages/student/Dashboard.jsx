import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";
import ErrorAlert from "../../components/ErrorAlert";

function Dashboard() {
  const [student, setStudent] = useState(null);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [examsResponse, resultsResponse, certificatesResponse] = await Promise.all([
          api.get("/exams"),
          api.get("/results/my"),
          api.get("/certificates/my"),
        ]);

        setExams(examsResponse.data.exams || []);
        setResults(resultsResponse.data.results || []);
        setCertificates(certificatesResponse.data.certificates || []);

        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        setStudent(storedUser);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const total = exams.length;
    
    // A student can have multiple results for the same exam now.
    // Count how many unique exams they have PASSED.
    const passedExamIds = new Set(
      results.filter(r => r.status === "pass").map(r => r.examId)
    );
    const completed = passedExamIds.size;
    
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    return {
      totalExams: total,
      completedExams: completed,
      certificatesEarned: certificates.length,
      completionRate,
    };
  }, [certificates.length, exams.length, results.length]);

  const latestResult = results[0] || null;
  const latestCertificate = certificates[0] || null;

  const latestResultTitle = useMemo(() => {
    if (!latestResult) return "";
    const matched = exams.find((e) => e._id === latestResult.examId);
    return matched ? matched.title : "Exam";
  }, [latestResult, exams]);

  const bgImages = [
    '/asset/images/eme-students-in-class-2.webp',
    '/asset/images/eme-students-in-class.webp'
  ];
  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bgImages.length]);

  if (loading) return <Loader />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="w-full space-y-6 md:space-y-10 pb-6 md:pb-10">
      {/* 1. Modern Deep Slate Welcome Banner */}
      <section 
        className="relative overflow-hidden rounded-3xl md:rounded-[2rem] bg-cover bg-center p-5 md:p-10 text-white shadow-2xl shadow-indigo-500/20 isolate transition-all duration-1000 ease-in-out"
        style={{ backgroundImage: `url('${bgImages[currentBg]}')` }}
      >
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
        <div className="absolute -right-10 -top-20 h-96 w-96 rounded-full bg-indigo-500 opacity-30 mix-blend-screen blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-cyan-500 opacity-20 mix-blend-screen blur-[60px] pointer-events-none"></div>
        
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-60 mask-image:linear-gradient(to_bottom,white,transparent) pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="max-w-2xl">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-indigo-400 drop-shadow-sm mb-2 md:mb-3">Welcome Back</p>
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
              Hello, {student?.name || "Student"}
            </h1>
            <p className="mt-3 md:mt-4 text-base md:text-lg text-slate-300 font-medium leading-relaxed max-w-xl opacity-90">
              Continue your learning journey, conquer assessments, and build your professional portfolio.
            </p>
            <div className="mt-6 md:mt-8 flex gap-4">
              <Link to="/student/exams" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 transition-all hover:bg-slate-100 hover:shadow-lg hover:-translate-y-0.5">
                Take an Exam
                <span className="material-icons text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="h-40 w-40 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-white/5 rounded-[2.5rem] rotate-6 backdrop-blur-sm border border-white/10 transition-transform duration-700 hover:rotate-12"></div>
              <div className="absolute inset-0 bg-white/10 rounded-[2.5rem] -rotate-3 backdrop-blur-md border border-white/20 transition-transform duration-700 hover:-rotate-6"></div>
              <span className="material-icons text-white text-7xl relative z-10 drop-shadow-lg">school</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Modern Minimalist Stat Cards */}
      <section className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Available Exams", value: stats.totalExams, icon: "library_books", color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Exams Completed", value: stats.completedExams, icon: "task_alt", color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Certificates Earned", value: stats.certificatesEarned, icon: "verified", color: "text-emerald-600", bg: "bg-emerald-50" }
        ].map((stat, idx) => (
          <div key={idx} className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-white p-5 md:p-6 border border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 md:mb-2">{stat.label}</p>
                <p className="font-heading text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
              </div>
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 ${stat.bg} ${stat.color}`}>
                <span className="material-icons text-3xl">{stat.icon}</span>
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${idx === 0 ? 'from-indigo-500 to-indigo-400' : idx === 1 ? 'from-violet-500 to-violet-400' : 'from-emerald-500 to-emerald-400'} transition-all duration-500 group-hover:w-full`}></div>
          </div>
        ))}
      </section>

      {/* 3. Main Dashboard Content */}
      <section className="grid grid-cols-1 gap-5 md:gap-8 lg:grid-cols-3">
        
        {/* Left Side: Completion Tracker & Recent performance */}
        <div className="lg:col-span-2 space-y-5 md:space-y-8">
          
          {/* Progress Tracker Card */}
          <article className="rounded-2xl md:rounded-3xl bg-white p-5 md:p-8 shadow-sm border border-slate-200/80 group hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-5 md:mb-8 border-b border-slate-100 pb-4 md:pb-6">
              <div>
                <h2 className="font-heading text-lg md:text-2xl font-extrabold text-slate-900">Academic Progress</h2>
                <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">Your overall exam completion milestone.</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-icons">track_changes</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row md:items-center gap-6 md:gap-10">
              <div className="relative flex items-center justify-center h-28 w-28 md:h-36 md:w-36 shrink-0 mx-auto sm:mx-0">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 144 144">
                  <circle cx="72" cy="72" r="60" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    fill="transparent"
                    stroke="url(#progressGradient)"
                    strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 - (stats.completionRate / 100) * (2 * Math.PI * 60)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full pointer-events-none">
                  <span className="text-3xl font-extrabold text-slate-900">{stats.completionRate}%</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-3 md:space-y-4 text-center sm:text-left">
                <h3 className="text-lg md:text-xl font-bold text-slate-900">You&apos;re making great progress!</h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
                  You have successfully completed <span className="text-indigo-700 font-extrabold text-base md:text-lg bg-indigo-50 px-2 py-0.5 rounded">{stats.completedExams}</span> out of{" "}
                  <span className="text-indigo-700 font-extrabold text-base md:text-lg bg-indigo-50 px-2 py-0.5 rounded">{stats.totalExams}</span> available exams.
                </p>
                <div className="mt-3 md:mt-4 flex items-center justify-center sm:justify-start gap-2 text-[11px] md:text-sm font-bold text-violet-600">
                  <span className="material-icons text-base">emoji_events</span> Keep going to unlock more certificates!
                </div>
              </div>
            </div>
          </article>

          {/* Performance Timeline */}
          <article className="rounded-2xl md:rounded-3xl bg-white p-5 md:p-8 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-5 md:mb-8 border-b border-slate-100 pb-4 md:pb-6">
              <h2 className="font-heading text-lg md:text-2xl font-extrabold text-slate-900">Recent Activity</h2>
              <Link to="/student/exams" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
                View All <span className="material-icons text-sm">arrow_forward</span>
              </Link>
            </div>

            <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
              {latestResult ? (
                <div className="relative">
                  {/* Timeline Dot */}
                  <span className={`absolute -left-[35px] top-1 h-5 w-5 rounded-full border-4 border-white ${latestResult.status === 'pass' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-sm`}></span>
                  
                  <div className="group rounded-2xl bg-slate-50 p-4 md:p-6 border border-slate-200/60 hover:border-indigo-300 hover:shadow-md hover:bg-white transition-all">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 md:mb-2">Latest Assessment • {new Date(latestResult.createdAt).toLocaleDateString()}</p>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 md:gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-lg md:text-xl font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">{latestResultTitle}</p>
                        <p className="mt-1 md:mt-2 text-xs md:text-sm font-medium text-slate-500 flex items-center gap-1">
                          <span className="material-icons text-sm">score</span> Score: <strong className="text-slate-800">{latestResult.score} marks</strong>
                        </p>
                      </div>
                      <div className="shrink-0">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
                          latestResult.status === "pass" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          <span className="material-icons text-sm">{latestResult.status === 'pass' ? 'check_circle' : 'cancel'}</span>
                          {latestResult.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 font-medium py-4">No recent activity found. Take an exam to see your timeline!</p>
              )}
            </div>
          </article>
        </div>

        {/* Right Side: Modern Minimalist Certificate Showcase Card */}
        <div className="lg:col-span-1">
          <article className="rounded-2xl md:rounded-3xl bg-white p-5 md:p-8 shadow-sm border border-slate-200/80 h-full flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
            
            <div className="mb-5 md:mb-8 relative z-10">
              <h2 className="font-heading text-lg md:text-2xl font-extrabold text-slate-900">Credential</h2>
              <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">Your latest verified achievement</p>
            </div>

            {latestCertificate ? (
              <div className="flex-1 flex flex-col">
                {/* Modern Dark Minimalist Certificate Mockup */}
                <div className="relative mt-2 flex-1 rounded-2xl bg-slate-900 p-6 border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center overflow-hidden transition-transform duration-500 hover:-translate-y-1">
                  
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 h-20 w-20 bg-indigo-500/10 rounded-bl-[3rem] flex items-start justify-end p-4">
                    <span className="material-icons text-indigo-400/50 text-3xl">verified</span>
                  </div>
                  
                  {/* Watermark */}
                  <span className="material-icons text-9xl absolute text-white/5 rotate-[-20deg] pointer-events-none">workspace_premium</span>

                  <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-md shadow-sm flex items-center justify-center mb-4 z-10 border border-white/20">
                    <span className="material-icons text-4xl text-indigo-400">military_tech</span>
                  </div>
                  
                  <h4 className="font-heading font-black text-white text-lg tracking-wide uppercase z-10 relative">Certificate of Excellence</h4>
                  
                  <div className="w-12 h-0.5 bg-indigo-500 my-4 z-10"></div>
                  
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest z-10">Credential ID</p>
                  <p className="text-xs font-mono font-medium text-slate-300 mt-1 z-10 bg-black/30 px-2 py-1 rounded border border-white/10">{latestCertificate.certificateId}</p>
                  
                  <p className="text-xs text-slate-400 mt-4 font-medium z-10 flex items-center gap-1">
                    <span className="material-icons text-xs">event</span>
                    {new Date(latestCertificate.issuedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                <div className="mt-8 grid gap-3">
                  <a
                    href={latestCertificate.certificateUrl || `${import.meta.env.VITE_API_URL || '/api'}/certificates/download/${latestCertificate.certificateId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-[0.98]"
                  >
                    <span className="material-icons text-base">download</span>
                    Download Official PDF
                  </a>
                  <Link
                    to="/student/certificates"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all active:scale-[0.98]"
                  >
                    <span className="material-icons text-base">inventory_2</span>
                    View All Credentials
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <span className="material-icons text-5xl text-slate-300">workspace_premium</span>
                </div>
                <h4 className="font-bold text-slate-700 text-lg">No Certificates Yet</h4>
                <p className="text-sm font-medium text-slate-500 mt-2 text-center">Complete exams successfully to unlock verified credentials.</p>
              </div>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
