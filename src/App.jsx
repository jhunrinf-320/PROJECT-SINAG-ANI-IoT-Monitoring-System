import React from "react";
import Sidebar from "./components/Sidebar";

function App() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: "#f5f7fa",
      }}
    >

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main
        style={{
          flex: 1,
          padding: "40px",
          background: "#f5f7fa",
        }}
      >

        <h1
          style={{
            color: "#14532d",
            fontSize: "32px",
            marginBottom: "10px",
          }}
        >
          SINAG-ANI IoT Dashboard
        </h1>

        <p
          style={{
            color: "#64748b",
            fontSize: "16px",
          }}
        >
          Dashboard is working.
        </p>


        {/* TEST BOX */}

        <div
          style={{
            marginTop: "30px",
            padding: "30px",
            background: "#ffffff",
            border: "3px solid #16a34a",
            borderRadius: "20px",
          }}
        >

          <h2
            style={{
              color: "#14532d",
              marginTop: 0,
            }}
          >
            DRYING CONTROL
          </h2>

          <p>
            Select a drying operation:
          </p>


          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
              marginTop: "20px",
            }}
          >

            <button
              style={{
                padding: "16px 25px",
                background: "#f59e0b",
                color: "#422006",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              INITIAL HIGH
            </button>


            <button
              style={{
                padding: "16px 25px",
                background: "#166534",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              MAIN DRYING
            </button>


            <button
              style={{
                padding: "16px 25px",
                background: "#0f766e",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              FINAL DRYING
            </button>


            <button
              style={{
                padding: "16px 25px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              STOP
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}

export default App;
