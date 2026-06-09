// ===============================
// 1) ตั้งค่า Supabase
// ===============================
const SUPABASE_URL = "https://vbkwehwbxvbctawuehvl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZia3dlaHdieHZiY3Rhd3VlaHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5ODc0ODYsImV4cCI6MjA5NjU2MzQ4Nn0.dPfN1MJsiRd--MrXY-Y56JfXiSnaUSMPiPcMA_44RXU";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===============================
// 2) State หลัก
// ===============================
let deepLeads = [];
let currentLeadId = null;

const columns = [
  { id: "NEW", title: "New Leads", icon: "fa-bolt", color: "blue" },
  { id: "CONTACTED", title: "Contacted", icon: "fa-comments", color: "amber" },
  { id: "QUOTED", title: "Quoted", icon: "fa-file-invoice-dollar", color: "purple" },
  { id: "CLOSED", title: "Closed", icon: "fa-circle-check", color: "green" },
];

// ===============================
// 3) โหลดข้อมูลจาก Supabase
// ===============================
async function loadLeads() {
  console.log("กำลังโหลดข้อมูลจาก Supabase...");

  const { data, error } = await supabaseClient
    .from("deep_leads")
    .select("*")
    .order("id", { ascending: false });

  console.log("Supabase data:", data);
  console.log("Supabase error:", error);

  if (error) {
    alert("โหลดข้อมูลผิดพลาด: " + error.message);
    console.error(error);
    return;
  }

  deepLeads = (data || []).map((lead) => ({
    ...lead,
    status: String(lead.status || "NEW").trim().toUpperCase(),
  }));

  renderBoard();
  updateStats();
}

// ===============================
// 4) Render Kanban Board
// ===============================
function renderBoard() {
  const board = document.getElementById("kanban-board");

  if (!board) {
    console.error("ไม่พบ element id='kanban-board'");
    alert("ไม่พบ kanban-board ใน index.html");
    return;
  }

  board.innerHTML = "";

  columns.forEach((column) => {
    const leads = deepLeads.filter((lead) => {
      const status = String(lead.status || "NEW").trim().toUpperCase();
      return status === column.id;
    });

    const columnEl = document.createElement("section");
    columnEl.className =
      "min-w-[360px] max-w-[360px] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col h-full overflow-hidden";

    columnEl.innerHTML = `
      <div class="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <h3 class="font-black text-slate-700 flex items-center gap-2">
          <i class="fa-solid ${column.icon}"></i>
          ${column.title}
        </h3>
        <span class="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
          ${leads.length}
        </span>
      </div>

      <div class="p-4 space-y-4 overflow-y-auto flex-1">
        ${
          leads.length
            ? leads.map(renderLeadCard).join("")
            : `<div class="text-center text-slate-400 text-sm py-10 border-2 border-dashed border-slate-200 rounded-xl">
                ยังไม่มีข้อมูล
              </div>`
        }
      </div>
    `;

    board.appendChild(columnEl);
  });
}

// ===============================
// 5) Card ของ Lead
// ===============================
function renderLeadCard(lead) {
  const platformIcon = getPlatformIcon(lead.platform_type || lead.platformType);
  const probability = Number(lead.close_probability || lead.closeProbability || 0);

  return `
    <article 
      class="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative"
    >
      <div class="p-5">
        <div class="flex justify-between items-start gap-3 mb-3">
          <div>
            <h4 class="font-black text-slate-800 leading-tight">
              ${escapeHtml(lead.company_name || lead.companyName || "ไม่ระบุชื่อบริษัท")}
            </h4>
            <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <i class="${platformIcon}"></i>
              ${escapeHtml(lead.source || "Unknown Source")}
            </p>
          </div>

          <div class="text-right">
            <div class="${getProbabilityClass(probability)} text-white text-xs font-black px-2 py-1 rounded-lg">
              ${probability}%
            </div>
            <p class="text-[10px] text-slate-400 mt-1">โอกาสปิดงาน</p>
          </div>
        </div>

        <div class="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
          <p class="text-sm text-slate-700 line-clamp-4">
            “${escapeHtml(lead.original_text || lead.originalText || "")}”
          </p>
        </div>

        <div class="mb-4">
          <p class="text-xs font-black text-blue-600 mb-1">
            <i class="fa-solid fa-brain"></i> AI Insight
          </p>
          <p class="text-xs text-slate-500 leading-relaxed">
            ${escapeHtml(lead.ai_insight_summary || lead.aiInsightSummary || "ยังไม่มีข้อมูลวิเคราะห์")}
          </p>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100">
          <span class="text-[11px] text-slate-400">
            ${escapeHtml(lead.timestamp || "ล่าสุด")}
          </span>

          <div class="flex gap-2">
            <button 
              onclick="openChat(${lead.id})"
              class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
            >
              <i class="fa-solid fa-reply"></i> ตอบ
            </button>

            <button 
              onclick="moveLead(${lead.id})"
              class="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
            >
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="absolute left-4 right-4 top-4 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition z-20">
        <p class="font-bold mb-1">ข้อมูลติดต่อ</p>
        <p>โทร: ${escapeHtml(lead.phone || "ยังไม่มีข้อมูล")}</p>
        <p>Line: ${escapeHtml(lead.line_id || lead.lineId || "ยังไม่มีข้อมูล")}</p>
        <p>Email: ${escapeHtml(lead.email || "ยังไม่มีข้อมูล")}</p>
      </div>
    </article>
  `;
}

// ===============================
// 6) เปิด Modal ตอบลูกค้า
// ===============================
function openChat(id) {
  const lead = deepLeads.find((item) => item.id === id);
  if (!lead) return;

  currentLeadId = id;

  document.getElementById("chat-original-post").innerText =
    lead.original_text || lead.originalText || "";

  document.getElementById("chat-reply-text").value = generateReplyText(lead);

  const modal = document.getElementById("chat-modal");
  const content = document.getElementById("chat-modal-content");

  modal.classList.remove("hidden");

  setTimeout(() => {
    modal.classList.remove("opacity-0");
    content.classList.remove("scale-95");
    content.classList.add("scale-100");
  }, 10);
}

function closeChat() {
  const modal = document.getElementById("chat-modal");
  const content = document.getElementById("chat-modal-content");

  modal.classList.add("opacity-0");
  content.classList.remove("scale-100");
  content.classList.add("scale-95");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

// ===============================
// 7) ส่งข้อความ / บันทึกลง Supabase
// ===============================
async function sendReply() {
  const replyText = document.getElementById("chat-reply-text").value.trim();

  if (!replyText) {
    alert("กรุณาพิมพ์ข้อความตอบกลับก่อน");
    return;
  }

  if (!currentLeadId) {
    alert("ไม่พบ Lead ที่ต้องการตอบกลับ");
    return;
  }

  const { error } = await supabaseClient
    .from("deep_leads")
    .update({
      reply_text: replyText,
      status: "CONTACTED",
      has_new_reply: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentLeadId);

  if (error) {
    console.error("ส่งข้อความผิดพลาด:", error);
    alert("บันทึกข้อความไม่สำเร็จ");
    return;
  }

  closeChat();
  await loadLeads();
  alert("บันทึกข้อความตอบกลับแล้ว");
}

// ===============================
// 8) เลื่อนสถานะ Lead
// ===============================
async function moveLead(id) {
  const lead = deepLeads.find((item) => item.id === id);
  if (!lead) return;

  const currentStatus = lead.status || "NEW";
  const statusOrder = ["NEW", "CONTACTED", "QUOTED", "CLOSED"];
  const currentIndex = statusOrder.indexOf(currentStatus);
  const nextStatus = statusOrder[Math.min(currentIndex + 1, statusOrder.length - 1)];

  const { error } = await supabaseClient
    .from("deep_leads")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("อัปเดตสถานะผิดพลาด:", error);
    alert("อัปเดตสถานะไม่สำเร็จ");
    return;
  }

  await loadLeads();
}

// ===============================
// 9) Realtime เมื่อข้อมูลเปลี่ยน
// ===============================
function subscribeRealtime() {
  supabaseClient
    .channel("deep_leads_realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "deep_leads",
      },
      async () => {
        await loadLeads();
      }
    )
    .subscribe();
}

// ===============================
// 10) Helper
// ===============================
function updateStats() {
  document.getElementById("stat-total-leads").innerText = deepLeads.length;
}

function getProbabilityClass(value) {
  if (value >= 80) return "bg-green-600";
  if (value >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function getPlatformIcon(platform) {
  const value = String(platform || "").toLowerCase();

  if (value.includes("facebook")) return "fa-brands fa-facebook text-blue-600";
  if (value.includes("google")) return "fa-brands fa-google text-red-500";
  if (value.includes("line")) return "fa-brands fa-line text-green-500";
  if (value.includes("tiktok")) return "fa-brands fa-tiktok text-slate-800";

  return "fa-solid fa-globe text-slate-400";
}

function generateReplyText(lead) {
  const company = lead.company_name || lead.companyName || "คุณลูกค้า";

  return `สวัสดีครับ ${company}

ทางเรารับผลิตงานพิมพ์ สติ๊กเกอร์ ฉลากสินค้า และงานพิมพ์ด่วนครับ

จากรายละเอียดที่ลูกค้าแจ้งมา ทางเราสามารถช่วยดูสเปกงานและเสนอราคาที่เหมาะสมให้ได้ครับ
รบกวนขอข้อมูลเพิ่มเติมดังนี้ครับ

1. ขนาดงาน
2. จำนวนที่ต้องการ
3. วัสดุที่ต้องการใช้
4. ต้องการไดคัทหรือเคลือบเพิ่มเติมไหม
5. กำหนดวันรับงาน

ส่งข้อมูลมาได้เลยครับ เดี๋ยวผมประเมินราคาให้ครับ`;
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// จำลองตัวเลข packet/sec
setInterval(() => {
  const counter = document.getElementById("stream-counter");
  if (counter) {
    counter.innerText = Math.floor(Math.random() * 8) + 1;
  }
}, 1000);

// Start App
document.addEventListener("DOMContentLoaded", async () => {
  await loadLeads();
  subscribeRealtime();
});