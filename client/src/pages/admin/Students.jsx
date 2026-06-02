import { useEffect, useMemo, useState } from "react";

import FormInput from "../../components/FormInput";
import Table from "../../components/Table";
import Button from "../../components/Button";
import IdCard from "../../components/IdCard";
import api from "../../services/api";

function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
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

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase();
    return students.filter(
      (student) =>
        student.fullName.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        (student.course || "").toLowerCase().includes(query) ||
        (student.studentId || "").toLowerCase().includes(query)
    );
  }, [search, students]);

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
          <Button variant="outline" onClick={() => setSelectedStudent(row)} className="!px-3 !py-1.5 !text-xs">
            Review
          </Button>
          <Button variant="primary" onClick={() => handleEdit(row)} className="!px-3 !py-1.5 !text-xs">
            Action
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Verification Queue</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold text-slate-900">Manage Enrollments</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
          <div className="flex-1">
            <FormInput label="Search students" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, ID, or course" />
          </div>
          <Button onClick={handleCreate} variant="primary" className="whitespace-nowrap sm:mt-6">
            + New Student
          </Button>
        </div>
      </section>

      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">{error}</div> : null}

      <Table columns={columns} rows={filteredStudents} emptyMessage="No students found" />

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

        <article className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 h-fit">
          <h2 className="font-heading text-xl font-extrabold text-slate-900 mb-5">
             {isCreating ? "Register New Student" : "Edit Student Profile"}
          </h2>
          {editingStudent ? (
            <form onSubmit={handleSave} className="grid gap-5">
              
              <div className="flex items-center gap-4 mb-2">
                 <div className="relative group">
                   <div className="h-16 w-16 shrink-0 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-xl font-bold overflow-hidden shadow-sm relative">
                     {editingStudent.profilePhoto ? (
                       <img src={editingStudent.profilePhoto} alt="Preview" className="h-full w-full object-cover" />
                     ) : (
                       <span className="material-icons text-indigo-300">person</span>
                     )}
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="material-icons text-white text-sm">{uploadingPhoto ? 'hourglass_empty' : 'upload'}</span>
                     </div>
                   </div>
                   <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleAdminPhotoUpload} disabled={uploadingPhoto} />
                 </div>
                 <div>
                   <p className="text-sm font-bold text-slate-900">Profile Photo</p>
                   <p className="text-xs text-slate-500">Click to upload image</p>
                 </div>
              </div>

              <div className="rounded-2xl bg-indigo-50 p-4 border border-indigo-100">
                <label className="block mb-2">
                   <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-indigo-700 ml-1">Assign Student ID</span>
                   <div className="flex gap-2">
                     <input
                       type="text"
                       value={editingStudent.studentId}
                       onChange={(event) => setEditingStudent((previous) => ({ ...previous, studentId: event.target.value }))}
                       placeholder="e.g. EME-2026-0001"
                       className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm text-indigo-900 font-bold outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                     />
                     <Button type="button" variant="outline" onClick={generateRandomId} className="shrink-0 bg-white" title="Auto Generate">
                       <span className="material-icons text-indigo-600">autorenew</span>
                     </Button>
                   </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Full Name" required value={editingStudent.fullName} onChange={(event) => setEditingStudent((previous) => ({ ...previous, fullName: event.target.value }))} />
                <FormInput label="Email" type="email" required disabled={!isCreating} value={editingStudent.email} onChange={(event) => setEditingStudent((previous) => ({ ...previous, email: event.target.value }))} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Phone" value={editingStudent.phone} onChange={(event) => setEditingStudent((previous) => ({ ...previous, phone: event.target.value }))} />
                {isCreating ? (
                  <FormInput label="Initial Password" type="password" value={editingStudent.password} onChange={(event) => setEditingStudent((previous) => ({ ...previous, password: event.target.value }))} placeholder="Leaves blank for eme12345" />
                ) : (
                  <div className="block">
                     <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Enrollment Status</span>
                     <select
                       value={editingStudent.status}
                       onChange={(event) => setEditingStudent((previous) => ({ ...previous, status: event.target.value }))}
                       className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                     >
                       <option value="pending">Pending Review</option>
                       <option value="active">Approved & Active</option>
                       <option value="rejected">Rejected</option>
                       <option value="inactive">Inactive</option>
                     </select>
                  </div>
                )}
              </div>

              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Assign Course</span>
                <select
                  value={editingStudent.course}
                  onChange={(event) => setEditingStudent((previous) => ({ ...previous, course: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option value="" disabled>Select a course program</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course.title}>{course.title}</option>
                  ))}
                </select>
              </label>

              {isCreating && (
                 <label className="block">
                   <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Enrollment Status</span>
                   <select
                     value={editingStudent.status}
                     onChange={(event) => setEditingStudent((previous) => ({ ...previous, status: event.target.value }))}
                     className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                   >
                     <option value="pending">Pending Review</option>
                     <option value="active">Approved & Active</option>
                     <option value="rejected">Rejected</option>
                     <option value="inactive">Inactive</option>
                   </select>
                 </label>
              )}

              {/* Documents Upload Section */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex justify-between items-center mb-3">
                   <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Verification Documents</span>
                   <label className={`flex items-center gap-1 cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-800 ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
                     <span className="material-icons text-[14px]">add_circle</span>
                     Upload
                     <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleAdminDocUpload} disabled={uploadingDoc} />
                   </label>
                </div>
                {editingStudent.documents && editingStudent.documents.length > 0 ? (
                  <div className="grid gap-2">
                    {editingStudent.documents.map((docUrl, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded-lg border border-slate-200 bg-slate-50">
                         <div className="flex items-center gap-2 overflow-hidden">
                           <span className="material-icons text-slate-400 text-[16px]">description</span>
                           <span className="text-xs text-slate-600 truncate">Document {idx + 1}</span>
                         </div>
                         <button type="button" onClick={() => removeDocument(idx)} className="text-rose-400 hover:text-rose-600">
                           <span className="material-icons text-[16px]">cancel</span>
                         </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                    <p className="text-xs text-slate-400">No documents uploaded.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Button type="button" variant="outline" onClick={() => { setEditingStudent(null); setIsCreating(false); }} className="w-full">
                  Cancel
                </Button>
                <Button type="submit" loading={saving} variant="primary" className="w-full">
                  {isCreating ? "Create Student" : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="material-icons text-slate-400 text-xl">edit_note</span>
              <p className="text-sm font-medium text-slate-500">Click "Action" on a student or "New Student" to edit profile details.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

export default Students;
