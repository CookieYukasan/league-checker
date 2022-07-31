const savingKeyOnBrowser = true;

const createKeyButton = document.getElementById("createKey");
const deleteKeyButton = document.querySelector("button#deleteKey");
const copyKeyButton = document.querySelector(
  "#successCreatedKey button#copyKey"
);
const deleteKeyOpenModalButton = document.querySelector(
  "main button#deleteKey"
);
const secretKeyInput = document.querySelector("input#secretKey");
const keyTimeInput = document.querySelector("select#keyTime");
const keyServerInput = document.querySelector("select#keyServer");
const keyRoleInput = document.querySelector("select#keyRole");
const keyNotesTextarea = document.querySelector("textarea#keyNotes");
const modalKeyInput = document.querySelector("#successCreatedKey #yourKey");
const modalKeyTimeInput = document.querySelector(
  "#successCreatedKey #yourKeyTime"
);
const deleteKeySwitch = document.querySelector("#deleteKeySwitch");
const deleteKeyInput = document.querySelector(
  "#deleteKeyModal input#deleteKey"
);

const successModalInstance = new bootstrap.Modal(
  document.getElementById("successCreatedKey")
);
const deleteKeyModalInstance = new bootstrap.Modal(
  document.getElementById("deleteKeyModal")
);

deleteKeyOpenModalButton.addEventListener("click", () => {
  deleteKeyModalInstance.show();
});

deleteKeySwitch.addEventListener("change", (e) => {
  const isChecked = e.target.checked;
  deleteKeyButton.disabled = !isChecked;
});

copyKeyButton.addEventListener("click", () => {
  navigator.clipboard.writeText(modalKeyInput.value);
  successModalInstance.hide();
});

createKeyButton.addEventListener("click", async () => {
  const secretKey = secretKeyInput.value;
  const keyTime = keyTimeInput.value;
  const keyServer = keyServerInput.value;
  const keyRole = keyRoleInput.value;
  const keyNotes = keyNotesTextarea.value;

  if (!secretKey || !keyTime || !keyServer || !keyRole) {
    Toastify({
      text: "Please fill in all fields",
      className: "error",
      duration: 5000,
      style: {
        background: "var(--purple)",
      },
    }).showToast();
    return;
  }

  createKeyButton.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>`;

  const data = await createKey({
    secretKey: encodeURIComponent(secretKey),
    keyTime: encodeURIComponent(keyTime),
    keyRole: encodeURIComponent(keyRole),
    keyServer: encodeURIComponent(keyServer),
    keyNotes: encodeURIComponent(keyNotes),
  });

  createKeyButton.innerHTML = "Create key";

  if (!data.status) {
    Toastify({
      text: data.message,
      className: "error",
      duration: 5000,
      style: {
        background: "var(--purple)",
      },
    }).showToast();
    return;
  }

  modalKeyTimeInput.value = data.time.toLowerCase();
  modalKeyInput.value = data.key;
  successModalInstance.show();
});

deleteKeyButton.addEventListener("click", async (e) => {
  e.preventDefault();

  deleteKeyButton.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>`;
  const data = await deleteKey({
    secretKey: encodeURIComponent(secretKeyInput.value),
    userKey: encodeURIComponent(deleteKeyInput.value),
  });

  if (!data.status) {
    Toastify({
      text: data.message,
      className: "error",
      duration: 5000,
      style: {
        background: "var(--purple)",
      },
    }).showToast();
    deleteKeyButton.innerText = "Delete key";
    return;
  }

  deleteKeyButton.innerText = "Deleted";
  setTimeout(() => {
    deleteKeyModalInstance.hide();
  }, 3500);
  setTimeout(() => {
    deleteKeyButton.innerText = "Delete key";
    deleteKeyInput.value = "";
  }, 4000);
});

const createKey = async ({
  secretKey,
  keyTime,
  keyRole,
  keyServer,
  keyNotes,
}) => {
  const response = await fetch(
    `https://api.hydranetwork.org/auth/?type=addkey&time=${keyTime}&keyrole=${keyRole}&serverkey=${keyServer}&adminkey=${secretKey}${
      keyNotes ? `&notes=${keyNotes}` : ""
    }`
  );
  const data = await response.json();

  if (savingKeyOnBrowser && data.status) {
    localStorage.setItem("hydranetwork@key", secretKey);
  }

  return data;
};

const deleteKey = async ({ secretKey, userKey }) => {
  const response = await fetch(
    `https://api.hydranetwork.org/auth/?type=deletekey&adminkey=${secretKey}&mdkey=${userKey}`
  );
  const data = await response.json();

  return data;
};

(() => {
  if (savingKeyOnBrowser) {
    const key = localStorage.getItem("hydranetwork@key");
    if (key) {
      secretKeyInput.type = "password";
      secretKeyInput.value = key;

      secretKeyInput.addEventListener("input", (e) => {
        if (secretKeyInput.type === "password") {
          secretKeyInput.type = "text";
        }
      });
    }
  }
})();
