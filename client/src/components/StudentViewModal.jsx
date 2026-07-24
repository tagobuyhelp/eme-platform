import PropTypes from "prop-types";
import { useState } from "react";
import Button from "./Button";
import IdCard from "./IdCard";
import api from "../services/api";

function StudentViewModal({ student, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "idcard" | "documents"

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-dark-card shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all my-8">
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-icons text-xl">close</span>
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="h-20 w-20 shrink-0 rounded-2xl bg-white/10 border-2 border-white/20 shadow-inner flex items-center justify-center text-white text-3xl font-extrabold overflow-hidden">
              {student.profilePhoto ? (
                <img src={student.profilePhoto} alt={student.fullName} className="h-full w-full object-cover" />
              ) : (
                (student.fullName || "S").charAt(0).toUpperCase()
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-indigo-200 border border-white/10">
                  {student.studentId || "PENDING ID"}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    student.status === "active"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : student.status === "pending"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {student.status}
                </span>
              </div>

              <h2 className="mt-1 font-heading text-2xl font-extrabold text-white tracking-tight">
                {student.fullName}
              </h2>
              <p className="text-xs text-indigo-200 font-medium">
                {student.course ? `Course: ${student.course}` : "Course Not Assigned"}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-6 border-b border-white/10">
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
                activeTab === "profile"
                  ? "border-white text-white"
                  : "border-transparent text-indigo-200 hover:text-white"
              }`}
            >
              <span className="material-icons text-sm align-middle mr-1.5">person</span>
              Overview & Details
            </button>

            {student.status === "active" && (
              <button
                onClick={() => setActiveTab("idcard")}
                className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
                  activeTab === "idcard"
                    ? "border-white text-white"
                    : "border-transparent text-indigo-200 hover:text-white"
                }`}
              >
                <span className="material-icons text-sm align-middle mr-1.5">badge</span>
                Digital ID Card
              </button>
            )}

            <button
              onClick={() => setActiveTab("documents")}
              className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
                activeTab === "documents"
                  ? "border-white text-white"
                  : "border-transparent text-indigo-200 hover:text-white"
              }`}
            >
              <span className="material-icons text-sm align-middle mr-1.5">folder</span>
              Documents ({student.documents?.length || 0})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Tab 1: Profile Details */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Student ID</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
                    {student.studentId || "Unassigned"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mobile Number</p>
                  <p className="mt-1 text-sm font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <span className="material-icons text-base">phone_android</span>
                    {student.phone ? `+91 ${student.phone}` : "Not Provided"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {student.email || "Not Provided"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Enrolled Course</p>
                  <p className="mt-1 text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {student.course || "General"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Account Status</p>
                  <p className="mt-1 text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {student.status}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Created At</p>
                  <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {student.createdAt ? new Date(student.createdAt).toLocaleDateString("en-IN") : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: ID Card */}
          {activeTab === "idcard" && (
            <div className="flex flex-col items-center justify-center py-4 space-y-4 animate-fade-in">
              <IdCard student={student} />
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="mt-2 flex items-center gap-2"
              >
                <span className="material-icons text-lg">print</span>
                Print Official ID Card
              </Button>
            </div>
          )}

          {/* Tab 3: Documents */}
          {activeTab === "documents" && (
            <div className="space-y-4 animate-fade-in">
              {student.documents && student.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {student.documents.map((docUrl, idx) => (
                    <a
                      key={idx}
                      href={`${api.defaults.baseURL}/students/preview?url=${encodeURIComponent(docUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <span className="material-icons">description</span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          Verification Doc #{idx + 1}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">Click to view/download</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="material-icons text-4xl text-slate-300 dark:text-slate-600">folder_off</span>
                  <p className="mt-2 text-sm font-semibold text-slate-500">No verification documents uploaded yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>

          {onEdit && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onEdit(student);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <span className="material-icons text-base">edit</span>
              Edit Candidate Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

StudentViewModal.propTypes = {
  student: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
};

export default StudentViewModal;
