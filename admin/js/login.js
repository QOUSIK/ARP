const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "Logging in...";
  try {
    const formData = new FormData(form);
    const email = formData.get("email");
    const password = formData.get("password");
    await API.api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    msg.textContent = "Success!";
    location.href = "index.html";
  } catch (err) {
    msg.textContent = err.message;
  }
});
