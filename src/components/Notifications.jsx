// Module 4: notifications (list shared, item assigned, reminders, pending items).
// Ported from the Module 4 NotificationBell to a full page.

import { useCallback, useEffect, useState } from "react";
import ModuleShell from "./ModuleShell";
import notificationApi from "../api/notificationApi";

const TYPE_ICONS = {
  list_shared: "fa-share-nodes",
  item_assigned: "fa-user-tag",
  reminder: "fa-clock",
  pending_item: "fa-triangle-exclamation",
  general: "fa-bell",
};

function Notifications({ onBack, onOpenSharedList }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = useCallback(
    () =>
      notificationApi
        .getAll()
        .then((data) => {
          setNotes(data.notifications);
          setError("");
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    const timer = setInterval(load, 30000); // refresh every 30 seconds
    const first = setTimeout(load, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, [load]);

  const unread = notes.filter((n) => !n.read).length;

  const markAll = async () => {
    await notificationApi.markAllRead();
    load();
  };

  // Runs the daily pending-items check now (High priority items not yet bought)
  const checkPending = async () => {
    try {
      const result = await notificationApi.checkPending();
      setInfo(
        result.pending === 0
          ? "No pending high-priority items."
          : `${result.pending} high-priority item(s) still pending.`
      );
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const open = async (note) => {
    if (!note.read) {
      await notificationApi.markRead(note.id);
      load();
    }
    // Shared-list and assignment notifications open the list
    if (note.list && (note.type === "list_shared" || note.type === "item_assigned")) {
      onOpenSharedList(note.list);
    }
  };

  return (
    <ModuleShell title="Notifications" icon="fa-bell" onBack={onBack}>
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex justify-between items-center p-4 border-b">
          <span className="font-semibold text-gray-700">
            {unread} unread
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={checkPending}
              className="text-sm text-emerald-600 hover:underline"
            >
              <i className="fas fa-triangle-exclamation mr-1"></i>
              Check pending items
            </button>
            <button
              type="button"
              onClick={markAll}
              disabled={unread === 0}
              className="text-sm text-emerald-600 hover:underline disabled:text-gray-300 disabled:no-underline"
            >
              Mark all read
            </button>
          </div>
        </div>

        {info && <p className="px-4 pt-3 text-sm text-emerald-700">{info}</p>}

        {error && <p className="p-4 text-sm text-red-500">{error}</p>}
        {loading && <p className="p-4 text-sm text-gray-400">Loading...</p>}
        {!loading && notes.length === 0 && (
          <p className="p-6 text-center text-gray-400">
            <i className="fas fa-bell-slash text-3xl mb-2 block"></i>
            Nothing yet
          </p>
        )}

        {notes.map((n) => (
          <button
            type="button"
            key={n.id}
            onClick={() => open(n)}
            className={`w-full text-left p-4 border-b last:border-b-0 text-sm flex items-start gap-3 hover:bg-gray-50 ${
              n.read ? "text-gray-400" : "bg-emerald-50 text-gray-800"
            }`}
          >
            <i className={`fas ${TYPE_ICONS[n.type] || TYPE_ICONS.general} mt-1 text-emerald-600`}></i>
            <span>
              {n.message}
              <span className="block text-xs text-gray-400 mt-1">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </span>
          </button>
        ))}
      </div>
    </ModuleShell>
  );
}

export default Notifications;
