import QRCode from "react-qr-code";

function IdCard({ student }) {
  if (!student) return null;

  const verificationUrl = `${window.location.origin}/verify/student/${student.studentId || student._id}`;

  return (
    <div className="printable-id-card w-[320px] rounded-3xl bg-white shadow-xl shadow-indigo-900/5 overflow-hidden border border-slate-200/60 relative group transition-transform hover:scale-[1.02]">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 p-6 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
        
        <h1 className="text-xl font-heading font-black text-white tracking-wider uppercase relative z-10">EME Academy</h1>
        <p className="text-[9px] font-bold text-indigo-200 tracking-[0.2em] uppercase mt-1 relative z-10">Official Identity Card</p>
      </div>

      {/* Profile Photo Avatar */}
      <div className="relative flex justify-center -mt-10 z-20">
        <div className="h-24 w-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center shadow-md overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
           {student.profilePhoto ? (
             <img src={student.profilePhoto} alt={student.fullName} className="h-full w-full object-cover" />
           ) : (
             <span className="text-3xl font-extrabold text-slate-400">
               {(student.fullName || "S").slice(0, 1).toUpperCase()}
             </span>
           )}
        </div>
      </div>

      {/* Student Info */}
      <div className="p-6 text-center pt-4">
        <h2 className="text-xl font-bold text-slate-900">{student.fullName}</h2>
        <p className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-widest">{student.course || "General Student"}</p>
        
        <div className="mt-5 grid grid-cols-2 gap-3 text-left">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Student ID</p>
            <p className="text-xs font-bold text-indigo-700 mt-0.5 truncate">{student.studentId || "PENDING"}</p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Valid Until</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5 truncate">
              {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* QR Code */}
        <div className="mt-6 flex flex-col items-center justify-center border-t border-slate-100 pt-5">
          <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
             <QRCode value={verificationUrl} size={64} fgColor="#334155" />
          </div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">Scan to verify authenticity</p>
        </div>
      </div>
      
      {/* Footer Pattern */}
      <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-indigo-500 to-violet-500"></div>
    </div>
  );
}

export default IdCard;
