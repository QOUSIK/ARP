const ckey = document.getElementById("ckey");
const cvalue = document.getElementById("cvalue");
const cstatus = document.getElementById("cstatus");

// Consistent logout across pages
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    location.href = "login.html";
  });
}

document.getElementById("cLoad").addEventListener("click", loadKey);
document.getElementById("cSave").addEventListener("click", saveKey);

async function loadKey() {
  cstatus.textContent = "Loading...";
  try {
    const data = await API.api(`/content/${encodeURIComponent(ckey.value)}`);
    cvalue.value = data.value || "";
    cstatus.textContent = "Loaded.";
  } catch (e) {
    cstatus.textContent = e.message;
  }
}

async function saveKey() {
  cstatus.textContent = "Saving...";
  try {
    const data = await API.api(`/content/${encodeURIComponent(ckey.value)}`, {
      method: "PUT",
      body: JSON.stringify({ value: cvalue.value })
    });
    cstatus.textContent = "Saved.";
  } catch (e) {
    cstatus.textContent = e.message;
  }
}
