import express from "express";
import { fetchRepairOrder } from "./tekmetricFetch.js";

console.log("🚀 VCA booting…");

const app = express();
const PORT = Number(process.env.PORT) || 8080;

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

        <!-- Tabs -->
        <div class="tabs">
          <div class="tab active" id="advisorTab" onclick="showTab('advisor')">
            Advisor
          </div>
          <div class="tab" id="customerTab" onclick="showTab('customer')">
            Customer
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

          function renderList(items = []) {
            if (!Array.isArray(items) || items.length === 0) {
              return "<p>Not available yet.</p>";
            }

            return (
              "<ul>" +
              items.map((item) => "<li>" + item + "</li>").join("") +
              "</ul>"
            );
          }

          function renderInternalNotes(notes = {}) {
            if (!notes || typeof notes !== "object") {
              return "<p>Not available yet.</p>";
            }

            let html = "";

            for (const [category, items] of Object.entries(notes)) {
              html +=
                "<h4 style=\"margin-top:10px;\">" +
                category +
                "</h4>" +
                renderList(items);
            }

            return html;
          }

          function renderAdvisor() {
            if (!vcaData) return;

            const intel = vcaData.intelligence || {};

            document.getElementById("output").innerHTML = [
              "<!-- 1. Buying Profile -->",
              "<details class=\"section\">",
              "<summary>Buying Profile</summary>",
              "<p>" + (intel.buyingProfile || "Not available yet.") + "</p>",
              "</details>",
              "<!-- 2. RO Notes -->",
              "<details class=\"section\" open>",
              "<summary>RO Notes (Copy/Paste)</summary>",
              "<p>" + (intel.roNotes || "Not available yet.") + "</p>",
              "</details>",
              "<!-- 3. Internal Notes -->",
              "<details class=\"section\">",
              "<summary>Internal Notes</summary>",
              renderInternalNotes(intel.internalNotes),
              "<h4 style=\"margin-top:15px;\">Additional Opportunities</h4>",
              renderList(intel.aiSuggestedOpportunities),
              "<div class=\"disclaimer\">",
              "Disclaimer: These opportunities are AI-generated suggestions based on available vehicle data.",
              "</div>",
              "</details>",
              "<!-- 4. Sales Script -->",
              "<details class=\"section\">",
              "<summary>Sales Script</summary>",
              "<p>" + (intel.salesScript || "Not available yet.") + "</p>",
              "</details>",
              "<!-- 5. Follow Up Schedule -->",
              "<details class=\"section\">",
              "<summary>Follow Up Schedule</summary>",
              "<h4>6 Months</h4>",
              renderList(
                intel.followUpSchedule ? intel.followUpSchedule.sixMonth : null,
              ),
              "<h4>12 Months</h4>",
              renderList(
                intel.followUpSchedule
                  ? intel.followUpSchedule.twelveMonth
                  : null,
              ),
              "</details>",
            ].join("");
          }

          function renderCustomer() {
            if (!vcaData) return;

            const intel = vcaData.intelligence || {};

            document.getElementById("output").innerHTML = [
              "<div class=\"section\">",
              "<h3>Customer Notes</h3>",
              "<p>" +
                (intel.customerFacingNotes || "Not available yet.") +
                "</p>",
              "</div>",
            ].join("");
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
      buyingProfile:
        "Value-focused customer who prioritizes safety and reliability; prefers clear, concise recommendations.",

      roNotes:
        "Customer requests a full safety check and approval before any additional work is started.",

      customerFacingNotes:
        "We completed your inspection and identified a few items to keep your vehicle safe and reliable. Let us know how you’d like to proceed.",

      internalNotes: {
        safety: ["Front brake pads at 2mm", "Right headlight bulb out"],
        maintenance: ["Oil change due", "Cabin air filter dirty"],
        repair: ["Valve cover gasket seeping"],
      },

      salesScript:
        "Based on today’s inspection, I recommend addressing the safety items first. We can also take care of the maintenance items to prevent future issues. Would you like me to put together a full estimate?",

      followUpSchedule: {
        sixMonth: ["Inspection + fluid check", "Tire rotation"],
        twelveMonth: ["Full maintenance review", "Brake inspection"],
      },

      aiSuggestedOpportunities: [
        "Alignment check after brake service",
        "Replace wiper blades before rainy season",
      ],
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
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Listening on port ${PORT}`);
});
