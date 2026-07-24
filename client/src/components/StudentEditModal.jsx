import PropTypes from "prop-types";
import { useState } from "react";
import FormInput from "./FormInput";
import Button from "./Button";
import api from "../services/api";

function StudentEditModal({
  editingStudent,
  setEditingStudent,
  isCreating,
  courses,
  onClose,
  onSave,
  saving,
}) {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState("");

  if (!editingStudent) return null;

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setUploadError("");

      const formData = new FormData();
      formData.append("document", file);

      const response = await api.post("/students/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEditingStudent((prev) => ({ ...prev, profilePhoto: response.data.url }));
    } catch (err) {
      setUploadError(err.response?.data?.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDocUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDoc(true);
      setUploadError("");

      const formData = new FormData();
      formData.append("document", file);

      const response = await api.post("/students/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEditingStudent((prev) => ({
        ...prev,
        documents: [...(prev.documents || []), response.data.url],
      }));
    } catch (err) {
      setUploadError(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeDocument = (indexToRemove) => {
    setEditingStudent((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, index) => index !== indexToRemove),
    }));
  };

  const generateRandomId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setEditingStudent((prev) => ({ ...prev, studentId: `EME-${year}-${randomNum}` }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-dark-card shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-900 to-indigo-950 text-white border-b border-indigo-800/50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
              {isCreating ? "New Registration" : "Profile Management"}
            </span>
            <h2 className="font-heading text-2xl font-extrabold text-white">
              {isCreating ? "Register New Student" : "Edit Candidate Profile"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-icons text-xl">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {uploadError && (
            <div className="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-700 border border-rose-200 flex items-center gap-2">
              <span className="material-icons text-base">error_outline</span>
              {uploadError}
            </div>
          )}

          {/* Profile Photo */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <div className="relative group shrink-0">
              <div className="h-16 w-16 rounded-2xl bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-indigo-700 text-xl font-bold overflow-hidden shadow-sm relative">
                {editingStudent.profilePhoto ? (
                  <img src={editingStudent.profilePhoto} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="material-icons text-indigo-400 text-3xl">person</span>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-icons text-white text-sm">
                    {uploadingPhoto ? "hourglass_empty" : "upload"}
                  </span>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">Profile Photo</p>
              <p className="text-[11px] text-slate-500 font-medium">Click on avatar to upload photo</p>
            </div>
          </div>

          {/* Student ID */}
          <div className="rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 p-4 border border-indigo-100 dark:border-indigo-900/50">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300 ml-1">
              Assign Student ID
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={editingStudent.studentId || ""}
                onChange={(event) =>
                  setEditingStudent((previous) => ({ ...previous, studentId: event.target.value }))
                }
                placeholder="e.g. EME-2026-0001"
                className="w-full rounded-xl border border-indigo-200 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-indigo-900 dark:text-indigo-200 font-bold outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateRandomId}
                className="shrink-0 bg-white dark:bg-slate-800"
                title="Auto Generate ID"
              >
                <span className="material-icons text-indigo-600 dark:text-indigo-400">autorenew</span>
              </Button>
            </div>
          </div>

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Full Name"
              required
              value={editingStudent.fullName || ""}
              onChange={(event) =>
                setEditingStudent((previous) => ({ ...previous, fullName: event.target.value }))
              }
            />
            <FormInput
              label="Email Address"
              type="email"
              disabled={!isCreating}
              value={editingStudent.email || ""}
              onChange={(event) =>
                setEditingStudent((previous) => ({ ...previous, email: event.target.value }))
              }
            />
          </div>

          {/* Phone & Status / Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Mobile Phone"
              value={editingStudent.phone || ""}
              onChange={(event) =>
                setEditingStudent((previous) => ({ ...previous, phone: event.target.value }))
              }
            />
            {isCreating ? (
              <FormInput
                label="Initial Password"
                type="password"
                value={editingStudent.password || ""}
                onChange={(event) =>
                  setEditingStudent((previous) => ({ ...previous, password: event.target.value }))
                }
                placeholder="Defaults to eme12345"
              />
            ) : (
              <div className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                  Enrollment Status
                </span>
                <select
                  value={editingStudent.status || "active"}
                  onChange={(event) =>
                    setEditingStudent((previous) => ({ ...previous, status: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-indigo-500"
                >
                  <option value="pending">Pending Review</option>
                  <option value="active">Approved & Active</option>
                  <option value="rejected">Rejected</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {/* Assign Course */}
          <label className="block">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">
              Assign Course Program
            </span>
            <select
              value={editingStudent.course || ""}
              onChange={(event) =>
                setEditingStudent((previous) => ({ ...previous, course: event.target.value }))
              }
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-indigo-500"
            >
              <option value="" disabled>
                Select a course program
              </option>
              {courses.map((course) => (
                <option key={course._id} value={course.title}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          {/* Verification Documents Upload */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
            <div className="flex justify-between items-center mb-3">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                Verification Documents
              </span>
              <label
                className={`flex items-center gap-1 cursor-pointer text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 ${
                  uploadingDoc ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <span className="material-icons text-[16px]">add_circle</span>
                Upload Doc
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleDocUpload}
                  disabled={uploadingDoc}
                />
              </label>
            </div>
            {editingStudent.documents && editingStudent.documents.length > 0 ? (
              <div className="grid gap-2">
                {editingStudent.documents.map((docUrl, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="material-icons text-indigo-500 text-[18px]">description</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                        Document #{idx + 1}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(idx)}
                      className="text-rose-400 hover:text-rose-600 transition-colors"
                    >
                      <span className="material-icons text-[18px]">cancel</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center">
                <p className="text-xs text-slate-400 font-medium">No documents uploaded.</p>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
            <Button type="submit" loading={saving} variant="primary" className="w-full">
              {isCreating ? "Create Student" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

StudentEditModal.propTypes = {
  editingStudent: PropTypes.object,
  setEditingStudent: PropTypes.func.isRequired,
  isCreating: PropTypes.bool,
  courses: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

export default StudentEditModal;
