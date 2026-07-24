import { useEffect, useMemo, useState } from "react";

import FormInput from "../../components/FormInput";
import Table from "../../components/Table";
import Button from "../../components/Button";
import IdCard from "../../components/IdCard";
import StudentViewModal from "../../components/StudentViewModal";
import StudentEditModal from "../../components/StudentEditModal";
import api from "../../services/api";

function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewingStudentModal, setViewingStudentModal] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [courses, setCourses] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const loadStudentsAndCourses = async () => {
      try {
        const [studentsRes, coursesRes] = await Promise.all([
           api.get("/students"),
           api.get("/courses?status=active")
        ]);
        setStudents(studentsRes.data.students || []);
        setCourses(coursesRes.data.courses || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load data");
      }
    };

    loadStudentsAndCourses();
  }, []);

  const [selectedCourseFilter, setSelectedCourseFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  const availableCourses = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => { if (c.title) set.add(c.title); });
    students.forEach((s) => { if (s.course) set.add(s.course); });
    return Array.from(set).sort();
  }, [courses, students]);

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        student.fullName.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        (student.course || "").toLowerCase().includes(query) ||
        (student.studentId || "").toLowerCase().includes(query) ||
        (student.phone || "").includes(query);

      const matchesCourse =
        selectedCourseFilter === "ALL" ||
        (student.course || "").toLowerCase() === selectedCourseFilter.toLowerCase();

      const matchesStatus =
        selectedStatusFilter === "ALL" ||
        (student.status || "").toLowerCase() === selectedStatusFilter.toLowerCase();

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [search, selectedCourseFilter, selectedStatusFilter, students]);

  const handleEdit = (student) => {
    setIsCreating(false);
    setSelectedStudent(student);
    setEditingStudent({
      fullName: student.fullName,
      email: student.email,
      phone: student.phone || "",
      course: student.course || "",
      status: student.status,
      studentId: student.studentId || "",
      profilePhoto: student.profilePhoto || "",
      documents: student.documents || [],
    });
  };

  const handleCreate = () => {
    setSelectedStudent(null);
    setIsCreating(true);
    setEditingStudent({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      course: "",
      status: "active",
      studentId: "",
      profilePhoto: "",
      documents: [],
    });
  };

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleAdminPhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setError("");
      
      const formData = new FormData();
      formData.append("document", file);

      const response = await api.post("/students/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEditingStudent(prev => ({ ...prev, profilePhoto: response.data.url }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAdminDocUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDoc(true);
      setError("");
      
      const formData = new FormData();
      formData.append("document", file);

      const response = await api.post("/students/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEditingStudent(prev => ({ ...prev, documents: [...(prev.documents || []), response.data.url] }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeDocument = (indexToRemove) => {
    setEditingStudent(prev => ({
      ...prev,
      documents: prev.documents.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!editingStudent) return;

    try {
      setSaving(true);
      if (isCreating) {
        // Step 1: Create Auth User
        const authRes = await api.post("/auth/register", {
          name: editingStudent.fullName,
          email: editingStudent.email,
          password: editingStudent.password || "eme12345",
          role: "student"
        });
        
        // Step 2: Create Student Profile
        const newStudentData = {
          userId: authRes.data.user.id,
          fullName: editingStudent.fullName,
          email: editingStudent.email,
          phone: editingStudent.phone,
          course: editingStudent.course,
          status: editingStudent.status,
          studentId: editingStudent.studentId || undefined,
          profilePhoto: editingStudent.profilePhoto,
          documents: editingStudent.documents,
        };
        const response = await api.post("/students", newStudentData);
        setStudents((prev) => [response.data.student, ...prev]);
        setSelectedStudent(response.data.student);
        setIsCreating(false);
      } else {
        const response = await api.put(`/students/${selectedStudent._id}`, editingStudent);
        setStudents((previous) =>
          previous.map((student) => (student._id === selectedStudent._id ? response.data.student : student))
        );
        setSelectedStudent(response.data.student);
      }
      setEditingStudent(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save student");
    } finally {
      setSaving(false);
    }
  };

  const generateRandomId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setEditingStudent((prev) => ({ ...prev, studentId: `EME-${year}-${randomNum}` }));
  };

  const columns = [
    { key: "studentId", label: "Student ID", render: (val) => val || <span className="text-slate-400 italic text-xs">Unassigned</span> },
    { 
      key: "fullName", 
      label: "Student Name",
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-lg font-bold overflow-hidden shadow-sm">
            {row.profilePhoto ? (
              <img src={row.profilePhoto} alt={val} className="h-full w-full object-cover" />
            ) : (
              (val || "S").charAt(0).toUpperCase()
            )}
          </div>
          <span className="font-semibold whitespace-nowrap">{val}</span>
        </div>
      )
    },
    { key: "course", label: "Course" },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        let badgeClass = "bg-slate-100 text-slate-600 border-slate-200";
        if (value === "active") badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (value === "pending") badgeClass = "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
        if (value === "rejected") badgeClass = "bg-rose-50 text-rose-700 border-rose-200";

        return (
          <span className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedStudent(row);
              setViewingStudentModal(row);
            }}
            className="!px-3 !py-1.5 !text-xs flex items-center gap-1"
          >
            <span className="material-icons text-[14px]">visibility</span>
            View
          </Button>
          <Button
            variant="primary"
            onClick={() => handleEdit(row)}
            className="!px-3 !py-1.5 !text-xs flex items-center gap-1"
          >
            <span className="material-icons text-[14px]">edit</span>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [excelMsg, setExcelMsg] = useState("");

  const handleExcelImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingExcel(true);
      setError("");
      setExcelMsg("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/students/import-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setExcelMsg(response.data.message || "Candidates imported successfully");
      const studentsRes = await api.get("/students");
      setStudents(studentsRes.data.students || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to import Excel file");
    } finally {
      setUploadingExcel(false);
      event.target.value = "";
    }
  };

  return (
    <div className="w-full space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Verification Queue</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold text-slate-900">Manage Enrollments</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl items-end">
          <div className="flex-1 w-full">
            <FormInput label="Search students" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, ID, or course" />
          </div>

          <label className="sm:mb-0 mb-2 cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/50 hover:bg-indigo-100/60 px-4 py-3 text-xs font-bold text-indigo-700 transition-colors shrink-0">
            <span className="material-icons text-indigo-600 text-lg">upload_file</span>
            {uploadingExcel ? "Importing..." : "Import Candidate Excel"}
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelImport} disabled={uploadingExcel} className="hidden" />
          </label>

          <Button onClick={handleCreate} variant="primary" className="whitespace-nowrap shrink-0">
            + New Student
          </Button>
        </div>
      </section>

      {excelMsg ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700 border border-emerald-200 flex items-center gap-2"><span className="material-icons">check_circle</span>{excelMsg}</div> : null}
      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">{error}</div> : null}

      {/* ─── COURSE & STATUS FILTER BAR ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="material-icons text-indigo-600 text-lg">filter_alt</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Filter By:</span>
          </div>

          {/* Course Filter Dropdown */}
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Courses ({students.length})</option>
            {availableCourses.map((c) => {
              const count = students.filter((s) => (s.course || "").toLowerCase() === c.toLowerCase()).length;
              return (
                <option key={c} value={c}>
                  {c} ({count})
                </option>
              );
            })}
          </select>

          {/* Status Filter Dropdown */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
            <option value="inactive">Inactive</option>
          </select>

          {(selectedCourseFilter !== "ALL" || selectedStatusFilter !== "ALL" || search) && (
            <button
              onClick={() => {
                setSelectedCourseFilter("ALL");
                setSelectedStatusFilter("ALL");
                setSearch("");
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1 ml-1"
            >
              <span className="material-icons text-sm">clear</span>
              Reset Filters
            </button>
          )}
        </div>

        {/* Candidate Counter Badge */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs font-semibold text-slate-500">Showing:</span>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
            {filteredStudents.length} of {students.length} Candidates
          </span>
        </div>
      </div>

      <Table columns={columns} rows={filteredStudents} emptyMessage="No students found matching your filter criteria" />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 h-fit">
          <h2 className="font-heading text-xl font-extrabold text-slate-900 mb-5">Student Dossier</h2>
          {selectedStudent ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="h-16 w-16 shrink-0 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-xl font-bold overflow-hidden shadow-sm">
                  {selectedStudent.profilePhoto ? (
                    <img src={selectedStudent.profilePhoto} alt={selectedStudent.fullName} className="h-full w-full object-cover" />
                  ) : (
                    (selectedStudent.fullName || "S").charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{selectedStudent.fullName}</h3>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{selectedStudent.studentId || "PENDING ID"}</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-2"><span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Email</span> <span className="font-semibold text-slate-900">{selectedStudent.email}</span></div>
                <div className="flex justify-between border-b border-slate-100 pb-2"><span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Phone</span> <span className="font-semibold text-slate-900">{selectedStudent.phone || "Not provided"}</span></div>
                <div className="flex justify-between border-b border-slate-100 pb-2"><span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Course</span> <span className="font-bold text-emerald-600">{selectedStudent.course || "Not selected"}</span></div>
                <div className="flex justify-between pb-2"><span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Status</span> <span className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">{selectedStudent.status}</span></div>
              </div>

              <div>
                <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mb-3">Verification Documents</h3>
                {selectedStudent.documents && selectedStudent.documents.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedStudent.documents.map((docUrl, idx) => (
                      <a key={idx} href={`${api.defaults.baseURL}/students/preview?url=${encodeURIComponent(docUrl)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                        <span className="material-icons text-indigo-500">description</span>
                        <span className="text-xs font-bold text-slate-700 truncate">Document {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-rose-500 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">No documents uploaded.</p>
                )}
              </div>

              {selectedStudent.status === "active" && (
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mb-4">Official ID Card</h3>
                  <div className="flex justify-center">
                    <IdCard student={selectedStudent} />
                  </div>
                  <Button variant="outline" className="w-full mt-4 flex justify-center gap-2" onClick={() => window.print()}>
                    <span className="material-icons text-[18px]">print</span>
                    Print ID Card
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="material-icons text-slate-400 text-xl">folder_shared</span>
              <p className="text-sm font-medium text-slate-500">Select a student from the queue to review their documents.</p>
            </div>
          )}
        </article>
      </section>

      {/* Student Profile Details View Modal */}
      {viewingStudentModal && (
        <StudentViewModal
          student={viewingStudentModal}
          onClose={() => setViewingStudentModal(null)}
          onEdit={handleEdit}
        />
      )}

      {/* Student Profile Edit / Create Modal */}
      {editingStudent && (
        <StudentEditModal
          editingStudent={editingStudent}
          setEditingStudent={setEditingStudent}
          isCreating={isCreating}
          courses={courses}
          onClose={() => {
            setEditingStudent(null);
            setIsCreating(false);
          }}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}

export default Students;
