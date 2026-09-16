"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

const DEFAULT_OWNER = "P4Dem";
const DEFAULT_REPO = "ai-democracy-map";
const DEFAULT_BRANCH = "main";

type GhFile = { sha: string; content: string };

async function ghGetFile(owner: string, repo: string, path: string, branch: string, pat: string): Promise<GhFile | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${branch}`, {
    headers: { Authorization: `Bearer ${pat}`, Accept: "application/vnd.github.v3+json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${path} ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return { sha: j.sha, content: atob(j.content.replace(/\n/g, "")) };
}

async function ghPutFile(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  pat: string,
  content: string,
  sha: string | null,
  message: string
) {
  const body: any = { message, content: btoa(unescape(encodeURIComponent(content))), branch };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${pat}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

function csvEscape(s: string) {
  if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const maskPat = (p: string) => (p ? `${p.slice(0, 7)}…${p.slice(-4)}` : "");

type QRow = { timestamp: string; question: string; page: string; ua: string; status?: string; answer?: string; answeredAt?: string };
const Q_COLUMNS = ["timestamp", "question", "page", "ua", "status", "answer", "answeredAt"];

/* ---------- small presentational helpers ---------- */

const Field = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="flex flex-col gap-1">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
    <input
      {...props}
      className="h-9 rounded-md border border-border bg-card px-2.5 text-sm outline-none transition-colors focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
    />
  </label>
);

const StatCard = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
  </div>
);

export const AdminPanel = () => {
  const [pat, setPat] = useState("");
  const [owner, setOwner] = useState(DEFAULT_OWNER);
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [branch, setBranch] = useState(DEFAULT_BRANCH);
  const [tab, setTab] = useState<"questions" | "codebook">("questions");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Questions state
  const [qRows, setQRows] = useState<QRow[]>([]);
  const [qLoading, setQLoading] = useState(false);
  const [qSource, setQSource] = useState<"github" | "sample" | null>(null);
  const [newQ, setNewQ] = useState("");
  const [openTs, setOpenTs] = useState<string | null>(null);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [savingA, setSavingA] = useState(false);

  // Codebook state
  const [, setCbCsv] = useState<string | null>(null);
  const [cbParsed, setCbParsed] = useState<any[] | null>(null);
  const [cbErrors, setCbErrors] = useState<string[]>([]);
  const [cbCurrent, setCbCurrent] = useState<Record<string, any> | null>(null);
  const [publishing, setPublishing] = useState(false);

  const [savedPat, setSavedPat] = useState("");

  useEffect(() => {
    const p = sessionStorage.getItem("gh_pat") ?? "";
    setPat(p);
    setSavedPat(p);
    setOwner(sessionStorage.getItem("gh_owner") ?? DEFAULT_OWNER);
    setRepo(sessionStorage.getItem("gh_repo") ?? DEFAULT_REPO);
    setBranch(sessionStorage.getItem("gh_branch") ?? DEFAULT_BRANCH);
  }, []);

  const connected = !!savedPat;

  const savePat = () => {
    sessionStorage.setItem("gh_pat", pat);
    sessionStorage.setItem("gh_owner", owner);
    sessionStorage.setItem("gh_repo", repo);
    sessionStorage.setItem("gh_branch", branch);
    setSavedPat(pat);
    setMsg("Credentials saved to this browser session");
    setTimeout(() => setMsg(null), 1800);
  };

  const disconnect = () => {
    ["gh_pat", "gh_owner", "gh_repo", "gh_branch"].forEach((k) => sessionStorage.removeItem(k));
    setPat("");
    setSavedPat("");
    setQRows([]);
    setMsg("Disconnected – token cleared from this session");
    setTimeout(() => setMsg(null), 1800);
  };

  const parseRows = (text: string) => {
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    return (parsed.data as any[]).filter((r) => r.question) as typeof qRows;
  };

  // No PAT → show the local sample file bundled with the build so the view
  // is understandable offline. With a PAT → the real committed CSV.
  const loadSample = async () => {
    setQLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/questions.csv`, { cache: "no-store" });
      setQRows(res.ok ? parseRows(await res.text()) : []);
      setQSource("sample");
    } catch {
      setQRows([]);
    } finally {
      setQLoading(false);
    }
  };

  const loadQuestions = async () => {
    if (!pat) return loadSample();
    setQLoading(true);
    setErr(null);
    try {
      const f = await ghGetFile(owner, repo, "data/questions.csv", branch, pat);
      setQRows(parseRows(f?.content ?? "timestamp,question,page,ua\n"));
      setQSource("github");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setQLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "questions" && qRows.length === 0) loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const openRow = (r: QRow) => {
    if (openTs === r.timestamp) {
      setOpenTs(null);
      return;
    }
    setOpenTs(r.timestamp);
    setDraftAnswer(r.answer ?? "");
  };

  // Rewrite the whole CSV with one row's status/answer updated, and commit.
  const saveAnswer = async (r: QRow, status: "answered" | "new" | "skip") => {
    if (!pat) return setErr("Connect a PAT (Contents: R/W) to save answers");
    setSavingA(true);
    setErr(null);
    setMsg(null);
    try {
      const f = await ghGetFile(owner, repo, "data/questions.csv", branch, pat);
      const rows = (Papa.parse(f?.content ?? "", { header: true, skipEmptyLines: true }).data as any[]).filter((x) => x.question);
      const hit = rows.find((x) => x.timestamp === r.timestamp);
      if (!hit) throw new Error("Row no longer in file – reload and retry");
      hit.status = status;
      hit.answer = status === "new" ? "" : draftAnswer.trim();
      hit.answeredAt = status === "new" ? "" : new Date().toISOString();
      const csv = Papa.unparse(rows, { columns: Q_COLUMNS }) + "\n";
      await ghPutFile(owner, repo, "data/questions.csv", branch, pat, csv, f?.sha ?? null, `chore: ${status === "new" ? "reopen" : status} question ${r.timestamp.slice(0, 10)}`);
      setMsg(status === "new" ? "Reopened" : "Answer committed to data/questions.csv");
      setOpenTs(null);
      loadQuestions();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSavingA(false);
    }
  };

  const appendQuestion = async () => {
    if (!newQ.trim()) return;
    if (!pat) return setErr("PAT required to write");
    setErr(null);
    setMsg(null);
    try {
      const f = await ghGetFile(owner, repo, "data/questions.csv", branch, pat);
      const existing = f?.content ?? "timestamp,question,page,ua\n";
      const line = `${new Date().toISOString()},${csvEscape(newQ.trim())},admin,${csvEscape(navigator.userAgent.slice(0, 120))}\n`;
      const next = existing.endsWith("\n") ? existing + line : existing + "\n" + line;
      await ghPutFile(owner, repo, "data/questions.csv", branch, pat, next, f?.sha ?? null, `chore: add question ${new Date().toISOString().slice(0, 10)}`);
      setMsg("Committed to data/questions.csv");
      setNewQ("");
      loadQuestions();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const onCodebookFile = (file: File) => {
    setCbCsv(null);
    setCbParsed(null);
    setCbErrors([]);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data as any[];
        setCbParsed(rows);
        const errs: string[] = [];
        const seen = new Set<string>();
        rows.forEach((r, i) => {
          const code = String(r.code ?? "").trim();
          const name = String(r.name ?? "").trim();
          const pillar = String(r.pillar ?? r.pillarCode ?? "").trim();
          if (!code) errs.push(`Row ${i + 2}: missing code`);
          else if (!/^[1-4]\.\d+$/.test(code)) errs.push(`Row ${i + 2} ${code}: code must be 1.1-4.9`);
          if (seen.has(code)) errs.push(`Row ${i + 2} ${code}: duplicate`);
          seen.add(code);
          if (!name) errs.push(`Row ${i + 2} ${code}: missing name`);
          if (!["1", "2", "3", "4"].includes(pillar)) errs.push(`Row ${i + 2} ${code}: pillar must be 1-4`);
        });
        setCbErrors(errs);
        // Load current for diff
        fetch(`./data/aspects.json`)
          .then((r) => r.json())
          .then(setCbCurrent)
          .catch(() => setCbCurrent(null));
      },
    });
  };

  const publishCodebook = async () => {
    if (!cbParsed || cbErrors.length) return setErr("Fix validation first");
    if (!pat) return setErr("PAT required");
    setPublishing(true);
    setErr(null);
    try {
      // Build aspects.json
      const next: Record<string, any> = {};
      for (const r of cbParsed) {
        const code = String(r.code).trim();
        next[code] = {
          code,
          name: String(r.name).trim(),
          definition: String(r.definition ?? r.short ?? "").trim(),
          description: String(r.description ?? "").trim(),
          pillar:
            ["Citizenship, Law and Rights", "Representative and Accountable Government", "Civil Society and Popular Participation", "Transnational Dynamics"][Number(r.pillar) - 1] ??
            r.pillar,
          pillarCode: String(r.pillar).trim(),
        };
      }
      const aspectsContent = JSON.stringify(next, null, 2) + "\n";
      const csvContent = Papa.unparse(cbParsed);
      const aspectsFile = await ghGetFile(owner, repo, "public/data/aspects.json", branch, pat);
      await ghPutFile(owner, repo, "public/data/aspects.json", branch, pat, aspectsContent, aspectsFile?.sha ?? null, "chore: update codebook aspects.json via admin");
      const rawFile = await ghGetFile(owner, repo, "data/raw/codebook.csv", branch, pat);
      await ghPutFile(owner, repo, "data/raw/codebook.csv", branch, pat, csvContent, rawFile?.sha ?? null, "chore: update codebook.csv via admin");
      setMsg("Published aspects.json + codebook.csv – the deploy Action will rebuild GitHub Pages.");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setPublishing(false);
    }
  };

  const cbAdded = useMemo(
    () => (cbCurrent && cbParsed ? cbParsed.filter((r: any) => !cbCurrent[String(r.code)]).map((r: any) => r.code) : []),
    [cbCurrent, cbParsed]
  );
  const cbRemoved = useMemo(
    () => (cbCurrent && cbParsed ? Object.keys(cbCurrent).filter((c) => !cbParsed.find((r: any) => String(r.code) === c)) : []),
    [cbCurrent, cbParsed]
  );

  const NAV: { id: "questions" | "codebook"; label: string; hint: string; soon?: boolean }[] = [
    { id: "questions", label: "Questions", hint: "data/questions.csv" },
    { id: "codebook", label: "Codebook", hint: "public/data/aspects.json", soon: true },
  ];

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-md bg-foreground text-[11px] font-black text-background">P4D</span>
            <div className="leading-tight">
              <div className="text-sm font-bold">AI–Democracy Map</div>
              <div className="text-[11px] text-muted-foreground">Admin console</div>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${
              connected ? "border-p4d-grassroot/30 bg-p4d-grassroot/10 text-p4d-grassroot" : "border-p4d-orange/30 bg-p4d-orange/10 text-p4d-orange"
            }`}
          >
            <span className={`size-1.5 rounded-full ${connected ? "bg-p4d-grassroot" : "bg-p4d-orange"}`} />
            {connected ? (
              <span>
                {owner}/{repo}
                <span className="text-muted-foreground"> @ {branch}</span>
              </span>
            ) : (
              "Not connected"
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-6 md:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <nav className="overflow-hidden rounded-xl border border-border bg-card">
            {NAV.map((n) => {
              const active = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => !n.soon && setTab(n.id)}
                  disabled={n.soon}
                  title={n.soon ? "In development – disabled for this review" : undefined}
                  className={`flex w-full items-center justify-between border-l-2 px-3.5 py-2.5 text-left text-sm transition-colors ${
                    n.soon
                      ? "cursor-not-allowed border-transparent text-muted-foreground/60"
                      : active
                        ? "border-p4d-brick bg-muted/60 font-semibold"
                        : "border-transparent hover:bg-muted/40"
                  }`}
                >
                  <span>{n.label}</span>
                  {n.soon ? (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Soon</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{n.id === "questions" ? `${qRows.length}` : ""}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Connection card */}
          <div className="rounded-xl border border-border bg-card p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">GitHub connection</h2>
              {connected && (
                <button onClick={disconnect} className="text-[11px] font-semibold text-p4d-brick hover:underline">
                  Disconnect
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
              <Field label="Repo" value={repo} onChange={(e) => setRepo(e.target.value)} />
              <Field label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
              <Field label="Fine-grained PAT" type="password" placeholder="github_pat_…" value={pat} onChange={(e) => setPat(e.target.value)} />
            </div>
            <button
              onClick={savePat}
              disabled={!pat || pat === savedPat}
              className="mt-3 w-full rounded-md bg-foreground px-3 py-2 text-xs font-bold text-background transition-opacity disabled:opacity-40"
            >
              {pat && pat === savedPat ? `Saved · ${maskPat(savedPat)}` : "Save to session"}
            </button>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              Create at{" "}
              <a className="underline" target="_blank" rel="noreferrer" href="https://github.com/settings/tokens?type=beta">
                github.com/settings/tokens
              </a>
              . Scope: repo <code className="rounded bg-muted px-1">{owner}/{repo}</code>, <code className="rounded bg-muted px-1">Contents: R/W</code>,{" "}
              <code className="rounded bg-muted px-1">Metadata: R</code>. Kept only in this tab's session storage.
            </p>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 space-y-4">
          {!connected && (
            <div className="flex items-start gap-2 rounded-lg border border-p4d-blue/40 bg-p4d-blue/10 px-3.5 py-2.5 text-sm text-foreground">
              <span aria-hidden>◆</span>
              <span>
                <b>Demo preview.</b> Showing bundled sample data – reading is live, saving is disabled. Connect a GitHub token to work against the
                real <code className="rounded bg-muted px-1">data/questions.csv</code>. This console is for review only until P4D signs off.
              </span>
            </div>
          )}
          {msg && (
            <div className="flex items-start gap-2 rounded-lg border border-p4d-grassroot/30 bg-p4d-grassroot/10 px-3.5 py-2.5 text-sm font-medium text-p4d-grassroot">
              <span aria-hidden>✓</span>
              <span>{msg}</span>
            </div>
          )}
          {err && (
            <div className="flex items-start gap-2 rounded-lg border border-p4d-brick/30 bg-p4d-brick/10 px-3.5 py-2.5 text-sm font-medium text-p4d-brick">
              <span aria-hidden>!</span>
              <span className="break-all">{err}</span>
            </div>
          )}

          {tab === "questions" && (
            <section className="rounded-xl border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold">Reader questions</h1>
                    {qSource === "sample" && (
                      <span className="rounded-full border border-p4d-orange/30 bg-p4d-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-p4d-orange">
                        Sample data
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Appends <code className="rounded bg-muted px-1">timestamp,question,page,ua</code> to{" "}
                    <code className="rounded bg-muted px-1">data/questions.csv</code> and commits. The public question box writes here too when a PAT is in this session.
                    {qSource === "sample" && " No PAT connected – showing the bundled sample file."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={loadQuestions}
                    disabled={qLoading}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    {qLoading ? "Loading…" : "Reload"}
                  </button>
                  <a
                    href={`https://github.com/${owner}/${repo}/blob/${branch}/data/questions.csv`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
                  >
                    View on GitHub ↗
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-4">
                <StatCard label="Rows" value={qRows.length} />
                <StatCard label="Target" value={<span className="font-mono text-[11px]">questions.csv</span>} />
                <StatCard label="Branch" value={<span className="font-mono text-[11px]">{branch}</span>} />
                <StatCard
                  label="Source"
                  value={
                    qSource === "github" ? (
                      <span className="text-p4d-grassroot">Live</span>
                    ) : qSource === "sample" ? (
                      <span className="text-p4d-orange">Sample</span>
                    ) : (
                      "–"
                    )
                  }
                />
              </div>

              <div className="flex gap-2 border-t border-border px-4 py-3">
                <input
                  value={newQ}
                  onChange={(e) => setNewQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && appendQuestion()}
                  placeholder="Add a question manually…"
                  disabled={!connected}
                  className="h-9 flex-1 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
                />
                <button
                  onClick={appendQuestion}
                  disabled={!connected || !newQ.trim()}
                  className="rounded-md bg-p4d-brick px-4 py-1.5 text-xs font-bold text-white transition-opacity disabled:opacity-40"
                >
                  Commit
                </button>
              </div>

              <div className="max-h-[520px] overflow-auto border-t border-border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-muted text-[10px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="w-24 px-4 py-2 font-semibold">Status</th>
                      <th className="w-28 px-4 py-2 font-semibold">When</th>
                      <th className="px-4 py-2 font-semibold">Question</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          {qLoading ? "Loading…" : "No questions yet."}
                        </td>
                      </tr>
                    ) : (
                      qRows.slice(0, 200).map((r) => {
                        const isOpen = openTs === r.timestamp;
                        const answered = (r.status ?? "new") === "answered";
                        const skipped = r.status === "skip";
                        return (
                          <Fragment key={r.timestamp}>
                            <tr
                              onClick={() => openRow(r)}
                              className={`cursor-pointer border-t border-border/70 align-top transition-colors ${isOpen ? "bg-muted/60" : "odd:bg-muted/20 hover:bg-muted/40"}`}
                            >
                              <td className="px-4 py-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                    answered
                                      ? "bg-p4d-grassroot/15 text-p4d-grassroot"
                                      : skipped
                                        ? "bg-muted text-muted-foreground"
                                        : "bg-p4d-orange/15 text-p4d-orange"
                                  }`}
                                >
                                  {answered ? "Answered" : skipped ? "Skipped" : "New"}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-2 font-mono text-[11px] text-muted-foreground">{r.timestamp.slice(0, 16).replace("T", " ")}</td>
                              <td className="px-4 py-2">
                                <span className={isOpen ? "" : "line-clamp-2"}>{r.question}</span>
                                {r.answer && !isOpen && <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">↳ {r.answer}</span>}
                              </td>
                            </tr>
                            {isOpen && (
                              <tr className="bg-muted/40">
                                <td colSpan={3} className="px-4 pb-4 pt-1">
                                  <div className="rounded-lg border border-border bg-card p-3.5">
                                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                                      <div>
                                        <div className="font-semibold uppercase tracking-wide text-muted-foreground">Submitted</div>
                                        <div className="font-mono">{new Date(r.timestamp).toLocaleString()}</div>
                                      </div>
                                      <div>
                                        <div className="font-semibold uppercase tracking-wide text-muted-foreground">Page</div>
                                        <div className="font-mono">{r.page || "–"}</div>
                                      </div>
                                      <div>
                                        <div className="font-semibold uppercase tracking-wide text-muted-foreground">Answered</div>
                                        <div className="font-mono">{r.answeredAt ? new Date(r.answeredAt).toLocaleDateString() : "–"}</div>
                                      </div>
                                    </div>
                                    <div className="mt-2 truncate text-[10px] text-muted-foreground" title={r.ua}>{r.ua}</div>

                                    <p className="mt-3 rounded-md bg-muted/50 p-2.5 text-sm">{r.question}</p>

                                    <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Response</label>
                                    <textarea
                                      value={draftAnswer}
                                      onChange={(e) => setDraftAnswer(e.target.value)}
                                      rows={4}
                                      placeholder="Write the answer / internal note…"
                                      className="mt-1 w-full resize-y rounded-md border border-border bg-card p-2.5 text-sm outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10"
                                    />

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                      <button
                                        onClick={() => saveAnswer(r, "answered")}
                                        disabled={savingA || !connected || !draftAnswer.trim()}
                                        className="rounded-md bg-p4d-grassroot px-3.5 py-1.5 text-xs font-bold text-white transition-opacity disabled:opacity-40"
                                      >
                                        {savingA ? "Saving…" : "Save & mark answered"}
                                      </button>
                                      <button
                                        onClick={() => saveAnswer(r, "skip")}
                                        disabled={savingA || !connected}
                                        className="rounded-md border border-border px-3.5 py-1.5 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-40"
                                      >
                                        Skip
                                      </button>
                                      {r.status && r.status !== "new" && (
                                        <button
                                          onClick={() => saveAnswer(r, "new")}
                                          disabled={savingA || !connected}
                                          className="rounded-md border border-border px-3.5 py-1.5 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-40"
                                        >
                                          Reopen
                                        </button>
                                      )}
                                      <button
                                        onClick={() => navigator.clipboard?.writeText(draftAnswer)}
                                        disabled={!draftAnswer.trim()}
                                        className="rounded-md border border-border px-3.5 py-1.5 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-40"
                                      >
                                        Copy
                                      </button>
                                      <button onClick={() => setOpenTs(null)} className="ml-auto text-[11px] text-muted-foreground hover:underline">
                                        Close
                                      </button>
                                    </div>
                                    {!connected && (
                                      <p className="mt-2 text-[11px] text-p4d-orange">Read-only – connect a PAT to save. The submitter left no contact, so responses are stored in the CSV (e.g. for a public FAQ), not emailed.</p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "codebook" && (
            <section className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h1 className="text-base font-bold">Democracy-aspect codebook</h1>
                <p className="text-[12px] text-muted-foreground">
                  Upload a CSV with header <code className="rounded bg-muted px-1">code,name,definition,description,pillar</code>. Publishing commits{" "}
                  <code className="rounded bg-muted px-1">public/data/aspects.json</code> + <code className="rounded bg-muted px-1">data/raw/codebook.csv</code>, then the deploy Action rebuilds the site.
                </p>
              </div>

              <div className="px-4 py-4">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-8 text-center transition-colors hover:border-foreground/30 hover:bg-muted/50">
                  <span className="text-sm font-semibold">Choose a .csv file</span>
                  <span className="text-[11px] text-muted-foreground">
                    {cbParsed ? `${cbParsed.length} rows parsed` : "or drop it here"}
                  </span>
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && onCodebookFile(e.target.files[0])} />
                </label>

                {cbParsed && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <StatCard label="Rows" value={cbParsed.length} />
                    <StatCard
                      label="Validation"
                      value={cbErrors.length ? <span className="text-p4d-brick">{cbErrors.length} errors</span> : <span className="text-p4d-grassroot">Valid</span>}
                    />
                    <StatCard
                      label="Diff vs live"
                      value={cbCurrent ? `${Object.keys(cbCurrent).length} → ${cbParsed.length}` : "–"}
                    />
                  </div>
                )}

                {cbCurrent && cbParsed && (
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
                    <span>
                      <b className="text-p4d-grassroot">Added:</b> {cbAdded.join(", ") || "–"}
                    </span>
                    <span>
                      <b className="text-p4d-brick">Removed:</b> {cbRemoved.join(", ") || "–"}
                    </span>
                  </div>
                )}

                {cbErrors.length > 0 && (
                  <ul className="mt-3 max-h-40 space-y-1 overflow-auto rounded-lg border border-p4d-brick/20 bg-p4d-brick/5 p-3 text-[11px] text-p4d-brick">
                    {cbErrors.map((x, i) => (
                      <li key={i}>• {x}</li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={publishCodebook}
                    disabled={publishing || !cbParsed || !!cbErrors.length || !connected}
                    className="rounded-md bg-p4d-brick px-4 py-2 text-xs font-bold text-white transition-opacity disabled:opacity-40"
                  >
                    {publishing ? "Publishing…" : "Publish to GitHub (2 commits)"}
                  </button>
                  <a
                    href={`https://github.com/${owner}/${repo}/blob/${branch}/public/data/aspects.json`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-muted-foreground underline"
                  >
                    View aspects.json ↗
                  </a>
                </div>
              </div>
            </section>
          )}

          <p className="px-1 text-[11px] text-muted-foreground">
            No server. All writes go straight from this browser to the GitHub Contents API with your token.
          </p>
        </main>
      </div>
    </div>
  );
};
