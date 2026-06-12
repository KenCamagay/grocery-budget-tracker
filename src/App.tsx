import { useEffect, useMemo, useState } from "react";

type Screen = "home" | "grocery" | "history";

type GroceryItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type GroceryTrip = {
  id: string;
  date: string;
  budget: number;
  items: GroceryItem[];
  spent: number;
  remaining: number;
};

const STORAGE_KEYS = {
  screen: "grocery-budget-tracker-screen",
  budget: "grocery-budget-tracker-budget",
  items: "grocery-budget-tracker-items",
  history: "grocery-budget-tracker-history",
};
const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};
function App() {
  const [screen, setScreen] = useState<Screen>(() => {
  const savedScreen = localStorage.getItem(STORAGE_KEYS.screen);

  if (
    savedScreen === "home" ||
    savedScreen === "grocery" ||
    savedScreen === "history"
  ) {
    return savedScreen;
  }

  return "home";
});

const [budget, setBudget] = useState<number>(() => {
  const savedBudget = localStorage.getItem(STORAGE_KEYS.budget);

  if (!savedBudget) {
    return 2000;
  }

  const parsedBudget = Number(savedBudget);
  return Number.isFinite(parsedBudget) ? parsedBudget : 2000;
});

const [itemName, setItemName] = useState("");
const [itemPrice, setItemPrice] = useState("");
const [itemQuantity, setItemQuantity] = useState("1");
const [editingItemId, setEditingItemId] = useState<string | null>(null);
const [editItemName, setEditItemName] = useState("");
const [editItemPrice, setEditItemPrice] = useState("");
const [editItemQuantity, setEditItemQuantity] = useState("1");

const [items, setItems] = useState<GroceryItem[]>(() => {
  const savedItems = localStorage.getItem(STORAGE_KEYS.items);

  if (!savedItems) {
    return [];
  }

  try {
    const parsedItems = JSON.parse(savedItems) as GroceryItem[];

    if (!Array.isArray(parsedItems)) {
      return [];
    }

    return parsedItems.filter((item) => {
      return (
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.quantity === "number"
      );
    });
  } catch {
    return [];
  }
});

const [history, setHistory] = useState<GroceryTrip[]>(() => {
  const savedHistory = localStorage.getItem(STORAGE_KEYS.history);

  if (!savedHistory) {
    return [];
  }

  try {
    const parsedHistory = JSON.parse(savedHistory) as GroceryTrip[];

    if (!Array.isArray(parsedHistory)) {
      return [];
    }

    return parsedHistory.filter((trip) => {
      return (
        typeof trip.id === "string" &&
        typeof trip.date === "string" &&
        typeof trip.budget === "number" &&
        Array.isArray(trip.items) &&
        typeof trip.spent === "number" &&
        typeof trip.remaining === "number"
      );
    });
  } catch {
    return [];
  }
});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.screen, screen);
  }, [screen]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.budget, String(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }, [history]);

  const spent = useMemo(() => {
    return items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  }, [items]);

  const remaining = budget - spent;
  const percentageUsed = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = remaining < 0;

  const formatPeso = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const addItem = () => {
    const cleanName = itemName.trim();
    const price = Number(itemPrice);
    const quantity = Number(itemQuantity);

    if (!cleanName || !price || price <= 0 || !quantity || quantity <= 0) {
      return;
    }

    const newItem: GroceryItem = {
      id: createId(),
      name: cleanName,
      price,
      quantity,
    };

    setItems((currentItems) => [newItem, ...currentItems]);
    setItemName("");
    setItemPrice("");
    setItemQuantity("1");
    setBudget(2000);
  };

  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  const startEditingItem = (item: GroceryItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemPrice(String(item.price));
    setEditItemQuantity(String(item.quantity));
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    setEditItemName("");
    setEditItemPrice("");
    setEditItemQuantity("1");
  };

  const saveEditedItem = () => {
    const cleanName = editItemName.trim();
    const price = Number(editItemPrice);
    const quantity = Number(editItemQuantity);

    if (!editingItemId || !cleanName || price <= 0 || quantity <= 0) {
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              name: cleanName,
              price,
              quantity,
            }
          : item
      )
    );

    cancelEditingItem();
  };

  const clearList = () => {
    setItems([]);
  };
  const saveTrip = () => {
    if (items.length === 0) {
      return;
    }

    const newTrip: GroceryTrip = {
      id: createId(),
      date: new Date().toISOString(),
      budget,
      items,
      spent,
      remaining,
    };

    setHistory((currentHistory) => [newTrip, ...currentHistory]);
    setItems([]);
    setItemName("");
    setItemPrice("");
    setBudget(2000);
    setScreen("history");
  };

  const deleteTrip = (id: string) => {
    setHistory((currentHistory) =>
      currentHistory.filter((trip) => trip.id !== id)
    );
  };
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-6 text-[#2f2a24] sm:px-6">
      <section className="mx-auto max-w-md">
        {screen === "home" && (
          <HomeScreen
            onStartGrocery={() => setScreen("grocery")}
            onViewHistory={() => setScreen("history")}
            currentSpent={spent}
            currentRemaining={remaining}
            formatPeso={formatPeso}
          />
        )}

        {screen === "grocery" && (
          <GroceryScreen
            budget={budget}
            setBudget={setBudget}
            itemName={itemName}
            setItemName={setItemName}
            itemPrice={itemPrice}
            setItemPrice={setItemPrice}
            itemQuantity={itemQuantity}
            setItemQuantity={setItemQuantity}
            items={items}
            spent={spent}
            remaining={remaining}
            percentageUsed={percentageUsed}
            isOverBudget={isOverBudget}
            formatPeso={formatPeso}
            addItem={addItem}
            removeItem={removeItem}
            clearList={clearList}
            saveTrip={saveTrip}
            editingItemId={editingItemId}
            editItemName={editItemName}
            setEditItemName={setEditItemName}
            editItemPrice={editItemPrice}
            setEditItemPrice={setEditItemPrice}
            editItemQuantity={editItemQuantity}
            setEditItemQuantity={setEditItemQuantity}
            startEditingItem={startEditingItem}
            cancelEditingItem={cancelEditingItem}
            saveEditedItem={saveEditedItem}
            onBack={() => setScreen("home")}
          />
        )}

        {screen === "history" && (
          <HistoryScreen
            history={history}
            formatPeso={formatPeso}
            deleteTrip={deleteTrip}
            onBack={() => setScreen("home")}
          />
        )}
      </section>
    </main>
  );
}

type HomeScreenProps = {
  onStartGrocery: () => void;
  onViewHistory: () => void;
  currentSpent: number;
  currentRemaining: number;
  formatPeso: (amount: number) => string;
};

function HomeScreen({
  onStartGrocery,
  onViewHistory,
  currentSpent,
  currentRemaining,
  formatPeso,
}: HomeScreenProps) {
  const hasCurrentList = currentSpent > 0;
  const isOverBudget = currentRemaining < 0;

  return (
    <div className="relative flex min-h-[calc(100vh-48px)] flex-col overflow-hidden">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#ead2b3]" />
      <div className="pointer-events-none absolute -left-24 top-32 h-48 w-48 rounded-full bg-[#f1dfc8]" />

      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#9a6b3f]">
              Welcome back
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#2f2a24]">
              Grocery Buddy
            </h1>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-black/5">
            🛒
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-[#2f2a24] p-6 text-white shadow-sm">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-14 left-8 h-36 w-36 rounded-full bg-[#d7b98f]/20" />

          <div className="relative">
            <div className="mb-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#f3d9b5]">
              Offline grocery tracker
            </div>

            <h2 className="max-w-[260px] text-4xl font-bold leading-tight tracking-tight">
              Track every peso while shopping.
            </h2>

            <p className="mt-4 max-w-[290px] text-sm leading-6 text-white/70">
              Add products, watch the total update, and know how much budget is
              left before checkout.
            </p>

            <div className="mt-6 rounded-3xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/55">Today’s spent</p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatPeso(currentSpent)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-white/55">
                    {isOverBudget ? "Over budget" : "Remaining"}
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      isOverBudget ? "text-[#ffb4aa]" : "text-[#b8f3c6]"
                    }`}
                  >
                    {formatPeso(Math.abs(currentRemaining))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {hasCurrentList && (
          <div className="mt-4 rounded-3xl border border-[#eadbc8] bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff1df]">
                ✨
              </div>

              <div>
                <p className="text-sm font-bold text-[#2f2a24]">
                  You have an active list
                </p>
                <p className="mt-1 text-xs leading-5 text-[#897b6e]">
                  Continue your current grocery list without losing your items.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-3">
          <button
            onClick={onStartGrocery}
            className="group rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-black/5 active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2f2a24] text-2xl text-white">
                🧺
              </div>

              <div className="flex-1">
                <p className="text-base font-bold text-[#2f2a24]">
                  {hasCurrentList ? "Continue Grocery List" : "Start Grocery List"}
                </p>
                <p className="mt-1 text-sm leading-5 text-[#897b6e]">
                  Add items and track your budget live.
                </p>
              </div>

              <div className="text-xl text-[#b9824f] transition-transform group-active:translate-x-1">
                →
              </div>
            </div>
          </button>

          <button
            onClick={onViewHistory}
            className="group rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-black/5 active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff1df] text-2xl">
                📋
              </div>

              <div className="flex-1">
                <p className="text-base font-bold text-[#2f2a24]">
                  Grocery History
                </p>
                <p className="mt-1 text-sm leading-5 text-[#897b6e]">
                  Review saved shopping trips.
                </p>
              </div>

              <div className="text-xl text-[#b9824f] transition-transform group-active:translate-x-1">
                →
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 rounded-[2rem] bg-[#fffaf4] p-5 ring-1 ring-[#eadbc8]">
          <p className="text-sm font-bold text-[#2f2a24]">Small reminder</p>
          <p className="mt-2 text-sm leading-6 text-[#897b6e]">
            This app saves on this phone/browser, so she can use it even without
            an account or database.
          </p>
        </div>
      </div>

      <p className="relative z-10 mt-auto pt-8 text-center text-xs text-[#a09180]">
        Made for simple, stress-free grocery shopping.
      </p>
    </div>
  );
}

type GroceryScreenProps = {
  budget: number;
  setBudget: (budget: number) => void;
  itemName: string;
  setItemName: (name: string) => void;
  itemPrice: string;
  setItemPrice: (price: string) => void;
  itemQuantity: string;
  setItemQuantity: (quantity: string) => void;
  items: GroceryItem[];
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  formatPeso: (amount: number) => string;
  addItem: () => void;
  removeItem: (id: string) => void;
  clearList: () => void;
  saveTrip: () => void;
  editingItemId: string | null;
  editItemName: string;
  setEditItemName: (name: string) => void;
  editItemPrice: string;
  setEditItemPrice: (price: string) => void;
  editItemQuantity: string;
  setEditItemQuantity: (quantity: string) => void;
  startEditingItem: (item: GroceryItem) => void;
  cancelEditingItem: () => void;
  saveEditedItem: () => void;
  onBack: () => void;
};

function GroceryScreen({
  budget,
  setBudget,
  itemName,
  setItemName,
  itemPrice,
  setItemPrice,
  itemQuantity,
  setItemQuantity,
  items,
  spent,
  remaining,
  percentageUsed,
  isOverBudget,
  formatPeso,
  addItem,
  removeItem,
  clearList,
  saveTrip,
  editingItemId,
  editItemName,
  setEditItemName,
  editItemPrice,
  setEditItemPrice,
  editItemQuantity,
  setEditItemQuantity,
  startEditingItem,
  cancelEditingItem,
  saveEditedItem,
  onBack,
}: GroceryScreenProps) {
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#2f2a24] shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
        >
          ← Back
        </button>

        <div className="rounded-full bg-white px-4 py-2 text-xs font-bold tracking-[0.2em] text-[#9a6b3f] shadow-sm ring-1 ring-black/5">
          LIST
        </div>
      </div>

      <div className="mb-5">
        <p className="text-sm font-semibold text-[#9a6b3f]">Today’s shopping</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#2f2a24]">
          Grocery List
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#897b6e]">
          Add items as you shop and keep the total easy to follow.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-[#2f2a24] p-5 text-white shadow-sm">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-[#d7b98f]/20" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/60">
                {isOverBudget ? "Over budget by" : "Remaining budget"}
              </p>

              <p
                className={`mt-2 text-4xl font-bold tracking-tight ${
                  isOverBudget ? "text-[#ffb4aa]" : "text-white"
                }`}
              >
                {formatPeso(Math.abs(remaining))}
              </p>
            </div>

            <div
              className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
                isOverBudget
                  ? "bg-[#ffb4aa]/20 text-[#ffb4aa]"
                  : "bg-[#b8f3c6]/15 text-[#b8f3c6]"
              }`}
            >
              {isOverBudget ? "OVER" : "ON TRACK"}
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/55">Spent</p>
                <p className="mt-1 text-lg font-bold">{formatPeso(spent)}</p>
              </div>

              <div className="h-10 w-px bg-white/15" />

              <div className="text-right">
                <p className="text-xs text-white/55">Budget</p>
                <p className="mt-1 text-lg font-bold">{formatPeso(budget)}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-white/55">
                <span>Budget used</span>
                <span>{Math.round(percentageUsed)}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/15">
                <div
                  className={`h-full rounded-full ${
                    isOverBudget ? "bg-[#ffb4aa]" : "bg-[#d7b98f]"
                  }`}
                  style={{ width: `${percentageUsed}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-white/65">
              Budget amount
            </label>

            <div className="mt-2 flex items-center rounded-2xl bg-white px-4 text-[#2f2a24]">
              <span className="font-semibold text-[#9a6b3f]">₱</span>
              <input
                value={budget === 0 ? "" : budget}
                onChange={(event) => setBudget(Number(event.target.value))}
                type="number"
                min="0"
                className="w-full bg-transparent px-2 py-3 text-lg font-bold outline-none"
                placeholder="Enter budget"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b9824f]">
            New item
          </p>
          <h2 className="mt-1 text-lg font-bold text-[#2f2a24]">Add product</h2>
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            type="text"
            className="w-full rounded-2xl border border-[#e7d9c8] bg-[#fffaf4] px-4 py-3 font-medium outline-none focus:border-[#b9824f]"
            placeholder="Product name"
          />

          <div className="grid grid-cols-[1fr_110px] gap-3">
            <input
              value={itemPrice}
              onChange={(event) => setItemPrice(event.target.value)}
              type="number"
              min="0"
              className="w-full rounded-2xl border border-[#e7d9c8] bg-[#fffaf4] px-4 py-3 font-medium outline-none focus:border-[#b9824f]"
              placeholder="Price each"
            />

            <input
              value={itemQuantity}
              onChange={(event) => setItemQuantity(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addItem();
              }}
              type="number"
              min="1"
              className="w-full rounded-2xl border border-[#e7d9c8] bg-[#fffaf4] px-4 py-3 text-center font-medium outline-none focus:border-[#b9824f]"
              placeholder="Qty"
            />
          </div>

          <button
            onClick={addItem}
            className="w-full rounded-2xl bg-[#2f2a24] px-4 py-3 font-semibold text-white shadow-sm active:scale-[0.99]"
          >
            Add to List
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b9824f]">
              Current list
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#2f2a24]">Products</h2>
            <p className="mt-1 text-xs text-[#897b6e]">
              {items.length} item{items.length === 1 ? "" : "s"} added
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearList}
              className="rounded-full bg-[#fff1f0] px-3 py-1 text-sm font-semibold text-[#b44a3c]"
            >
              Clear
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-[#ddcdbb] bg-[#fffaf4] p-6 text-center">
            <p className="text-sm font-bold text-[#51483f]">No products yet</p>
            <p className="mt-1 text-xs leading-5 text-[#897b6e]">
              Add the first item to start tracking your total.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((item) => {
              const isEditing = editingItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl bg-[#fffaf4] p-4 ring-1 ring-[#eadbc8]"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        value={editItemName}
                        onChange={(event) => setEditItemName(event.target.value)}
                        className="w-full rounded-2xl border border-[#e7d9c8] bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#b9824f]"
                        placeholder="Product name"
                      />

                      <div className="grid grid-cols-[1fr_100px] gap-3">
                        <input
                          value={editItemPrice}
                          onChange={(event) =>
                            setEditItemPrice(event.target.value)
                          }
                          type="number"
                          min="0"
                          className="w-full rounded-2xl border border-[#e7d9c8] bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#b9824f]"
                          placeholder="Price"
                        />

                        <input
                          value={editItemQuantity}
                          onChange={(event) =>
                            setEditItemQuantity(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") saveEditedItem();
                          }}
                          type="number"
                          min="1"
                          className="w-full rounded-2xl border border-[#e7d9c8] bg-white px-4 py-3 text-center text-sm font-semibold outline-none focus:border-[#b9824f]"
                          placeholder="Qty"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={saveEditedItem}
                          className="flex-1 rounded-2xl bg-[#2f2a24] px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.99]"
                        >
                          Save
                        </button>

                        <button
                          onClick={cancelEditingItem}
                          className="flex-1 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-[#51483f] ring-1 ring-[#eadbc8] active:scale-[0.99]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#2f2a24]">
                          {item.name}
                        </p>
                        <p className="mt-1 text-sm text-[#897b6e]">
                          {formatPeso(item.price)} × {item.quantity}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-[#2f2a24]">
                          {formatPeso(item.price * item.quantity)}
                        </p>

                        <div className="mt-2 flex items-center justify-end gap-3">
                          <button
                            onClick={() => startEditingItem(item)}
                            className="text-sm font-semibold text-[#9a6b3f]"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-sm font-semibold text-[#b44a3c]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-5 rounded-[2rem] bg-[#2f2a24] p-5 text-white shadow-sm">
          <p className="text-sm font-bold">Finished shopping?</p>
          <p className="mt-1 text-xs leading-5 text-white/65">
            Save this grocery trip to history, then start fresh next time.
          </p>

          <button
            onClick={saveTrip}
            className="mt-4 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-[#2f2a24] active:scale-[0.99]"
          >
            Save Trip
          </button>
        </div>
      )}
    </>
  );
}

type HistoryScreenProps = {
  history: GroceryTrip[];
  formatPeso: (amount: number) => string;
  deleteTrip: (id: string) => void;
  onBack: () => void;
};

function HistoryScreen({
  history,
  formatPeso,
  deleteTrip,
  onBack,
}: HistoryScreenProps) {
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatTime = (date: string) => {
    return new Intl.DateTimeFormat("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const totalTrips = history.length;

  const totalSpent = history.reduce((total, trip) => {
    return total + trip.spent;
  }, 0);

  const totalItems = history.reduce((total, trip) => {
    return total + trip.items.length;
  }, 0);

  return (
    <div className="min-h-[calc(100vh-48px)]">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#2f2a24] shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
        >
          ← Back
        </button>

        <div className="rounded-full bg-white px-4 py-2 text-xs font-bold tracking-[0.2em] text-[#9a6b3f] shadow-sm ring-1 ring-black/5">
          LOG
        </div>
      </div>

      <div className="mb-5">
        <p className="text-sm font-semibold text-[#9a6b3f]">Saved records</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#2f2a24]">
          Grocery History
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#897b6e]">
          Review previous grocery trips and check how much was spent.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-[#2f2a24] p-5 text-white shadow-sm">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-[#d7b98f]/20" />

        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d7b98f]">
            Summary
          </p>

          <p className="mt-3 text-4xl font-bold tracking-tight">
            {formatPeso(totalSpent)}
          </p>

          <p className="mt-2 text-sm text-white/60">Total recorded spending</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/55">Trips</p>
              <p className="mt-1 text-2xl font-bold">{totalTrips}</p>
            </div>

            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/55">Items</p>
              <p className="mt-1 text-2xl font-bold">{totalItems}</p>
            </div>
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="rounded-3xl border border-dashed border-[#ddcdbb] bg-[#fffaf4] p-6 text-center">
            <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-[#d7b98f]" />

            <p className="text-sm font-bold text-[#51483f]">
              No saved trips yet
            </p>

            <p className="mt-2 text-xs leading-5 text-[#897b6e]">
              Once a grocery list is saved, it will appear here as a simple
              receipt-style record.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {history.map((trip, index) => {
            const isOverBudget = trip.remaining < 0;

            return (
              <div
                key={trip.id}
                className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-black/5"
              >
                <div className="border-b border-[#eee2d4] bg-[#fffaf4] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b9824f]">
                        Trip {history.length - index}
                      </p>

                      <h2 className="mt-2 text-lg font-bold text-[#2f2a24]">
                        {formatDate(trip.date)}
                      </h2>

                      <p className="mt-1 text-xs text-[#897b6e]">
                        Saved at {formatTime(trip.date)} · {trip.items.length}{" "}
                        item{trip.items.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteTrip(trip.id)}
                      className="rounded-full bg-[#fff1f0] px-3 py-1 text-sm font-semibold text-[#b44a3c] active:scale-[0.98]"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadbc8]">
                      <p className="text-xs text-[#897b6e]">Budget</p>
                      <p className="mt-1 text-sm font-bold text-[#2f2a24]">
                        {formatPeso(trip.budget)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadbc8]">
                      <p className="text-xs text-[#897b6e]">Spent</p>
                      <p className="mt-1 text-sm font-bold text-[#2f2a24]">
                        {formatPeso(trip.spent)}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl p-3 ring-1 ${
                        isOverBudget
                          ? "bg-[#fff1f0] ring-[#f3c7c2]"
                          : "bg-[#edf8ef] ring-[#cae8d0]"
                      }`}
                    >
                      <p className="text-xs text-[#897b6e]">
                        {isOverBudget ? "Over" : "Left"}
                      </p>
                      <p
                        className={`mt-1 text-sm font-bold ${
                          isOverBudget ? "text-[#c0342b]" : "text-[#247a3d]"
                        }`}
                      >
                        {formatPeso(Math.abs(trip.remaining))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b9824f]">
                      Items bought
                    </p>

                    <p className="text-xs font-semibold text-[#897b6e]">
                      {trip.items.length} total
                    </p>
                  </div>

                  <div className="space-y-2">
                    {trip.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffaf4] px-4 py-3 ring-1 ring-[#eadbc8]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#2f2a24]">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-[#897b6e]">
                            {formatPeso(item.price)} × {item.quantity}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-bold text-[#51483f]">
                          {formatPeso(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#2f2a24] px-4 py-3 text-white">
                    <p className="text-sm font-semibold">Trip total</p>
                    <p className="text-sm font-bold">
                      {formatPeso(trip.spent)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;