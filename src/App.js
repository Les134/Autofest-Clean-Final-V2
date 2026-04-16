// ======================================
      <h3>Judge {judge} / 6</h3>

      <input
        placeholder="Driver Name"
        value={entrant.name}
        onChange={(e) => setEntrant({ ...entrant, name: e.target.value })}
        style={{ padding: 10, marginRight: 10 }}
      />

      <input
        placeholder="Car"
        value={entrant.car}
        onChange={(e) => setEntrant({ ...entrant, car: e.target.value })}
        style={{ padding: 10 }}
      />

      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => setEntrant({ ...entrant, gender: "Male" })}
          style={{ background: entrant.gender === "Male" ? "#ccc" : "#eee", padding: 10 }}
        >Male</button>

        <button
          onClick={() => setEntrant({ ...entrant, gender: "Female" })}
          style={{
            background: entrant.gender === "Female" ? "red" : "#eee",
            color: entrant.gender === "Female" ? "white" : "black",
            padding: 10,
            marginLeft: 10
          }}
        >Female</button>
      </div>

      {categories.map((cat) => (
        <div key={cat} style={{ marginTop: 20 }}>
          <h4>{cat}</h4>
          {[...Array(21).keys()].map((n) => (
            <button
              key={n}
              onClick={() => setScore(cat, n)}
              style={{
                margin: 4,
                padding: "10px 14px",
                fontSize: 16,
                background: entrant.scores[cat] === n ? "red" : "#ddd",
                color: entrant.scores[cat] === n ? "white" : "black"
              }}
            >{n}</button>
          ))}
        </div>
      ))}

      <h2>Total: {total}</h2>

      <button
        onClick={submit}
        style={{ marginTop: 20, padding: 14, fontSize: 18, background: "black", color: "white" }}
      >Submit Scores</button>
    </div>
  );
}
