import { useEffect, useMemo, useState } from "react";
import FormInput from "../../components/FormInput";
import Button from "../../components/Button";
import api from "../../services/api";

import IdCard from "../../components/IdCard";

function Profile() {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", course: "" });
  const [documents, setDocuments] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/courses?status=active");
        setCourseList(res.data.courses || []);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    };
    fetchCourses();
  }, []);

  const groupedCourses = useMemo(() => {
    return courseList.reduce((acc, course) => {
      if (!acc[course.category]) acc[course.category] = [];
      acc[course.category].push(course);
      return acc;
    }, {});
  }, [courseList]);

  useEffect(() => {
    const bootstrapProfile = async () => {
      try {
        setLoading(true);
        let currentStudent;
        try {
          // Try fetching existing profile
          const res = await api.get("/students/me");
          currentStudent = res.data.student;
        } catch (err) {
          // If profile doesn't exist (404), create it
          if (err.response?.status === 404) {
             const postRes = await api.post("/students", {
               fullName: user?.name || "",
               email: user?.email || "",
               phone: "",
               course: "",
             });
             currentStudent = postRes.data.student;
          } else {
             throw err;
          }
        }

        if (currentStudent) {
          setStudent(currentStudent);
          setForm({
            fullName: currentStudent.fullName || "",
            email: currentStudent.email || "",
            phone: currentStudent.phone || "",
            course: currentStudent.course || "",
          });
          setDocuments(currentStudent.documents || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (!student && user) {
      bootstrapProfile();
    }
  }, [student, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !student?._id) return;

    try {
      setUploadingDoc(true);
      setError("");
      
      const formData = new FormData();
      formData.append("document", file);

      const response = await api.post("/students/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const docUrl = response.data.url;
      const newDocs = [...documents, docUrl];
      
      // Auto-save the document to the student profile
      await api.put(`/students/${student._id}`, { documents: newDocs });
      setDocuments(newDocs);
      setMessage("Document uploaded successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !student?._id) return;

    try {
      setUploadingPhoto(true);
      setError("");
      
      const formData = new FormData();
      formData.append("document", file); // We can reuse the document upload endpoint for photos

      const response = await api.post("/students/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const photoUrl = response.data.url;
      
      // Auto-save the photo to the student profile
      await api.put(`/students/${student._id}`, { profilePhoto: photoUrl });
      setStudent({ ...student, profilePhoto: photoUrl });
      setMessage("Profile photo updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload profile photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!student?._id) {
      setError("Student profile is not ready yet");
      return;
    }
    
    if (!form.course) {
      setError("Please select an EME Academy course.");
      return;
    }

    if (documents.length === 0 && student.status === "pending") {
      setError("Please upload at least one verification document (e.g., Aadhar, Marksheet) before submitting.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");
      const response = await api.put(`/students/${student._id}`, form);
      setStudent(response.data.student);
      setMessage("Registration details submitted successfully. Awaiting Administrator approval.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit registration");
    } finally {
      setSaving(false);
    }
  };

  const isPending = student?.status === "pending";
  const isRejected = student?.status === "rejected";
  const isActive = student?.status === "active";

  return (
    <div className="w-full space-y-8">
      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Student Identity</p>
        <h1 className="mt-1 font-heading text-2xl md:text-3xl font-extrabold text-slate-900">Registration & Profile</h1>
      </section>

      {loading ? <div className="rounded-2xl bg-slate-50 border border-slate-100 p-8 text-sm font-bold text-slate-400 text-center">Preparing your profile workspace...</div> : null}
      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">{error}</div> : null}
      {message ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700 border border-emerald-200">{message}</div> : null}

      {/* Status Banners */}
      {student && isPending && documents.length > 0 && form.course ? (
        <div className="rounded-2xl bg-amber-50 p-6 shadow-sm border border-amber-200 flex items-start gap-4">
          <span className="material-icons text-amber-600 text-3xl">hourglass_empty</span>
          <div>
            <h3 className="font-bold text-amber-800 text-lg">Verification Pending</h3>
            <p className="text-sm text-amber-700 mt-1">Your registration details and documents have been submitted and are awaiting review from an administrator. You will be able to access exams and your ID Card once approved.</p>
          </div>
        </div>
      ) : student && isPending ? (
        <div className="rounded-2xl bg-indigo-50 p-6 shadow-sm border border-indigo-200 flex items-start gap-4">
          <span className="material-icons text-indigo-600 text-3xl">info</span>
          <div>
            <h3 className="font-bold text-indigo-800 text-lg">Action Required: Complete Registration</h3>
            <p className="text-sm text-indigo-700 mt-1">Please fill in your details, select your EME Academy course, and upload your verification documents (e.g., ID Proof, Marksheets) below to request enrollment.</p>
          </div>
        </div>
      ) : null}

      {student && isRejected && (
        <div className="rounded-2xl bg-rose-50 p-6 shadow-sm border border-rose-200 flex items-start gap-4">
          <span className="material-icons text-rose-600 text-3xl">gpp_bad</span>
          <div>
            <h3 className="font-bold text-rose-800 text-lg">Registration Rejected</h3>
            <p className="text-sm text-rose-700 mt-1">Your enrollment was rejected. Please verify your documents and contact the administrator.</p>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[340px,1fr]">
        <article className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-slate-200/80 h-fit flex flex-col items-center">
          {isActive ? (
            <div className="w-full flex justify-center pb-6">
              <IdCard student={student} />
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <label className={`cursor-pointer block relative ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                  {student?.profilePhoto ? (
                    <img src={student.profilePhoto} alt="Profile" className="h-32 w-32 rounded-full object-cover shadow-lg shadow-indigo-500/30 ring-4 ring-white" />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-4xl font-extrabold text-white shadow-lg shadow-indigo-500/30 ring-4 ring-white">
                      {(form.fullName || user?.name || "S").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-icons text-white">{uploadingPhoto ? 'hourglass_empty' : 'photo_camera'}</span>
                  </div>
                </label>
              </div>
              <h2 className="mt-5 font-heading text-xl md:text-2xl font-bold text-slate-900">{form.fullName || user?.name || "Student"}</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">{student?.studentId || "ID Not Assigned"}</p>
              
              <div className="mt-8 w-full border-t border-slate-100 pt-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Complete profile to enroll</p>
              </div>
            </div>
          )}
          {isActive && (
            <div className="mt-2 w-full pt-4">
              <Button variant="outline" className="w-full flex justify-center items-center gap-2" onClick={() => window.print()}>
                <span className="material-icons text-lg">print</span>
                Print ID Card
              </Button>
            </div>
          )}
        </article>

        <div className="space-y-6">
          <form onSubmit={handleSave} className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-slate-200/80">
            <h2 className="font-heading text-lg md:text-xl font-bold text-slate-900 mb-6">Enrollment Information</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <FormInput label="Full Name" name="fullName" type="text" value={form.fullName} onChange={handleChange} required disabled={isActive} />
              <FormInput label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required disabled={isActive} />
              <FormInput label="Phone Number" name="phone" type="text" value={form.phone} onChange={handleChange} disabled={isActive} />
              
              <div className="block md:col-span-2">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">EME Academy Course Selection</span>
                {isActive ? (
                   <div className="w-full flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 font-bold shadow-inner cursor-not-allowed">
                     <span className="material-icons text-emerald-500 text-[18px]">school</span>
                     {form.course}
                   </div>
                ) : (
                  <select
                    name="course"
                    value={form.course}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  >
                    <option value="" disabled>Select your desired training program</option>
                    {Object.entries(groupedCourses).map(([category, courses]) => (
                      <optgroup key={category} label={category}>
                        {courses.map((course) => (
                          <option key={course._id} value={course.title}>{course.title}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {!isActive && (
              <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
                <Button type="submit" variant="primary" loading={saving} className="px-8">
                   Submit Registration
                </Button>
              </div>
            )}
          </form>

          {/* Document Upload Section */}
          <article className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-slate-200/80">
             <div className="flex justify-between items-center mb-6">
               <h2 className="font-heading text-lg md:text-xl font-bold text-slate-900">Verification Documents</h2>
               {!isActive && (
                  <label className={`flex items-center gap-2 rounded-xl bg-indigo-50 text-indigo-700 px-4 py-2 text-sm font-bold cursor-pointer hover:bg-indigo-100 transition-colors ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
                    <span className="material-icons text-lg">{uploadingDoc ? 'hourglass_empty' : 'upload_file'}</span>
                    <span>{uploadingDoc ? 'Uploading...' : 'Upload'}</span>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleDocumentUpload} disabled={uploadingDoc} />
                  </label>
               )}
             </div>
             {documents.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {documents.map((doc, index) => (
                   <a key={index} href={`${api.defaults.baseURL}/students/preview?url=${encodeURIComponent(doc)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors group">
                      <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-100">
                        <span className="material-icons text-slate-400 group-hover:text-indigo-600">description</span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-700 truncate">Document {index + 1}</p>
                        <p className="text-xs text-slate-400">Click to view</p>
                      </div>
                   </a>
                 ))}
               </div>
             ) : (
               <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                 <span className="material-icons text-4xl text-slate-300 mb-2">snippet_folder</span>
                 <p className="text-sm font-medium text-slate-500">No documents uploaded yet. Please upload your ID proof or marksheets.</p>
               </div>
             )}
          </article>

          {/* Password Reset Section */}
          <article className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-slate-200/80">
            <h2 className="font-heading text-lg md:text-xl font-bold text-slate-900 mb-6">Security Settings</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const currentPassword = e.target.currentPassword.value;
              const newPassword = e.target.newPassword.value;
              const confirmPassword = e.target.confirmPassword.value;
              
              if (newPassword !== confirmPassword) {
                setError("New passwords do not match.");
                return;
              }
              
              try {
                setSaving(true);
                setError("");
                setMessage("");
                await api.put("/auth/password", { currentPassword, newPassword });
                setMessage("Password successfully updated.");
                e.target.reset();
              } catch (err) {
                setError(err.response?.data?.message || "Failed to update password.");
              } finally {
                setSaving(false);
              }
            }}>
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                <FormInput label="Current Password" name="currentPassword" type="password" required />
                <FormInput label="New Password" name="newPassword" type="password" required />
                <FormInput label="Confirm New Password" name="confirmPassword" type="password" required />
              </div>
              <div className="mt-6 flex justify-end pt-4 border-t border-slate-100">
                <Button type="submit" variant="outline" loading={saving}>Change Password</Button>
              </div>
            </form>
          </article>
        </div>
      </section>
    </div>
  );
}

export default Profile;
