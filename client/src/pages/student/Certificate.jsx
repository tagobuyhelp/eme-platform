import { useEffect, useState } from "react";

import CertificateCard from "../../components/CertificateCard";
import api from "../../services/api";

function Certificate() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        setLoading(true);
        const response = await api.get("/certificates/my");
        const list = response.data.certificates || [];
        setCertificates(list);
        setPreviewUrl(list[0]?.certificateUrl || "");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load certificates");
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center rounded-3xl bg-white border border-slate-200/80 p-8 text-sm font-bold text-slate-400">Loading certificates...</div>;
  }

  return (
    <div className="w-full space-y-5 md:space-y-8">
      <section>
        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-indigo-600">Verified Achievements</p>
        <h1 className="mt-1 font-heading text-2xl md:text-3xl font-extrabold text-slate-900">Certificates</h1>
      </section>

      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">{error}</div> : null}

      {previewUrl ? (
        <section className="overflow-hidden rounded-3xl bg-slate-900 shadow-xl shadow-slate-900/10 border border-slate-800">
          <div className="border-b border-slate-800 px-6 py-4 flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-rose-500"></span>
            <span className="h-3 w-3 rounded-full bg-amber-500"></span>
            <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
            <h2 className="font-heading text-sm font-bold text-slate-400 tracking-widest uppercase ml-4">Live Preview</h2>
          </div>
          <iframe title="Certificate preview" src={previewUrl} className="h-[600px] w-full bg-white" />
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:gap-6">
        {certificates.length > 0 ? certificates.map((certificate) => (
          <div key={certificate.certificateId} onClick={() => setPreviewUrl(certificate.certificateUrl || "")} className="cursor-pointer">
            <CertificateCard certificate={certificate} />
          </div>
        )) : (
           <div className="rounded-3xl bg-slate-50 p-10 text-center border border-slate-200/80">
             <div className="mx-auto h-16 w-16 bg-white shadow-sm flex items-center justify-center rounded-2xl mb-4">
                <span className="material-icons text-3xl text-slate-300">workspace_premium</span>
             </div>
             <p className="text-sm font-bold text-slate-500">You haven't earned any certificates yet. Complete exams to earn credentials!</p>
           </div>
        )}
      </section>
    </div>
  );
}

export default Certificate;
