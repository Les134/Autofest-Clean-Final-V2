// =========================
        value={entrant.car}
        onChange={(e) =>
          setEntrant({ ...entrant, car: e.target.value })
        }
      />

      <div>
        <button
          onClick={() => setEntrant({ ...entrant, gender: "Male" })}
          style={{ background: entrant.gender === "Male" ? "#ccc" : "#eee" }}
        >
          Male
        </button>
        <button
          onClick={() => setEntrant({ ...entrant, gender: "Female" })}
          style={{ background: entrant.gender === "Female" ? "red" : "#eee", color: entrant.gender === "Female" ? "white" : "black" }}
        >
          Female
        </button>
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
                background:
                  entrant.scores[cat] === n ? "red" : "#ddd",
                color: entrant.scores[cat] === n ? "white" : "black"
              }}
            >
              {n}
            </button>
          ))}
        </div>
      ))}

      <h2>Total: {total}</h2>

      <button
        onClick={handleSubmit}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          fontSize: 18,
          background: "black",
          color: "white"
        }}
      >
        Submit Scores
      </button>
    </div>
  );
}
