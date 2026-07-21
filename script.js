const SECTION_CONFIG = {
  prescriptionDrugs: {
    fields: [
      { key: "drugName", type: "text", label: "Drug Name" },
      { key: "prescriptionDate", type: "date", label: "Prescription Date" },
      { key: "datePurchased", type: "date", label: "Date Purchased" },
      { key: "providerName", type: "text", label: "Healthcare Provider Name" },
      { key: "paidAmount", type: "amount", label: "Paid Amount" },
    ],
  },
  otcDrugs: {
    fields: [
      { key: "drugName", type: "text", label: "Drug Name" },
      { key: "datePurchased", type: "date", label: "Date Purchased" },
      { key: "paidAmount", type: "amount", label: "Paid Amount" },
      { key: "sellerName", type: "text", label: "Seller's Name" },
      { key: "reason", type: "text", label: "Reason for Purchasing" },
    ],
  },
  medicalSupplies: {
    fields: [
      { key: "itemPurchased", type: "text", label: "Item Purchased" },
      { key: "datePurchased", type: "date", label: "Date Purchased" },
      { key: "wasPrescribed", type: "select", label: "Was this Prescribed?", options: ["Yes", "No"] },
      { key: "providerName", type: "text", label: "Healthcare Provider Name" },
      { key: "paidAmount", type: "amount", label: "Paid Amount" },
      { key: "sellerName", type: "text", label: "Seller's Name" },
    ],
  },
  parking: {
    fields: [
      { key: "address", type: "text", label: "Address of Healthcare Provider/Medical Facility" },
      { key: "date", type: "date", label: "Date" },
      { key: "paidAmount", type: "amount", label: "Paid Amount" },
      { key: "meterUsed", type: "select", label: "Meter Used?", options: ["Yes", "No"] },
      { key: "meterNumber", type: "text", label: "Meter Number" },
    ],
  },
  mileage: {
    fields: [
      { key: "appointmentDate", type: "date", label: "Appointment Date" },
      { key: "providerAddress", type: "text", label: "Address of Healthcare Provider/Medical Facility" },
      { key: "workplaceAddress", type: "text", label: "Address of Workplace" },
      { key: "km", type: "number", label: "Number of km (Round Trip)" },
    ],
  },
  fare: {
    fields: [
      { key: "appointmentDate", type: "date", label: "Appointment Date" },
      { key: "startAddress", type: "text", label: "Address of Starting Point" },
      { key: "providerAddress", type: "text", label: "Address of Healthcare Provider/Medical Facility" },
      { key: "busOrTaxi", type: "select", label: "Bus or Taxi", options: ["Bus", "Taxi"] },
      { key: "totalFare", type: "amount", label: "Total Fare Paid" },
    ],
  },
};
 
const STORAGE_KEY = "wcbExpenseFormData";
 
/* ----------------------- 2. STATE ----------------------- */
// `state` mirrors the whole form. Shape:
// { claimNo, workerName, privacyAgree, sections: { prescriptionDrugs: [ {..row}, ... ], ... } }
let state = createEmptyState();
 
function createEmptyState() {
  const sections = {};
  Object.keys(SECTION_CONFIG).forEach((key) => (sections[key] = []));
  return {
    claimNo: "",
    workerName: "",
    privacyAgree: false,
    sections,
  };
}
 
// Makes a blank row object for a given section, e.g. { drugName: "", paidAmount: "" }
function createEmptyRow(sectionKey) {
  const row = {};
  SECTION_CONFIG[sectionKey].fields.forEach((f) => (row[f.key] = ""));
  return row;
}
 
/* ----------------------- 3. STORAGE ----------------------- */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  flashSaveStatus("Saved ✓");
}
 
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    // Merge carefully so we don't crash if the saved data is from
    // an older/different version of this form.
    state = { ...createEmptyState(), ...parsed };
    Object.keys(SECTION_CONFIG).forEach((key) => {
      if (!Array.isArray(state.sections[key])) state.sections[key] = [];
    });
  } catch (err) {
    console.error("Could not read saved data, starting fresh.", err);
    state = createEmptyState();
  }
}
 
let saveStatusTimeout = null;
function flashSaveStatus(message) {
  const el = document.getElementById("saveStatus");
  el.textContent = message;
  clearTimeout(saveStatusTimeout);
  saveStatusTimeout = setTimeout(() => (el.textContent = ""), 1500);
}
 
/* ----------------------- 4. RENDERING ----------------------- */
function renderAll() {
  document.getElementById("claimNo").value = state.claimNo;
  document.getElementById("workerName").value = state.workerName;
  document.getElementById("privacyAgree").checked = state.privacyAgree;
 
  Object.keys(SECTION_CONFIG).forEach(renderSection);
  updateTotal();
}
 
function renderSection(sectionKey) {
  const sectionEl = document.querySelector(`[data-section="${sectionKey}"]`);
  const tbody = sectionEl.querySelector("[data-rows]");
  const rows = state.sections[sectionKey];
  const fields = SECTION_CONFIG[sectionKey].fields;
 
  tbody.innerHTML = "";
 
  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.className = "empty-row-msg";
    td.colSpan = fields.length + 1;
    td.textContent = "No entries yet — click \u201cAdd\u201d below to add one.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
 
  rows.forEach((rowData, rowIndex) => {
    const tr = document.createElement("tr");
 
    fields.forEach((field) => {
      const td = document.createElement("td");
      td.dataset.label = field.label;
 
      let input;
      if (field.type === "select") {
        input = document.createElement("select");
        const blankOpt = document.createElement("option");
        blankOpt.value = "";
        blankOpt.textContent = "Select...";
        input.appendChild(blankOpt);
        field.options.forEach((opt) => {
          const o = document.createElement("option");
          o.value = opt;
          o.textContent = opt;
          input.appendChild(o);
        });
        input.value = rowData[field.key] || "";
      } else {
        input = document.createElement("input");
        input.type = field.type === "amount" ? "number" : field.type; // "amount" -> number input
        if (field.type === "amount") input.step = "0.01";
        input.value = rowData[field.key] || "";
      }
 
      input.addEventListener("input", (e) => {
        state.sections[sectionKey][rowIndex][field.key] = e.target.value;
        if (field.type === "amount") updateTotal();
        saveState();
      });
 
      td.appendChild(input);
      tr.appendChild(td);
    });
 
    // Remove-row button cell
    const removeTd = document.createElement("td");
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-row-btn";
    removeBtn.title = "Remove this row";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => {
      state.sections[sectionKey].splice(rowIndex, 1);
      renderSection(sectionKey);
      updateTotal();
      saveState();
    });
    removeTd.appendChild(removeBtn);
    tr.appendChild(removeTd);
 
    tbody.appendChild(tr);
  });
}
 
function updateTotal() {
  let total = 0;
  Object.keys(SECTION_CONFIG).forEach((sectionKey) => {
    const fields = SECTION_CONFIG[sectionKey].fields;
    const amountFields = fields.filter((f) => f.type === "amount").map((f) => f.key);
    state.sections[sectionKey].forEach((row) => {
      amountFields.forEach((key) => {
        const val = parseFloat(row[key]);
        if (!isNaN(val)) total += val;
      });
    });
  });
  document.getElementById("totalAmount").textContent = `$${total.toFixed(2)}`;
}
 
/* ----------------------- 5. EVENTS ----------------------- */
function wireUpEvents() {
  document.getElementById("claimNo").addEventListener("input", (e) => {
    state.claimNo = e.target.value;
    saveState();
  });
 
  document.getElementById("workerName").addEventListener("input", (e) => {
    state.workerName = e.target.value;
    saveState();
  });
 
  document.getElementById("privacyAgree").addEventListener("change", (e) => {
    state.privacyAgree = e.target.checked;
    saveState();
  });
 
  // One "+ Add" button per section
  document.querySelectorAll("[data-add]").forEach((btn) => {
    const sectionKey = btn.closest("[data-section]").dataset.section;
    btn.addEventListener("click", () => {
      state.sections[sectionKey].push(createEmptyRow(sectionKey));
      renderSection(sectionKey);
      saveState();
    });
  });
 
  document.getElementById("submitBtn").addEventListener("click", handleSubmit);
  document.getElementById("clearBtn").addEventListener("click", handleClear);
}
 
function handleSubmit() {
  if (!state.privacyAgree) {
    alert("Please check the Privacy Notice box before submitting.");
    return;
  }
  if (!state.workerName.trim()) {
    alert("Please enter the worker's name.");
    return;
  }
  saveState();
  // This demo form has nowhere real to send data, so we just confirm
  // to the user that everything is safely saved in this browser.
  alert(
    "Request saved!\n\n" +
    `Worker: ${state.workerName}\n` +
    `Claim No.: ${state.claimNo || "(none entered)"}\n` +
    `Total: ${document.getElementById("totalAmount").textContent}\n\n` +
    "(This demo only saves to your browser — connect it to a real backend to actually submit it.)"
  );
}
 
function handleClear() {
  const confirmed = confirm("This will permanently delete all saved form data. Continue?");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  state = createEmptyState();
  renderAll();
  flashSaveStatus("Cleared");
}
 
/* ----------------------- 6. INIT ----------------------- */
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  renderAll();
  wireUpEvents();
});