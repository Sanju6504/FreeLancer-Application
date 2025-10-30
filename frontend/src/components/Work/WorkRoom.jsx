import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, Calendar, User, Building2 } from "lucide-react";
import { http } from "../../services/http.js";

export function WorkRoom() {
  const { id } = useParams(); // job id
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await http("GET", `/jobs/${id}`);
        setJob(data);
        // Placeholder: no real messages API yet; seed with a sample thread if accepted
        setMessages([
          { id: "m1", from: "employer", text: "Welcome aboard! Let's kick off.", at: new Date().toISOString() },
          { id: "m2", from: "freelancer", text: "Thanks! I will share the initial plan by EOD.", at: new Date().toISOString() },
        ]);
      } catch (e) {
        console.error("Failed to load job", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const msg = { id: `m-${Date.now()}`, from: "freelancer", text, at: new Date().toISOString() };
    setMessages((prev) => [...prev, msg]);
    setInput("");
    // TODO: POST to /work/messages once backend exists
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/work" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Work
        </Link>
        <div className="p-8 bg-gray-50 rounded-xl border text-gray-600">Job not found.</div>
      </div>
    );
  }

  const acceptedApp = useMemo(() => {
    const apps = Array.isArray(job.applications) ? job.applications : [];
    return apps.find((a) => a?.status === "accepted");
  }, [job]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-start gap-3">
          <Link to="/work" className="inline-flex items-center text-blue-600 hover:text-blue-700 mt-1">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{job.title}</h1>
            <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{job.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              <span className="inline-flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> Updated {new Date(job.updatedAt || job.createdAt).toLocaleDateString()}</span>
              {job.employerId && (<span className="inline-flex items-center"><Building2 className="w-3.5 h-3.5 mr-1" /> Employer</span>)}
              {acceptedApp && (<span className="inline-flex items-center"><User className="w-3.5 h-3.5 mr-1" /> Application Accepted</span>)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm flex flex-col min-h-[60vh]">
          <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl text-sm text-gray-700">Room</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === "freelancer" ? "justify-end" : "justify-start"}`}>
                <div className={`${m.from === "freelancer" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"} px-3 py-2 rounded-lg max-w-[80%] text-sm`}>
                  {m.text}
                  <div className={`mt-1 text-[10px] ${m.from === "freelancer" ? "text-white/80" : "text-gray-500"}`}>
                    {new Date(m.at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
              placeholder="Write a message..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSend}
              className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-1" /> Send
            </button>
          </div>
        </div>

        {/* Job sidebar */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Job Details</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div><span className="text-gray-500">Budget:</span> {typeof job.budgetMin === 'number' || typeof job.budgetMax === 'number' ? `${job.budgetMin ?? ''}${job.budgetMin && job.budgetMax ? ' - ' : ''}${job.budgetMax ?? ''}` : 'TBD'}</div>
            {job.durationWeeks && (<div><span className="text-gray-500">Duration:</span> {job.durationWeeks} weeks</div>)}
            {Array.isArray(job.skills) && job.skills.length > 0 && (
              <div>
                <div className="text-gray-500">Skills:</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {job.skills.slice(0, 6).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs border">{s.name || s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Link to={`/jobs/${job.id}`} className="px-3 py-1.5 border rounded-md text-sm text-gray-700 hover:bg-gray-50">View Job</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
