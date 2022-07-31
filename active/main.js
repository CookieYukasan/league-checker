const form = document.querySelector("form");
const keyInput = document.querySelector("input#activeKey");
const submitButton = document.querySelector("button[type=submit]");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const key = keyInput.value;
  const url = `https://api.hydranetwork.org/auth/?type=activatekey&mdkey=${key}&hcaptcha=${hcaptcha.getResponse()}`;

  submitButton.disabled = true;
  submitButton.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>`;
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const text = data.status
        ? `${data.message} (${data.until})`
        : data.message;

      Toastify({
        text,
        className: data.status ? "success" : "warning",
        duration: 5000,
        style: {
          background: "var(--purple)",
        },
      }).showToast();

      hcaptcha.reset();
      submitButton.innerHTML = "Active";
      submitButton.disabled = false;
    });
});
