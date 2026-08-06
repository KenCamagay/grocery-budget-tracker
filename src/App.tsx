import { useEffect, useMemo, useState } from "react";

type Screen =
  | "home"
  | "grocery"
  | "history"
  | "share";

type Store = {
  id: string;
  name: string;
};


type GroceryItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  storeId: string;
};

type GroceryTrip = {
  id: string;
  date: string;
  budget: number;

  stores: {
    id:string;
    name:string;
    items:GroceryItem[];
    total:number;
  }[];

  spent:number;
  remaining:number;
};

const STORAGE_KEYS = {
  screen: "grocery-budget-tracker-screen",
  budget: "grocery-budget-tracker-budget",
  items: "grocery-budget-tracker-items",
  history: "grocery-budget-tracker-history",
  stores: "grocery-budget-tracker-stores",
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

const [selectedStoreId, setSelectedStoreId] = useState("");

const [editingItemId, setEditingItemId] = useState<string | null>(null);
const [editItemName, setEditItemName] = useState("");
const [editItemPrice, setEditItemPrice] = useState("");
const [editItemQuantity, setEditItemQuantity] = useState("1");

const [sharedData,setSharedData] = useState<{
  budget:number;
  items:GroceryItem[];
  stores:Store[];
} | null>(null);

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
        typeof item.quantity === "number" &&
        (
          typeof item.storeId === "string" ||
          item.storeId === undefined
        )
      );
    });
  } catch {
    return [];
  }
});

const [stores,setStores] = useState<Store[]>(()=>{

const saved =
localStorage.getItem(STORAGE_KEYS.stores);

if(!saved){
 return [];
}

try{

return JSON.parse(saved);

}catch{

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
        Array.isArray(trip.stores) &&
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

useEffect(()=>{

localStorage.setItem(
 STORAGE_KEYS.stores,
 JSON.stringify(stores)
 );

},[stores]);

useEffect(()=>{

const params = new URLSearchParams(
  window.location.search
);

const data = params.get("data");

if(data){

  try{

   const decoded = JSON.parse(
  atob(decodeURIComponent(data))
);

    setSharedData(decoded);
    setScreen("share");

  }catch(error){

    console.error(
      "Invalid share link",
      error
    );

  }

}

},[]);
const importSharedList = () => {
  if (!sharedData) {
    return;
  }

  const newStores = sharedData.stores.map(store => ({
    ...store,
    id:createId()
  }));

  const newItems = sharedData.items.map(item => {
    const oldStore = sharedData.stores.find(
      store => store.id === item.storeId
    );

    const newStore = newStores.find(
      store => store.name === oldStore?.name
    );

    return {
      ...item,
      id:createId(),
      storeId:newStore?.id ?? ""
    };
  });

  setBudget(sharedData.budget);
  setStores(newStores);
  setItems(newItems);

  setScreen("grocery");

  window.history.replaceState(
    {},
    "",
    "/"
  );
};

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

const addStore = (name:string) => {
  const clean = name.trim();

  if (!clean) return;

  const newStore:Store = {
    id:createId(),
    name:clean
  };

  setStores(current => [
    ...current,
    newStore
  ]);

  setSelectedStoreId(newStore.id);
};
const deleteStore = (storeId:string) => {
  setStores(current =>
    current.filter(
      store => store.id !== storeId
    )
  );

  setItems(current =>
    current.filter(
      item => item.storeId !== storeId
    )
  );

  if(selectedStoreId === storeId){
    setSelectedStoreId("");
  }
};
 const addItem = () => {
    const cleanName = itemName.trim();
    const price = Number(itemPrice);
    const quantity = Number(itemQuantity);
    const storeExists = stores.some((store) => store.id === selectedStoreId);

    if (
      !storeExists ||
      !cleanName ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return;
    }

    const newItem: GroceryItem = {
      id: createId(),
      name: cleanName,
      price,
      quantity,
      storeId: selectedStoreId,
    };

    setItems((currentItems) => [newItem, ...currentItems]);
    setItemName("");
    setItemPrice("");
    setItemQuantity("1");
    setSelectedStoreId("");
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
    if(items.length === 0){
    return;
    }
    const groupedStores = stores
    .map(store=>{
    const storeItems =
    items.filter(
    item=>item.storeId === store.id
    );
    if(storeItems.length === 0){
    return null;
    }
    return {
    id:store.id,
    name:store.name,
    items:storeItems,
    total:
    storeItems.reduce(
    (sum,item)=>
    sum + item.price * item.quantity,
    0
    )
    };
    })
    .filter(Boolean);
    const newTrip:GroceryTrip={
    id:createId(),
    date:new Date().toISOString(),
    budget,
    stores:
    groupedStores as GroceryTrip["stores"],
    spent,
    remaining
    };
    setHistory(currentHistory=>[
    newTrip,
    ...currentHistory
    ]);
    setItems([]);
    setItemName("");
    setItemPrice("");
    setItemQuantity("1");
    setBudget(2000);
    setScreen("history");
    };

  const deleteTrip = (id: string) => {
    setHistory((currentHistory) =>
      currentHistory.filter((trip) => trip.id !== id)
    );
  };

const shareList = async () => {
  const shareData = {
    budget,
    items,
    stores
  };

  const encodedData = encodeURIComponent(
    btoa(JSON.stringify(shareData))
  );

  const shareLink =
    `${window.location.origin}/share?data=${encodedData}`;

  if(navigator.share){
    await navigator.share({
      title:"Grocery List",
      text:"Shared grocery list",
      url:shareLink
    });
  }else{
    await navigator.clipboard.writeText(shareLink);
    alert("Grocery list link copied!");
  }
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
            stores={stores}
            selectedStoreId={selectedStoreId}
            setSelectedStoreId={setSelectedStoreId}
            addStore={addStore}
            deleteStore={deleteStore}
            shareList={shareList}
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

        {screen==="share" && sharedData && (
        <ShareImportScreen
          sharedData={sharedData}
          importSharedList={importSharedList}
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
  stores:Store[];

  selectedStoreId:string;

  setSelectedStoreId:
  (id:string)=>void;

  addStore:
  (name:string)=>void;
  deleteStore:
(id:string)=>void;
  shareList:()=>void;
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
  stores,
  selectedStoreId,
  setSelectedStoreId,
  addStore,
  deleteStore,
  shareList,
  }: GroceryScreenProps){
   const groupedItems = stores.map((store) => ({
  ...store,
  items: items.filter(
    (item) => item.storeId === store.id
  ),
}));
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
          <div className="rounded-2xl bg-[#fffaf4] p-3 ring-1 ring-[#eadbc8]">
            <p className="mb-2 text-sm font-bold text-[#2f2a24]">
              Manage Stores
            </p>

            <div className="flex gap-2">
              <input
                id="newStoreInput"
                type="text"
                placeholder="Store name"
                className="flex-1 rounded-xl border border-[#e7d9c8] px-3 py-2 text-sm"
              />

              <button
                onClick={() => {
                  const input = document.getElementById(
                    "newStoreInput"
                  ) as HTMLInputElement;

                  if (input.value.trim()) {
                    addStore(input.value);
                    input.value = "";
                  }
                }}
                className="rounded-xl bg-[#2f2a24] px-3 py-2 text-sm font-semibold text-white"
              >
                Add
              </button>
            </div>
          </div>
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

       {stores.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-[#ddcdbb] bg-[#fffaf4] p-6 text-center">
            <p className="text-sm font-bold text-[#51483f]">No stores yet</p>

            <p className="mt-1 text-xs leading-5 text-[#897b6e]">
              Add a shopping store above before adding products.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {groupedItems.map((store)=>(
              <div
                  key={store.id}
                  className="rounded-[2rem] bg-white p-5 shadow-md ring-1 ring-[#eee3d5]"
                >

               <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-black text-[#2f2a24]">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf5ed] text-xl">
                        🛒
                      </span>

                      {store.name}
                    </h3>

                    <p className="mt-2 text-xs font-medium text-[#897b6e]">
                      {store.items.length} product
                      {store.items.length === 1 ? "" : "s"}
                    </p>
                  </div>

                 <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        deleteStore(store.id);
                      }}
                      className="rounded-2xl bg-[#fff1f0] px-3 py-2 text-xs font-bold text-[#b44a3c]"
                    >
                      Delete
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedStoreId === store.id) {
                          setSelectedStoreId("");
                        } else {
                          setSelectedStoreId(store.id);
                        }
                      }}
                      className="rounded-2xl bg-[#4f9d69] px-4 py-2 text-xs font-bold text-white"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                  {selectedStoreId === store.id && (
                    <div className="mb-4 space-y-3 rounded-2xl bg-white p-4 ring-1 ring-[#eadbc8]">
                      <p className="text-sm font-bold text-[#2f2a24]">
                        Add product to {store.name}
                      </p>

                      <input
                        value={itemName}
                        onChange={(event) => setItemName(event.target.value)}
                        type="text"
                        className="w-full rounded-xl border border-[#e7d9c8] bg-[#fffaf4] px-3 py-2.5 font-medium outline-none focus:border-[#b9824f]"
                        placeholder="Product name"
                        autoFocus
                      />

                      <div className="grid grid-cols-[1fr_90px] gap-3">
                        <input
                          value={itemPrice}
                          onChange={(event) => setItemPrice(event.target.value)}
                          type="number"
                          min="0.01"
                          step="0.01"
                          className="w-full rounded-xl border border-[#e7d9c8] bg-[#fffaf4] px-3 py-2.5 font-medium outline-none focus:border-[#b9824f]"
                          placeholder="Price each"
                        />

                        <input
                          value={itemQuantity}
                          onChange={(event) => setItemQuantity(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              addItem();
                            }
                          }}
                          type="number"
                          min="1"
                          step="1"
                          className="w-full rounded-xl border border-[#e7d9c8] bg-[#fffaf4] px-3 py-2.5 text-center font-medium outline-none focus:border-[#b9824f]"
                          placeholder="Qty"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={addItem}
                        disabled={
                          !selectedStoreId ||
                          !itemName.trim() ||
                          !Number.isFinite(Number(itemPrice)) ||
                          Number(itemPrice) <= 0 ||
                          !Number.isFinite(Number(itemQuantity)) ||
                          Number(itemQuantity) <= 0
                        }
                        className="w-full rounded-xl bg-[#2f2a24] px-4 py-3 font-semibold text-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Add to {store.name}
                      </button>
                    </div>
                  )}


                <div className="space-y-3">

                  {store.items.map((item)=>(
                    <div
                      key={item.id}
                      className="rounded-2xl bg-[#fffaf4] p-4 transition hover:shadow-sm"
                    >
                      {editingItemId === item.id ? (
                        <div className="space-y-3">
                          <input
                            value={editItemName}
                            onChange={(e)=>setEditItemName(e.target.value)}
                            className="w-full rounded-xl border border-[#e7d9c8] px-3 py-2"
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <input
                              value={editItemPrice}
                              onChange={(e)=>setEditItemPrice(e.target.value)}
                              type="number"
                              className="rounded-xl border border-[#e7d9c8] px-3 py-2"
                            />

                            <input
                              value={editItemQuantity}
                              onChange={(e)=>setEditItemQuantity(e.target.value)}
                              type="number"
                              className="rounded-xl border border-[#e7d9c8] px-3 py-2"
                            />
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={saveEditedItem}
                              className="rounded-xl bg-[#2f2a24] px-4 py-2 text-white"
                            >
                              Save
                            </button>

                            <button
                              onClick={cancelEditingItem}
                              className="rounded-xl bg-[#fff1f0] px-4 py-2 text-[#b44a3c]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-[#2f2a24]">
                              {item.name}
                            </p>

                            <p className="text-sm text-[#897b6e]">
                              {formatPeso(item.price)} × {item.quantity}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-bold">
                              {formatPeso(item.price * item.quantity)}
                            </p>

                            <div className="mt-2 flex gap-3">
                              <button
                                onClick={()=>startEditingItem(item)}
                                className="text-sm font-semibold text-[#9a6b3f]"
                              >
                                Edit
                              </button>

                              <button
                                onClick={()=>removeItem(item.id)}
                                className="text-sm font-semibold text-[#b44a3c]"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                </div>


                <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#f8f6f1] px-4 py-3">
                  <div className="flex justify-between">
                   <span className="text-sm font-semibold text-[#897b6e]">
                      Store Total
                    </span>

                    <span className="font-black text-[#2f2a24]">
                      {formatPeso(
                        store.items.reduce(
                          (sum:number,item:GroceryItem)=>
                            sum + item.price * item.quantity,
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>

              </div>
            ))}
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
          <button
            onClick={shareList}
            className="mt-4 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-[#2f2a24] active:scale-[0.99]"
          >
            Share List
          </button>
        </div>
      )}
    </>
  );
}
function ShareImportScreen({
  sharedData,
  importSharedList,
}: {
  sharedData: {
    budget: number;
    items: GroceryItem[];
    stores: Store[];
  };
  importSharedList: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#fffaf4] p-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-[#2f2a24]">
          Shared Grocery List
        </h1>

        <p className="mt-3 text-[#897b6e]">
          Someone shared a grocery list with you.
        </p>

        <div className="mt-5 rounded-2xl bg-[#fffaf4] p-4">
          <p>
            Budget:
            <b>
              {" "}
              ₱{sharedData.budget.toLocaleString()}
            </b>
          </p>

          <p>
            Stores:
            <b>
              {" "}
              {sharedData.stores.length}
            </b>
          </p>

          <p>
            Items:
            <b>
              {" "}
              {sharedData.items.length}
            </b>
          </p>
        </div>

        <button
          onClick={importSharedList}
          className="mt-5 w-full rounded-2xl bg-[#32418C] px-4 py-3 font-bold text-white"
        >
          Import Copy
        </button>
      </div>
    </div>
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
    return total + trip.stores.reduce(
      (sum, store) => sum + store.items.length,
      0
    );
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
                        Saved at {formatTime(trip.date)} · {
                          trip.stores.reduce(
                            (sum, store)=>sum + store.items.length,
                            0
                          )
                        } items
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
                      {
                        trip.stores.reduce(
                          (sum,store)=>sum + store.items.length,
                          0
                        )
                      } total
                    </p>
                  </div>

                  <div className="space-y-2">
                    {trip.stores.map((store)=>(
                      <div key={store.id} className="mb-4">

                        <p className="mb-2 font-bold text-[#2f2a24]">
                          🏪 {store.name}
                        </p>

                        {store.items.map((item)=>(
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffaf4] px-4 py-3 ring-1 ring-[#eadbc8]"
                          >
                            <div>
                              <p className="text-sm font-bold text-[#2f2a24]">
                                {item.name}
                              </p>

                              <p className="text-xs text-[#897b6e]">
                                {formatPeso(item.price)} × {item.quantity}
                              </p>
                            </div>

                            <p className="font-bold">
                              {formatPeso(item.price * item.quantity)}
                            </p>
                          </div>
                        ))}

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