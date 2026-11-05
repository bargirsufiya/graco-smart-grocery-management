import { useEffect, useState } from "react";
import {
  getGroceryLists,
  getGroceryList,
  createGroceryList,
  deleteGroceryList,
  renameGroceryList,
  addGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
} from "../api/groceryApi";
import Inventory from "./Inventory";
import Budget from "./Budget";
import Sharing from "./Sharing";
import notificationApi from "../api/notificationApi";
import Notifications from "./Notifications";
import AIAssistant from "./AIAssistant";
import Expenses from "./Expenses";
import ModuleShell from "./ModuleShell";
import Profile from "./Profile";

function GroceryApp({ user, onLogout, onUserUpdate }) {
  const [lists, setLists] = useState([]);

  const [showNewListForm, setShowNewListForm] = useState(false);
  const [listName, setListName] = useState("");

  const [currentListId, setCurrentListId] = useState(null);
  const [sharedList, setSharedList] = useState(null);
  const [currentView, setCurrentView] = useState("lists");

  // Load lists from the API, and reload when coming back to the dashboard
  // so changes made on other screens (sharing, assignments, AI) show up
  useEffect(() => {
    if (currentView !== "lists") {
      return;
    }

    const loadGroceryLists = async () => {
      try {
        const data = await getGroceryLists();
        setLists(data.lists || []);
      } catch (error) {
        console.error("Failed to load grocery lists:", error);
        alert("Unable to load your grocery lists.");
      }
    };

    void loadGroceryLists();
  }, [currentView]);
const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

useEffect(() => {
  let isMounted = true;

  const loadUnreadNotificationCount = async () => {
    try {
      const data = await notificationApi.getAll();

      if (isMounted) {
        const notifications = data.notifications || [];
        const unreadCount = notifications.filter(
          (notification) => !notification.read
        ).length;

        setUnreadNotificationCount(unreadCount);
      }
    } catch (error) {
      console.error("Failed to load notification count:", error);
    }
  };

  loadUnreadNotificationCount();

  return () => {
    isMounted = false;
  };
}, [user.id, currentView]);

  // ---------------------------------------------------------
  // Add Item Form
  // ---------------------------------------------------------

  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [itemName, setItemName] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemCategory, setItemCategory] = useState("Fruits");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemUnit, setItemUnit] = useState("pcs");
  const [itemPriority, setItemPriority] = useState("Medium");
  const [itemNotes, setItemNotes] = useState("");

  // ---------------------------------------------------------
  // Category Filter
  // ---------------------------------------------------------

  const [categoryFilter, setCategoryFilter] = useState("all");

  // ---------------------------------------------------------
  // Apply a list returned by the API (own list or shared list)
  // ---------------------------------------------------------

  const applyUpdatedList = (updatedList) => {
    if (sharedList && sharedList.id === updatedList.id) {
      setSharedList({ ...updatedList, permission: sharedList.permission });
      return;
    }

    setLists((previousLists) =>
      previousLists.map((list) =>
        list.id === updatedList.id ? updatedList : list
      )
    );
  };

  // ---------------------------------------------------------
  // Create New List
  // ---------------------------------------------------------

const createNewList = async (e) => {
  e.preventDefault();

  if (!listName.trim()) {
    return;
  }

  try {
    const data = await createGroceryList(listName.trim());

    setLists((previousLists) => [
      data.list,
      ...previousLists,
    ]);

    setListName("");
    setShowNewListForm(false);
  } catch (error) {
    console.error("Create grocery list error:", error);
    alert(error.message || "Unable to create grocery list.");
  }
};

  // ---------------------------------------------------------
  // Delete List
  // ---------------------------------------------------------

  // ---------------------------------------------------------
  // Rename List
  // ---------------------------------------------------------

  const renameList = async (list) => {
    const newName = window.prompt("Rename list", list.name);

    if (!newName || !newName.trim() || newName.trim() === list.name) {
      return;
    }

    try {
      const data = await renameGroceryList(list.id, newName.trim());
      applyUpdatedList(data.list);
    } catch (error) {
      console.error("Rename grocery list error:", error);
      alert(error.message || "Unable to rename grocery list.");
    }
  };

 const deleteList = async (listId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this list and all its items?"
  );

  if (!confirmed) {
    return;
  }

  try {
    await deleteGroceryList(listId);

    setLists((previousLists) =>
      previousLists.filter((list) => list.id !== listId)
    );

    if (currentListId === listId) {
      setCurrentListId(null);
      setShowAddItemForm(false);
    }
  } catch (error) {
    console.error("Delete grocery list error:", error);
    alert(error.message || "Unable to delete grocery list.");
  }
};

  // ---------------------------------------------------------
  // Open / Close List
  // ---------------------------------------------------------

  const openList = (listId) => {
    setCurrentListId(listId);
    setSharedList(null);
    setCurrentView("lists");
    setShowNewListForm(false);
    setShowAddItemForm(false);
    setCategoryFilter("all");
  };

  // ---------------------------------------------------------
  // Open Shared List
  // ---------------------------------------------------------

 
const openSharedList = async (listId) => {
  try {
    const data = await getGroceryList(listId);

    if (!data.list) {
      alert("This shared grocery list is no longer available.");
      return;
    }

    setSharedList({
  ...data.list,
  permission: data.list.permission,
});

    setCurrentListId(null);
    setCurrentView("shared-list");
    setShowNewListForm(false);
    setShowAddItemForm(false);
    setCategoryFilter("all");
  } catch (error) {
    console.error("Open shared grocery list error:", error);
    alert(error.message || "Unable to open the shared grocery list.");
  }
};


  // ---------------------------------------------------------
  // Add Item Form
  // ---------------------------------------------------------

  const resetItemForm = () => {
    setItemName("");
    setItemCategory("Fruits");
    setItemQuantity("1");
    setItemUnit("pcs");
    setItemPriority("Medium");
    setItemNotes("");
  };

  const openAddItemForm = () => {
    setShowAddItemForm(true);

    setTimeout(() => {
      document.getElementById("item-name")?.focus();
    }, 0);
  };

  const closeAddItemForm = () => {
    setShowAddItemForm(false);
    resetItemForm();
  };
const addNewItem = async (e) => {
  e.preventDefault();

  const targetListId = isSharedView
    ? sharedList?.id || sharedList?._id
    : currentListId;

  if (!targetListId || !itemName.trim()) {
    alert("Please enter an item name and make sure a list is selected.");
    return;
  }

  try {
    if (editingItemId) {
      const data = await updateGroceryItem(
        targetListId,
        editingItemId,
        {
          name: itemName.trim(),
          category: itemCategory,
          quantity: parseInt(itemQuantity, 10) || 1,
          unit: itemUnit,
          priority: itemPriority.toLowerCase(),
          notes: itemNotes.trim(),
        }
      );

      applyUpdatedList(data.list);

      setEditingItemId(null);
      closeAddItemForm();
      return;
    }

    const data = await addGroceryItem(targetListId, {
      name: itemName.trim(),
      category: itemCategory,
      quantity: parseInt(itemQuantity, 10) || 1,
      unit: itemUnit,
      priority: itemPriority.toLowerCase(),
      notes: itemNotes.trim(),
    });

    applyUpdatedList(data.list);

    closeAddItemForm();
  } catch (error) {
    console.error("Grocery item error:", error);
    alert(error.message || "Unable to save grocery item.");
  }
};

    // ---------------------------------------------------------
  // Add AI Suggested Items
  // ---------------------------------------------------------

  const addAIItemsToList = async (listId, newItems) => {
    let updatedList = null;

    for (const item of newItems) {
      const data = await addGroceryItem(listId, item);
      updatedList = data.list;
    }

    if (updatedList) {
      applyUpdatedList(updatedList);
    }
  };

  // AI smart quantities update existing items
  const updateItemDetails = async (listId, itemId, changes) => {
    const data = await updateGroceryItem(listId, itemId, changes);
    applyUpdatedList(data.list);
  };

  // AI "generate list" creates a brand new list with the suggested items
  const createAIList = async (name, newItems) => {
    const data = await createGroceryList(name);

    setLists((previousLists) => [data.list, ...previousLists]);
    await addAIItemsToList(data.list.id, newItems);

    return data.list;
  };
  // ---------------------------------------------------------
  // Item Actions
  // ---------------------------------------------------------

const toggleItemCompletion = async (listId, itemId) => {
  const currentList =
    sharedList?.id === listId
      ? sharedList
      : lists.find((list) => list.id === listId);

  const currentItem = currentList?.items?.find(
    (item) => item.id === itemId
  );

  if (!currentItem) {
    return;
  }

  try {
    const data = await updateGroceryItem(
      listId,
      itemId,
      {
        purchased: !currentItem.completed,
      }
    );

    applyUpdatedList(data.list);
  } catch (error) {
    console.error(
      "Update grocery item error:",
      error
    );

    alert(
      error.message ||
        "Unable to update grocery item."
    );
  }
};

const deleteItem = async (listId, itemId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this item?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const data = await deleteGroceryItem(
      listId,
      itemId
    );

    applyUpdatedList(data.list);
  } catch (error) {
    console.error(
      "Delete grocery item error:",
      error
    );

    alert(
      error.message ||
        "Unable to delete grocery item."
    );
  }
};
  // ---------------------------------------------------------
  // Current List
  // ---------------------------------------------------------

  const isSharedView = currentView === "shared-list";
  const canEditCurrentList =
  !isSharedView || sharedList?.permission === "edit";

  const currentList = isSharedView
    ? sharedList
    : lists.find((list) => list.id === currentListId);

  // =========================================================
  // SINGLE LIST VIEW
  // =========================================================

  if (currentList) {
    const items = currentList.items || [];

    const activeItems = items.filter(
      (item) => !item.completed
    ).length;

    const completedItems = items.filter(
      (item) => item.completed
    ).length;

    const categories = [
      ...new Set(items.map((item) => item.category)),
    ];

    const filteredItems =
      categoryFilter === "all"
        ? items
        : items.filter(
            (item) => item.category === categoryFilter
          );

    return (
      <section className="py-8">
        <div className="container mx-auto px-4">

          {/* App Header */}

          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <img
                src="https://img.icons8.com/fluency/48/000000/grocery-bag.png"
                alt="Graco Logo"
                className="h-8 w-8 mr-2"
              />

              <span className="font-semibold text-emerald-700 text-2xl">
                Graco
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                Welcome, {user.name}
              </span>

              <button
                type="button"
                onClick={onLogout}
                className="text-emerald-600 hover:text-emerald-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          {/* List Header */}

     
{/* List Header */}
<div className="flex justify-between items-center mb-6">
  <div>
    <h2 className="text-2xl font-bold text-gray-800">
      {currentList.name}
    </h2>

    {isSharedView && (
      <p className="text-sm text-gray-500 mt-1">
        <i className="fas fa-share-nodes mr-1"></i>
        Shared with you •{" "}
        {canEditCurrentList ? "Can Edit" : "View Only"}
      </p>
    )}
  </div>

  <button
    onClick={() => {
      if (isSharedView) {
        setSharedList(null);
        setCurrentListId(null);
        setCurrentView("sharing");
        setCategoryFilter("all");
      } else {
        setCurrentListId(null);
      setCurrentView("dashboard");
      setCategoryFilter("all");
      }
    }}
    className="text-emerald-600 hover:text-emerald-800 font-medium"
  >
    <i className="fas fa-arrow-left mr-1"></i>
    {isSharedView ? "Back to Sharing" : "Back to Lists"}
  </button>
</div>


          {/* List Content */}

          <div className="bg-gray-50 rounded-xl shadow-md p-6 mb-8">

            {/* Actions + Filter */}

            <div className="flex justify-between items-center mb-6">

              {canEditCurrentList ? (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={openAddItemForm}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition duration-300"
                  >
                    <i className="fas fa-plus mr-1"></i>
                    Add Item
                  </button>

                  {!isSharedView && (
                    <>
                      <button
                        type="button"
                        onClick={() => renameList(currentList)}
                        className="bg-white text-emerald-700 border border-emerald-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-50 transition duration-300"
                      >
                        <i className="fas fa-pen mr-1"></i>
                        Rename
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteList(currentList.id)}
                        className="bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-red-200 transition duration-300"
                      >
                        <i className="fas fa-trash-alt mr-1"></i>
                        Delete List
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div>
  <span
    className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
      canEditCurrentList
        ? "bg-emerald-100 text-emerald-700"
        : "bg-blue-100 text-blue-700"
    }`}
  >
    <i
      className={`fas ${
        canEditCurrentList ? "fa-edit" : "fa-eye"
      } mr-2`}
    ></i>

    {canEditCurrentList ? "Edit Access" : "View Only"}
  </span>
</div>
              )}

              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">
                  Filter:
                </span>

                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value)
                  }
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Items</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Meat">Meat</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Statistics */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

              {/* Active Items */}

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
                    <i className="fas fa-shopping-basket text-xl"></i>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">
                      Active Items
                    </p>

                    <h3 className="text-2xl font-bold text-gray-800">
                      {activeItems}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Completed */}

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                    <i className="fas fa-check-circle text-xl"></i>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">
                      Completed
                    </p>

                    <h3 className="text-2xl font-bold text-gray-800">
                      {completedItems}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Categories */}

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                    <i className="fas fa-tags text-xl"></i>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">
                      Categories
                    </p>

                    <h3 className="text-2xl font-bold text-gray-800">
                      {categories.length}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Grocery Items */}

            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-shopping-basket text-4xl text-gray-300 mb-4"></i>

                  <h3 className="text-lg font-medium text-gray-500">
                    No items yet
                  </h3>

                  <p className="text-gray-400 mb-4">
                    {isSharedView
                      ? "This list does not contain any items yet."
                      : "Add your first item to this list"}
                  </p>

                 {canEditCurrentList && (
                    <button
                      type="button"
                      onClick={openAddItemForm}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition duration-300"
                    >
                      <i className="fas fa-plus mr-1"></i>
                      Add Item
                    </button>
                  )}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">
                    No items found in this category.
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const priorityClass =
                    item.priority === "High"
                      ? "priority-high"
                      : item.priority === "Medium"
                      ? "priority-medium"
                      : "priority-low";

                  const priorityBg =
                    item.priority === "High"
                      ? "bg-red-100 text-red-800"
                      : item.priority === "Medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-emerald-100 text-emerald-800";

                  return (
                    <div
                      key={item.id}
                      className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${priorityClass} flex items-center justify-between hover:shadow-md transition duration-300 ${
                        item.completed ? "opacity-75" : ""
                      }`}
                    >
                      {/* Item Information */}

                      <div className="flex items-center">

                        {!canEditCurrentList ? (
                          <div
                            className={`w-6 h-6 rounded-full ${
                              item.completed
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-gray-300"
                            } border-2 flex items-center justify-center mr-3`}
                          >
                            <i
                              className={`fas fa-check text-xs ${
                                item.completed
                                  ? "text-white"
                                  : "text-gray-400 opacity-0"
                              }`}
                            ></i>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              toggleItemCompletion(
                                currentList.id,
                                item.id
                              )
                            }
                            className={`w-6 h-6 rounded-full ${
                              item.completed
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-gray-300"
                            } border-2 flex items-center justify-center mr-3 hover:bg-gray-100 transition duration-300`}
                          >
                            <i
                              className={`fas fa-check text-xs ${
                                item.completed
                                  ? "text-white"
                                  : "text-gray-400 opacity-0"
                              }`}
                            ></i>
                          </button>
                        )}

                        <div>
                          <h3
                            className={`font-medium ${
                              item.completed
                                ? "text-gray-500 line-through"
                                : "text-gray-800"
                            }`}
                          >
                            {item.name}
                          </h3>

                          <p
                            className={`text-sm ${
                              item.completed
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {item.quantity} {item.unit} •{" "}
                            {item.category}
                          </p>

                          {/* Module 4: item assignment */}
                          {item.assignedTo && (
                            <p className="text-xs text-emerald-700 mt-1">
                              <i className="fas fa-user-tag mr-1"></i>
                              {String(item.assignedTo) === String(user.id)
                                ? "Assigned to you"
                                : "Assigned to a list member"}
                            </p>
                          )}

                          {item.notes && (
                            <p className="text-xs text-gray-400 mt-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Priority + Delete */}

                      <div className="flex items-center">
                        <span
                          className={`text-sm ${priorityBg} px-2 py-1 rounded-full mr-3`}
                        >
                          {item.priority}
                        </span>
{canEditCurrentList && (
  <>
    <button
      type="button"
      onClick={() => {
        setEditingItemId(item.id);
        setItemName(item.name);
        setItemCategory(item.category);
        setItemQuantity(String(item.quantity));
        setItemUnit(item.unit || "pcs");
        setItemPriority(item.priority);
        setItemNotes(item.notes || "");
        setShowAddItemForm(true);
      }}
      className="text-gray-400 hover:text-emerald-500 transition duration-300 mr-3"
    >
      <i className="fas fa-edit"></i>
    </button>

    <button
      type="button"
      onClick={() =>
        deleteItem(
          currentList.id,
          item.id
        )
      }
      className="text-gray-400 hover:text-red-500 transition duration-300"
    >
      <i className="fas fa-trash-alt"></i>
    </button>
  </>
)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add Item Form */}

          
{canEditCurrentList && showAddItemForm && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
  {editingItemId ? "Edit Item" : "Add New Item"}
</h3>

              <form onSubmit={addNewItem}>

                {/* Name + Category */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                  <div>
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="item-name"
                    >
                      Item Name
                    </label>

                    <input
                      id="item-name"
                      type="text"
                      placeholder="e.g. Organic Milk"
                      value={itemName}
                      onChange={(e) =>
                        setItemName(e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="item-category"
                    >
                      Category
                    </label>

                    <select
                      id="item-category"
                      value={itemCategory}
                      onChange={(e) =>
                        setItemCategory(e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="Fruits">Fruits</option>
                      <option value="Vegetables">
                        Vegetables
                      </option>
                      <option value="Dairy">Dairy</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Meat">Meat</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Quantity + Unit */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                  <div>
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="item-quantity"
                    >
                      Quantity
                    </label>

                    <input
                      id="item-quantity"
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) =>
                        setItemQuantity(e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="item-unit"
                    >
                      Unit
                    </label>

                    <select
                      id="item-unit"
                      value={itemUnit}
                      onChange={(e) =>
                        setItemUnit(e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="pcs">Pieces</option>
                      <option value="kg">Kilogram</option>
                      <option value="g">Gram</option>
                      <option value="liter">Liter</option>
                      <option value="ml">Milliliter</option>
                      <option value="pack">Pack</option>
                      <option value="dozen">Dozen</option>
                    </select>
                  </div>
                </div>

                {/* Priority */}

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="item-priority"
                  >
                    Priority
                  </label>

                  <select
                    id="item-priority"
                    value={itemPriority}
                    onChange={(e) =>
                      setItemPriority(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Notes */}

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="item-notes"
                  >
                    Notes (Optional)
                  </label>

                  <textarea
                    id="item-notes"
                    rows="2"
                    placeholder="Any special instructions..."
                    value={itemNotes}
                    onChange={(e) =>
                      setItemNotes(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  ></textarea>
                </div>

                {/* Buttons */}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeAddItemForm}
                    className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition duration-300"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-700 transition duration-300"
                  >
                    {editingItemId ? "Update Item" : "Add Item"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    );
  }

    // =========================================================
  // AI ASSISTANT VIEW
  // =========================================================

  if (currentView === "ai-assistant") {
    return (
      <AIAssistant
        user={user}
        lists={lists}
        onBack={() => setCurrentView("lists")}
        onAddItems={addAIItemsToList}
        onCreateList={createAIList}
        onUpdateItem={updateItemDetails}
      />
    );
  }
    // =========================================================
  // INVENTORY VIEW
  // =========================================================

  if (currentView === "inventory") {
    return (
      <ModuleShell
        title="Inventory"
        icon="fa-boxes-stacked"
        onBack={() => setCurrentView("lists")}
      >
        <Inventory />
      </ModuleShell>
    );
  }

  // =========================================================
  // BUDGET VIEW
  // =========================================================

  if (currentView === "budget") {
    return (
      <ModuleShell
        title="Budget & Expenses"
        icon="fa-wallet"
        onBack={() => setCurrentView("lists")}
      >
        <div className="space-y-8">
          <Budget />
          <Expenses />
        </div>
      </ModuleShell>
    );
  }

  // =========================================================
  // PROFILE VIEW
  // =========================================================

  if (currentView === "profile") {
    return (
      <Profile
        user={user}
        onUserUpdate={onUserUpdate}
        onBack={() => setCurrentView("lists")}
      />
    );
  }

  // =========================================================
  // SHARING VIEW
  // =========================================================

  if (currentView === "sharing") {
    return (
      <Sharing
        user={user}
        lists={lists}
        onBack={() => setCurrentView("lists")}
        onOpenSharedList={openSharedList}
      />
    );
  }

  // =========================================================
  // NOTIFICATIONS VIEW
  // =========================================================

  if (currentView === "notifications") {
    return (
      <Notifications
        user={user}
        onBack={() => setCurrentView("lists")}
        onOpenSharedList={openSharedList}
      />
    );
  }

  // =========================================================
  // DASHBOARD VIEW
  // =========================================================

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">

        {/* App Header */}

        <div className="flex justify-between items-center mb-8">

          <div className="flex items-center">
            <img
              src="https://img.icons8.com/fluency/48/000000/grocery-bag.png"
              alt="Graco Logo"
              className="h-8 w-8 mr-2"
            />

            <span className="font-semibold text-emerald-700 text-2xl">
              Graco
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Welcome, {user.name}
            </span>

            <button
              type="button"
              onClick={() => setCurrentView("profile")}
              className="text-emerald-600 hover:text-emerald-800 font-medium"
            >
              <i className="fas fa-user-circle mr-1"></i>
              Profile
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="text-emerald-600 hover:text-emerald-800 font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard Heading */}

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-bold text-gray-800">
            My Grocery Lists
          </h2>

          <div className="flex items-center space-x-3">

            {/* AI Assistant */}

<button
  type="button"
  onClick={() => setCurrentView("ai-assistant")}
  className="bg-white text-emerald-700 border border-emerald-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-50 transition duration-300"
>
  <i className="fas fa-robot mr-1"></i>
  AI Assistant
</button>

            {/* Inventory */}

            <button
              type="button"
              onClick={() => setCurrentView("inventory")}
              className="bg-white text-emerald-700 border border-emerald-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-50 transition duration-300"
            >
              <i className="fas fa-boxes-stacked mr-1"></i>
              Inventory
            </button>

            {/* Budget */}

            <button
              type="button"
              onClick={() => setCurrentView("budget")}
              className="bg-white text-emerald-700 border border-emerald-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-50 transition duration-300"
            >
              <i className="fas fa-wallet mr-1"></i>
              Budget
            </button>

            {/* Sharing */}

            <button
              type="button"
              onClick={() => setCurrentView("sharing")}
              className="bg-white text-emerald-700 border border-emerald-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-50 transition duration-300"
            >
              <i className="fas fa-share-nodes mr-1"></i>
              Sharing
            </button>

            {/* Notifications */}

            <button
              type="button"
              onClick={() => setCurrentView("notifications")}
              className="bg-white text-emerald-700 border border-emerald-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-50 transition duration-300"
            >
              <span className="relative inline-flex items-center">

                <i className="fas fa-bell mr-1"></i>

                Notifications

                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-3 -right-3 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}

              </span>
            </button>

            {/* New List */}

            <button
              type="button"
              onClick={() => setShowNewListForm(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition duration-300"
            >
              <i className="fas fa-plus mr-1"></i>
              New List
            </button>

          </div>
        </div>

        {/* Lists */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">

          {lists.length === 0 ? (

            <div className="col-span-full text-center py-8">

              <i className="fas fa-list-check text-4xl text-gray-300 mb-4"></i>

              <h3 className="text-lg font-medium text-gray-500">
                No lists yet
              </h3>

              <p className="text-gray-400 mb-4">
                Create your first grocery list to get started
              </p>

              <button
                type="button"
                onClick={() => setShowNewListForm(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition duration-300"
              >
                <i className="fas fa-plus mr-1"></i>
                Create List
              </button>

            </div>

          ) : (

            lists.map((list) => {

              const itemCount = list.items
                ? list.items.length
                : 0;

              const completedCount = list.items
                ? list.items.filter(
                    (item) => item.completed
                  ).length
                : 0;

              const progress =
                itemCount > 0
                  ? (completedCount / itemCount) * 100
                  : 0;

              return (
                <div
                  key={list.id}
                  onClick={() => openList(list.id)}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition duration-300 cursor-pointer"
                >

                  <div className="flex justify-between items-start mb-2">

                    <h3 className="font-bold text-lg text-gray-800 truncate">
                      {list.name}
                    </h3>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteList(list.id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition duration-300"
                    >
                      <i className="fas fa-trash-alt text-sm"></i>
                    </button>

                  </div>

                  <div className="flex justify-between text-sm text-gray-500">
                    <span>
                      {itemCount} items
                    </span>

                    <span>
                      {completedCount} completed
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">

                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">

                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${progress}%`,
                        }}
                      ></div>

                    </div>

                  </div>

                </div>
              );
            })

          )}

        </div>

        {/* New List Form */}

        {showNewListForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">

            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Create New List
            </h3>

            <form onSubmit={createNewList}>

              <div className="mb-4">

                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="list-name"
                >
                  List Name
                </label>

                <input
                  id="list-name"
                  type="text"
                  placeholder="e.g. Weekly Groceries"
                  value={listName}
                  onChange={(e) =>
                    setListName(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />

              </div>

              <div className="flex justify-end space-x-3">

                <button
                  type="button"
                  onClick={() => {
                    setShowNewListForm(false);
                    setListName("");
                  }}
                  className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition duration-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-700 transition duration-300"
                >
                  Create List
                </button>

              </div>

            </form>

          </div>
        )}

      </div>
    </section>
  );
}

export default GroceryApp;