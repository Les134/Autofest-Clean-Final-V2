import { collection, onSnapshot } from "firebase/firestore";

useEffect(() => {
  const unsub = onSnapshot(
    collection(db, "events", eventName, "rounds", round, "scores"),
    snap => {
      setData(snap.docs.map(d => d.data()));
    }
  );
  return () => unsub();
}, [eventName, round]);
