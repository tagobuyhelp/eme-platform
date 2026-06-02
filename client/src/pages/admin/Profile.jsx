import { useState, useEffect } from "react";
import api, { getStoredUser } from "../../services/api";
import FormInput from "../../components/FormInput";
import Button from "../../components/Button";

function AdminProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    profilePhoto: "",
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    // We get the stored user from local storage initially
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setForm({
        name: stored.name || "",
        email: stored.email || "",
        profilePhoto: stored.profilePhoto || "",
      });
    }
    setLoading(false);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("document", file);

      // Using the student upload endpoint which allows admin to upload files to s3
      const response = await api.post("/students/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForm((prev) => ({ ...prev, profilePhoto: response.data.url }));
      setSuccess("Photo uploaded. Don't forget to save changes.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await api.put("/auth/me", {
        name: form.name,
        profilePhoto: form.profilePhoto,
      });

      setUser(res.data.user);
      
      // Update local storage so Topbar updates
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Dispatch a storage event so Topbar/Sidebar know to re-render or reload page
      window.location.reload();
      
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Loading...</div>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Admin Identity</p>
        <h1 className="mt-1 font-heading text-2xl md:text-3xl font-extrabold text-slate-900">Profile Settings</h1>
      </section>

      {error && <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-bold text-rose-700">{error}</div>}
      {success && <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-bold text-emerald-700">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Photo Upload Column */}
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="w-40 h-40 rounded-full border-4 border-white bg-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden relative group">
             {form.profilePhoto ? (
               <img src={form.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-slate-300">
                 {form.name ? form.name.charAt(0).toUpperCase() : "A"}
               </div>
             )}
             
             <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
               <span className="material-icons mb-1">{uploadingPhoto ? 'hourglass_empty' : 'photo_camera'}</span>
               <span className="text-xs font-bold">{uploadingPhoto ? 'Uploading...' : 'Change'}</span>
               <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
             </label>
          </div>
          <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Admin Avatar</p>
        </div>

        {/* Details Column */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
            <h2 className="font-heading text-lg md:text-xl font-bold text-slate-900 mb-6">Personal Information</h2>
            
            <FormInput 
              label="Full Name" 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              required 
            />
            
            <FormInput 
              label="Email Address" 
              name="email" 
              type="email" 
              value={form.email} 
              disabled // Admin email shouldn't be casually changed here
            />

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" variant="primary" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
