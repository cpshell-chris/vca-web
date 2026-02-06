import express from "express";

console.log("🚀 VCA booting…");

const app = express();
const PORT = Number(process.env.PORT) || 8080;

/* =======================================================
   Sidebar HTML Renderer (UI Only)
======================================================= */
function renderSidebarHTML(roId) {
  return `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 15px;
          background: #f9fafb;
        }
        h2 {
          margin-bottom: 10px;
        }
        .tabs {
          display: flex;
          margin-bottom: 15px;
        }
        .tab {
          flex: 1;
          padding: 10px;
          cursor: pointer;
          border: 1px solid #ccc;
          background: #eee;
          text-align: center;
        }
        .tab.active {
          background: white;
          font-weight: bold;
        }
        .section {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 10px;
          padding: 10px;
        }
        details summary {
          cursor: pointer;
          font-weight: bold;
          padding: 5px;
        }
        ul {
          margin: 5px 0 10px 20px;
        }
        .disclaimer {
          font-size: 12px;
          color: gray;
          margin-top: 8px;
        }
        .loading {
          padding: 10px;
          font-style: italic;
        }
      </style>
    </head>

    <body>
      <h2>VCA Advisor Sidebar</h2>
      <p>Loading Repair Order <b>${roId}</b>…</p>

      <div class="tabs">
        <div class="tab active" id="advisorTab" onclick="showTab('advisor')">
          Advisor
        </div>
        <div class="tab" id="customerTab" onclick="showTab('customer')">
          Customer
        </div>
      </div>

      <div id="output" class="loading">Fetching VCA results…</div>

      <script>
        let vcaData = null;

        function showTab(tab) {
          document.getElementById("advisorTab").classList.remove("active");
          document.getElementById("customerTab").classList.remove("active");

          if (tab === "advisor") {
            document.getElementById("advisorTab").classList.add("active");
            renderAdvisor();
          } else {
            document.getElementById("customerTab").classList.add("active");
            renderCustomer();
          }
        }

        function renderList(items = []) {
          if (!Array.isArray(items) || items.length === 0) {
            return "<p>Not available yet.</p>";
          }
          return "<ul>" + items.map(i => "<li>" + i + "</li>").join("") + "</ul>";
        }

        function renderInternalNotes(notes = {}, aiOps = []) {
          let html = "";
          for (const [category, items] of Object.entries(notes || {})) {
            html += "<h4>" + category + "</h4>" + renderList(items);
          }
          if (Array.isArray(aiOps) && aiOps.length) {
            html +=
              "<h4>Additional Opportunities</h4>" +
              renderList(aiOps) +
              "<div class='disclaimer'>AI-generated suggestions for consideration.</div>";
          }
          return html || "<p>Not available yet.</p>";
        }

        function renderAdvisor() {
          if (!vcaData) return;
          const intel = vcaData.intelligence || {};

          document.getElementById("output").innerHTML = [
            "<details class='section'>",
            "<summary>Buying Profile</summary>",
            "<p>" + (intel.buyingProfile || "") + "</p>",
            "</details>",

            "<details class='section' open>",
            "<summary>RO Notes</summary>",
            "<p>" + (intel.roNotes || "") + "</p>",
            "</details>",

            "<details class='section'>",
            "<summary>Internal Notes</summary>",
            renderInternalNotes(intel.internalNotes, intel.aiSuggestedOpportunities),
            "</details>",

            "<details class='section'>",
            "<summary>Sales Script</summary>",
            "<p>" + (intel.salesScript || "") + "</p>",
            "</details>",

            "<details class='section'>",
            "<summary>Follow-Up Schedule</summary>",
            "<h4>6 Months</h4>",
            renderList(intel.followUpSchedule?.sixMonth),
            "<h4>12 Months</h4>",
            renderList(intel.followUpSchedule?.twelveMonth),
            "</details>"
          ].join("");
        }

        function renderCustomer() {
          if (!vcaData) return;
          const intel = vcaData.intelligence || {};
          document.getElementById("output").innerHTML =
            "<div class='section'>" +
            "<h3>Customer Notes</h3>" +
            "<p>" + (intel.customerFacingNotes || "") + "</p>" +
            "</div>";
        }

        async function load() {
          const res = await fetch("/api/vca?roId=${roId}");
          vcaData = await res.json();
          renderAdvisor();
        }

        load();
      </script>
    </body>
  </html>
  `;
}

/* =======================================================
   Routes
======================================================= */
app.get("/", (req, res) => {
  const roId = req.query.roId;
  if (!roId) {
    return res.send("<h2>VCA Advisor Sidebar</h2><p>Add ?roId=XXXXX</p>");
  }
  res.send(renderSidebarHTML(roId));
});

app.get("/api/vca", async (req, res) => {
  try {
    const roId = req.query.roId;
    if (!roId) {
      return res.status(400).json({ error: "Missing roId" });
    }

    // IMPORTANT: deferred imports (Cloud Run safe)
    const { fetchRepairOrder } = await import("./tekmetricFetch.js");
    const { buildVcaIntelligence } = await import("./vcaIntelligence.js");

    const repairOrder = await fetchRepairOrder(roId);
    const intelligence = await buildVcaIntelligence({ repairOrder });

    res.json({ context: { repairOrder }, intelligence });
  } catch (err) {
    console.error("API failure:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =======================================================
   Start Server
======================================================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Listening on port ${PORT}`);
});
