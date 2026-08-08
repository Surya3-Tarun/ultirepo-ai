import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Send, Copy, Download, ChevronDown, FileCode, Volume2 } from "lucide-react";
import PageHeading from "../components/PageHeading";
import OmnitrixCore from "../components/OmnitrixCore";
import { useRepo } from "../store/RepoContext";
import api from "../lib/api";
import SoundManager from "../lib/soundManager";

function SourceCard({ source }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="hologram-panel p-3">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode size={14} className="text-alien-emerald shrink-0" />
          <span className="font-tech text-xs text-core-white/80 truncate">
            {source.file_path}
            {source.start_line ? `:${source.start_line}-${source.end_line}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-tech text-[10px] text-energy-cyan/70">{Math.round(source.relevance_score * 100)}%</span>
          <ChevronDown size={14} className={`text-core-white/40 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.pre
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 text-[11px] font-mono text-core-white/60 whitespace-pre-wrap overflow-hidden"
          >
            {source.snippet}
          </motion.pre>
        )}
      </AnimatePresence>
    </div>
  );
}

function CodeBlock({ inline, className, children }) {
  const match = /language-(\w+)/.exec(className || "");
  if (inline) return <code className="bg-space-black/70 px-1.5 py-0.5 rounded text-alien-emerald text-sm">{children}</code>;
  return (
    <SyntaxHighlighter language={match?.[1] || "text"} style={oneDark} customStyle={{ borderRadius: 8, fontSize: 13 }}>
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
}

export default function Chat() {
  const { activeRepo, topK, voiceEnabled } = useRepo();
  const [messages, setMessages] = useState([]); // {role, content, sources}
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const rerun = sessionStorage.getItem("ultirepo:rerun-question");
    if (rerun) {
      setInput(rerun);
      sessionStorage.removeItem("ultirepo:rerun-question");
    }
  }, []);

  const handleSend = async (event) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || !activeRepo?.repoId || thinking) return;

    SoundManager.playUIClick();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }, { role: "assistant", content: "", sources: [] }]);
    setThinking(true);

    let accumulated = "";
    await api.streamChat({
      repoId: activeRepo.repoId,
      question,
      sessionId,
      topK,
      onToken: (piece) => {
        accumulated += piece;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: accumulated };
          return next;
        });
      },
      onSources: (sources) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], sources };
          return next;
        });
      },
      onSession: (id) => setSessionId(id),
      onError: (message) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: `⚠ ${message}` };
          return next;
        });
      },
      onDone: () => {
        setThinking(false);
        if (voiceEnabled) SoundManager.playUIClick();
      },
    });
    setThinking(false);
  };

  const handleCopy = (text) => navigator.clipboard.writeText(text);
  const handleDownload = (text, index) => {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ultirepo-answer-${index}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeRepo?.repoId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24">
        <PageHeading eyebrow="QUERY MODE" title="No Repository Indexed" subtitle="Upload and index a repository before starting a conversation." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col h-screen">
      <PageHeading eyebrow="QUERY MODE ENGAGED" title="Chat" subtitle={activeRepo.repoUrl} />

      <div className="flex-1 overflow-y-auto space-y-6 pb-6 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 opacity-70">
            <OmnitrixCore size={100} />
            <p className="font-tech text-sm text-core-white/40 mt-6">Ask anything about this repository.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={msg.role === "user" ? "flex justify-end" : ""}>
            {msg.role === "user" ? (
              <div className="hologram-panel px-4 py-2.5 max-w-[80%] font-body text-sm">{msg.content}</div>
            ) : (
              <div className="max-w-[92%]">
                <div className="hologram-panel px-4 py-3 font-body text-sm prose prose-invert prose-sm max-w-none prose-p:my-2">
                  {msg.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <span className="inline-block w-2 h-4 bg-alien-emerald animate-pulse" />
                  )}
                </div>

                {msg.content && (
                  <div className="flex items-center gap-3 mt-2 px-1">
                    <button onClick={() => handleCopy(msg.content)} className="text-core-white/40 hover:text-alien-emerald transition-colors" title="Copy answer">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => handleDownload(msg.content, i)} className="text-core-white/40 hover:text-alien-emerald transition-colors" title="Download answer">
                      <Download size={14} />
                    </button>
                    {voiceEnabled && (
                      <button onClick={() => SoundManager.announcePage(msg.content.slice(0, 200))} className="text-core-white/40 hover:text-alien-emerald transition-colors" title="Read aloud">
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                )}

                {msg.sources?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="font-tech text-[10px] tracking-widest text-energy-cyan/60 px-1">SOURCE CHUNKS</div>
                    {msg.sources.map((source, si) => (
                      <SourceCard key={`${source.file_path}-${si}`} source={source} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 hologram-panel p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this repository..."
          className="flex-1 bg-transparent outline-none font-body text-sm px-3 placeholder:text-core-white/30"
        />
        <button
          type="submit"
          disabled={thinking}
          className="w-10 h-10 rounded-lg bg-alien-emerald/10 border border-alien-emerald text-alien-emerald flex items-center justify-center hover:bg-alien-emerald/20 hover:shadow-glow transition-all disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
