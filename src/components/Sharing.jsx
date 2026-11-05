// Module 4: sharing, collaboration and reminders.
// Ported from the Module 4 client (ShareModal, AssignDropdown, ReminderForm)
// to this app's fetch-based API helpers.

import { useCallback, useEffect, useState } from "react";
import ModuleShell from "./ModuleShell";
import { getGroceryList, getSharedWithMe } from "../api/groceryApi";
import {
  assignItem,
  createReminder,
  deleteReminder,
  getCollaborators,
  getReminders,
  removeCollaborator,
  shareList,
} from "../api/collaborationApi";

function ShareManager({ list }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [data, setData] = useState({ owner: null, collaborators: [], isOwner: false });
  const [items, setItems] = useState(list.items || []);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Reload people and items so assignments always show the saved state
  const load = useCallback(async () => {
    try {
      const [collaborators, fresh] = await Promise.all([
        getCollaborators(list.id),
        getGroceryList(list.id),
      ]);
      setData(collaborators);
      setItems(fresh.list.items);
    } catch (err) {
      setError(err.message);
    }
  }, [list.id]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const share = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await shareList(list.id, email, role);
      setMessage(`Shared with ${email}`);
      setEmail("");
      load();
    } catch (err) {
      setError(err.message || "Failed to share");
    }
  };

  const remove = async (userId) => {
    await removeCollaborator(list.id, userId);
    load();
  };

  const people = [data.owner, ...data.collaborators.map((c) => c.user)].filter(Boolean);

  const assign = async (itemId, userId) => {
    setError("");
    try {
      await assignItem(list.id, itemId, userId);
      load();
    } catch (err) {
      setError(err.message || "Failed to assign item");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">
          <i className="fas fa-user-plus mr-2 text-emerald-600"></i>
          Share "{list.name}"
        </h3>

        <form onSubmit={share} className="flex flex-wrap gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="friend@email.com"
            className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-gray-300 rounded-md px-2"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">
            Share
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {message && <p className="text-emerald-600 text-sm mt-2">{message}</p>}

        <h4 className="font-semibold mt-5 mb-2 text-gray-700">People with access</h4>
        {data.owner && (
          <p className="text-sm py-1">
            {data.owner.name} <span className="text-gray-400">(Owner)</span>
          </p>
        )}
        {data.collaborators.length === 0 && (
          <p className="text-sm text-gray-400">Not shared with anyone yet.</p>
        )}
        {data.collaborators.map((c) => (
          <div key={c.user._id} className="flex justify-between text-sm py-1">
            <span>
              {c.user.name} <span className="text-gray-400">({c.role}, {c.user.email})</span>
            </span>
            {data.isOwner && (
              <button
                type="button"
                onClick={() => remove(c.user._id)}
                className="text-red-500 text-xs hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">
          <i className="fas fa-user-tag mr-2 text-emerald-600"></i>
          Assign items
        </h3>
        {items.length === 0 && (
          <p className="text-sm text-gray-400">This list has no items yet.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center py-1 text-sm">
            <span className={item.completed ? "line-through text-gray-400" : ""}>
              {item.name}
            </span>
            <select
              value={item.assignedTo || ""}
              onChange={(e) => assign(item.id, e.target.value)}
              className="text-xs border border-gray-300 rounded-md px-1 py-1"
            >
              <option value="">Unassigned</option>
              {people.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReminderForm({ list, onCreated }) {
  const [remindAt, setRemindAt] = useState("");
  const [message, setMessage] = useState(`Time to shop for "${list.name}"!`);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createReminder(list.id, message, remindAt);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      onCreated();
    } catch (err) {
      setError(err.message || "Failed to set reminder");
    }
  };

  return (
    <form onSubmit={submit} className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-3">
        <i className="fas fa-clock mr-2 text-emerald-600"></i>
        Shopping reminder
      </h3>
      <div className="flex flex-wrap gap-2 items-end">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-md px-3 py-2"
        />
        <input
          type="datetime-local"
          value={remindAt}
          onChange={(e) => setRemindAt(e.target.value)}
          required
          className="border border-gray-300 rounded-md px-3 py-2"
        />
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">
          {done ? "Saved ✓" : "Set Reminder"}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </form>
  );
}

function Sharing({ lists, onBack, onOpenSharedList }) {
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [selectedListId, setSelectedListId] = useState(lists[0]?.id || "");
  const [error, setError] = useState("");

  const loadReminders = useCallback(async () => {
    try {
      setReminders(await getReminders());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    getSharedWithMe()
      .then((data) => setSharedWithMe(data.lists))
      .catch((err) => setError(err.message));

    const timer = setTimeout(loadReminders, 0);
    return () => clearTimeout(timer);
  }, [loadReminders]);

  const selectedList = lists.find((list) => list.id === selectedListId);
  const listName = (id) => lists.find((list) => list.id === id)?.name || "a list";

  const removeReminder = async (id) => {
    await deleteReminder(id);
    loadReminders();
  };

  return (
    <ModuleShell title="Sharing & Collaboration" icon="fa-share-nodes" onBack={onBack}>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <h3 className="text-lg font-semibold text-gray-800 mb-3">Shared with me</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {sharedWithMe.length === 0 && (
          <p className="text-gray-400 col-span-full">
            No one has shared a list with you yet.
          </p>
        )}
        {sharedWithMe.map((list) => (
          <button
            type="button"
            key={list.id}
            onClick={() => onOpenSharedList(list.id)}
            className="text-left bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition duration-300"
          >
            <h4 className="font-bold text-gray-800">{list.name}</h4>
            <p className="text-sm text-gray-500">
              From {list.owner?.name || "another user"} • {(list.items || []).length} items
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Manage my lists</h3>
        {lists.length > 0 && (
          <select
            value={selectedListId}
            onChange={(e) => setSelectedListId(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1"
          >
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedList ? (
        <div className="space-y-6 mb-8">
          <ShareManager key={`share-${selectedList.id}`} list={selectedList} />
          <ReminderForm
            key={`reminder-${selectedList.id}`}
            list={selectedList}
            onCreated={loadReminders}
          />
        </div>
      ) : (
        <p className="text-gray-400 mb-8">Create a grocery list first to share it.</p>
      )}

      <h3 className="text-lg font-semibold text-gray-800 mb-3">Upcoming reminders</h3>
      <div className="bg-white rounded-xl shadow-sm divide-y">
        {reminders.length === 0 && (
          <p className="p-4 text-sm text-gray-400">No upcoming reminders.</p>
        )}
        {reminders.map((r) => (
          <div key={r._id} className="p-4 flex justify-between items-center text-sm">
            <span>
              {r.message}
              <span className="text-gray-400 ml-2">
                {new Date(r.remindAt).toLocaleString()} • {listName(r.list)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => removeReminder(r._id)}
              className="text-red-500 text-xs hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </ModuleShell>
  );
}

export default Sharing;
