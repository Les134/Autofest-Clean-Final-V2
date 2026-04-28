 return (
    <div style={{ marginTop: 40 }}>
      <h2>Leaderboard</h2>

      {Object.keys(data).map((cls) => (
        <div key={cls}>
          <h3>{cls}</h3>
          {data[cls].map((car, i) => (
            <div key={i}>
              {i + 1}. {car.carName} - {car.total}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
