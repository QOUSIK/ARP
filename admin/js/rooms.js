const slugSel = document.getElementById("roomSlug");
const titleEl = document.getElementById("roomTitle");
const descEl = document.getElementById("roomDesc");
const imgEl = document.getElementById("roomImage");
const imgThumb = document.getElementById("imgThumb");
const fileEl = document.getElementById("imageFile");
const statusEl = document.getElementById("status");
const preview = document.getElementById("preview");

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  location.href = "login.html";
});

document.getElementById("loadBtn").addEventListener("click", loadRoom);
document.getElementById("saveBtn").addEventListener("click", saveRoom);
fileEl.addEventListener("change", uploadImage);
if (imgEl) imgEl.addEventListener("input", () => updateThumb(imgEl.value));

function updateThumb(url){
  if (!imgThumb) return;
  if (url && url.trim()){
    imgThumb.style.display = '';
    imgThumb.src = url;
    imgThumb.onerror = () => { imgThumb.style.display = 'none'; };
  } else {
    imgThumb.removeAttribute('src');
    imgThumb.style.display = 'none';
  }
}

async function loadRoom() {
  statusEl.textContent = "Loading...";
  try {
    const data = await API.api(`/rooms/${slugSel.value}`);
    titleEl.value = data.title || "";
    descEl.value = data.description || "";
    imgEl.value = data.image || "";
    preview.src = data.image || "";
    updateThumb(data.image || "");
    statusEl.textContent = "Loaded.";
  } catch (e) {
    statusEl.textContent = e.message;
  }
}

async function saveRoom() {
  statusEl.textContent = "Saving...";
  try {
    const payload = {
      title: titleEl.value,
      description: descEl.value,
      image: imgEl.value
    };
    const data = await API.api(`/rooms/${slugSel.value}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    statusEl.textContent = "Saved.";
    preview.src = data.image || "";
    updateThumb(data.image || "");
  } catch (e) {
    statusEl.textContent = e.message;
  }
}

async function uploadImage() {
  const file = fileEl.files[0];
  if (!file) return;
  statusEl.textContent = "Uploading...";
  try {
    const res = await API.apiUpload("/upload", file);
    imgEl.value = res.url;
    preview.src = res.url;
    updateThumb(res.url);
    statusEl.textContent = "Uploaded.";
  } catch (e) {
    statusEl.textContent = e.message;
  }
}
