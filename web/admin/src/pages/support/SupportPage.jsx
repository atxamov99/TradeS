import { useMemo, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useAuth } from "../../store";
import { useAdminData } from "../../store/adminData";
import { Icon } from "../../components/shared/Icon";

const TABS = [
  { key: "all", label: "Hammasi" },
  { key: "open", label: "Ochiq" },
  { key: "answered", label: "Javob berilgan" },
];

const SOURCE_LABEL = {
  bot: "Telegram bot",
  web: "Ilova (Contact Support)",
};

function ReplyRow({ ticket, onReply }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await onReply(ticket.id, text.trim());
      setText("");
    } finally {
      setSending(false);
    }
  }

  if (ticket.status === "answered") {
    return (
      <div className="text-body-sm text-on-surface-variant">
        <span className="font-medium text-on-surface">Javob:</span> {ticket.adminReply}
      </div>
    );
  }

  if (ticket.source !== "bot") {
    return (
      <div className="text-body-sm text-on-surface-variant italic">
        Bu ilova formasidan kelgan — javob bu yerdan yuborilmaydi, ko'rsatilgan aloqa orqali bog'laning.
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Javob yozing..."
        disabled={sending}
        className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm text-on-surface focus:outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={submit}
        disabled={sending || !text.trim()}
        className="px-4 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-medium disabled:opacity-50"
      >
        Yuborish
      </button>
    </div>
  );
}

export function SupportPage() {
  usePageTitle("Murojaatlar");
  const { profile } = useAuth();
  const { supportMessages, replySupportTicket, deleteSupportTicket } = useAdminData();

  const [tab, setTab] = useState("all");
  const [confirmingId, setConfirmingId] = useState(null);

  const counts = useMemo(() => {
    const c = { all: supportMessages.length };
    for (const s of supportMessages) c[s.status] = (c[s.status] || 0) + 1;
    return c;
  }, [supportMessages]);

  const filtered = useMemo(
    () => supportMessages.filter((s) => tab === "all" || s.status === tab),
    [supportMessages, tab]
  );

  return (
    <div className="space-y-section-gap">
      <div>
        <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Murojaatlar</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Telegram bot (/support) va ilova orqali kelgan yordam so'rovlari
        </p>
      </div>

      <div className="border-b border-outline-variant overflow-x-auto">
        <ul className="flex gap-6 min-w-max px-1">
          {TABS.map((tb) => (
            <li key={tb.key}>
              <button
                type="button"
                onClick={() => setTab(tb.key)}
                className={`pb-3 px-1 font-body-sm transition-colors ${
                  tab === tb.key ? "text-primary font-bold border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {tb.label} ({counts[tb.key] || 0})
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-surface-bright border border-outline-variant rounded-xl p-12 text-center text-on-surface-variant">
            Murojaatlar topilmadi
          </div>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="bg-surface-bright border border-outline-variant rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-body-sm font-semibold text-on-surface">{s.name}</span>
                  <span className="text-xs text-on-surface-variant">{s.contact}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-surface-container-lowest text-on-surface-variant">
                    <Icon name={s.source === "bot" ? "smart_toy" : "forum"} className="text-[14px]" />
                    {SOURCE_LABEL[s.source] || s.source}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === "answered" ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEF3C7] text-[#92400E]"
                    }`}
                  >
                    {s.status === "answered" ? "Javob berilgan" : "Ochiq"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant whitespace-nowrap">
                    {s.createdAt ? new Date(s.createdAt).toLocaleString("uz-UZ") : "—"}
                  </span>
                  {profile?.isPrimary && (
                    confirmingId === s.id ? (
                      <span className="flex items-center gap-2 text-xs">
                        <span className="text-on-surface-variant">O'chirilsinmi?</span>
                        <button
                          type="button"
                          onClick={() => { deleteSupportTicket(s.id); setConfirmingId(null); }}
                          className="text-error font-semibold"
                        >
                          Ha
                        </button>
                        <button type="button" onClick={() => setConfirmingId(null)} className="text-on-surface-variant">
                          Yo'q
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(s.id)}
                        className="text-on-surface-variant hover:text-error"
                        title="O'chirish"
                      >
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    )
                  )}
                </div>
              </div>
              <p className="font-body-sm text-on-surface whitespace-pre-wrap">{s.message}</p>
              <ReplyRow ticket={s} onReply={replySupportTicket} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
