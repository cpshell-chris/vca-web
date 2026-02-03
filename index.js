import express from "express";
import { fetchRepairOrder } from "./tekmetricFetch.js";

console.log("🚀 VCA booting…");

const app = express();
const PORT = process.env.PORT || 8080;

/* =======================================================
   1. Sidebar UI Route
======================================================= */
app.get("/", async (req, res) => {
  const roId = req.query.roId;

  if (!roId) {
    return res.send(`
      <html>
        <body style="font-family:Arial;padding:20px;">
          <h2>VCA Advisor Sidebar</h2>
          <p>Add <code>?roId=XXXXX</code> to the URL.</p>
        </body>
      </html>
    `);
  }

  res.send(`
    <html>
      <head>
        <style>
          body {
            font-family: Arial;
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

          .disclaimer {
            font-size: 12px;
            color: gray;
            margin-top: 5px;
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

        <!-- Tabs -->
        <div class="tabs">
          <div class="tab active" id="advisorTab" onclick="showTab('advisor')">
            Advisor View
          </div>
          <div class="tab" id="customerTab" onclick="showTab('customer')">
            Customer View
          </div>
        </div>

        <!-- Output -->
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

          function renderAdvisor() {
            if (!vcaData) return;

            const intel = vcaData.intelligence || {};

            document.getElementById("output").innerHTML = `
              <details class="section">
                <summary>Buying Profile</summary>
                <p>${intel.buyingProfile || "Not available yet."}</p>
              </details>

              <details class="section" open>
                <summary>RO Notes (Copy/Paste)</summary>
                <p>${intel.roNotes || "Not available yet."}</p>
              </details>

              <details class="section">
                <summary>Internal Notes</summary>
                <pre>${JSON.stringify(intel.internalNotes || {}, null, 2)}</pre>
              </details>

              <details class="section">
                <summary>Sales Script</summary>
                <p>${intel.salesScript || "Not available yet."}</p>
              </details>

              <details class="section">
                <summary>Follow Up Schedule</summary>
                <pre>${JSON.stringify(intel.followUpSchedule || {}, null, 2)}</pre>
              </details>

              <details class="section">
                <summary>Additional Opportunities (AI Suggested)</summary>
                <p>${intel.aiSuggestedOpportunities || "None yet."}</p>
                <div class="disclaimer">
                  Disclaimer: These opportunities are AI-generated suggestions based on available vehicle data.
                </div>
              </details>
            `;
          }

          function renderCustomer() {
            if (!vcaData) return;

            const intel = vcaData.intelligence || {};

            document.getElementById("output").innerHTML = `
              <div class="section">
                <h3>Customer Notes</h3>
                <p>${intel.customerFacingNotes || "Not available yet."}</p>
              </div>
            `;
          }

          async function load() {
            const res = await fetch("/api/vca?roId=${roId}");
            vcaData = await res.json();

            // Default load Advisor view first
            renderAdvisor();
          }

          load();
        </script>
      </body>
    </html>
  `);
});

/* =======================================================
   2. Backend API Route
======================================================= */
app.get("/api/vca", async (req, res) => {
  try {
    const roId = req.query.roId;

    if (!roId) {
      return res.status(400).json({ error: "Missing roId" });
    }

    const repairOrder = await fetchRepairOrder(roId);

    // TEMP MOCK INTELLIGENCE (until GPT wired back in)
    const intelligence = {
      buyingProfile: "Buying profile will be generated by GPT soon.",
      roNotes: "Short RO Notes will appear here.",
      customerFacingNotes: "Customer-facing summary will appear here.",
      internalNotes: {
        safety: ["Example safety item"],
        maintenance: ["Example maintenance item"],
      },
      salesScript: "Sales script will appear here.",
      followUpSchedule: {
        sixMonth: ["Inspection + fluid check"],
        twelveMonth: ["Full maintenance review"],
      },
      aiSuggestedOpportunities: "None yet.",
    };

    res.json({
      context: {
        repairOrder,
      },
      intelligence,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* =======================================================
   Start Server
======================================================= */
app.listen(PORT, () => {
  console.log(`✅ Listening on port ${PORT}`);
});
