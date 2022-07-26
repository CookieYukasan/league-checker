/**
 * Project: HydraChecker
 * Author: https://ayo.so/cookie
 */

const keyInput = document.querySelector("#checkerKey");
const saveKeyButton = document.querySelector("#saveKey");
const startCheckerButton = document.querySelector("#startChecker");
const textArea = document.querySelector("#textArea");
const hideLivesTableButton = document.querySelector("#hideLivesTable");
const liveTableElement = document.querySelector("#liveTable");
const hideDieTableButton = document.querySelector("#hideDieTable");
const dieTableElement = document.querySelector("#dieTable");
const livesTbody = document.querySelector("#liveTable tbody");
const dieTbody = document.querySelector("#dieTable tbody");
const liveThsElements = document.querySelectorAll("#liveTable th");
const checkerStatusElement = document.querySelector("#checkerStatus");
const clearDuplicatedLinesButton = document.querySelector(
  "#clearDuplicatedLines"
);
const copyAllApprovedAccountsButton = document.querySelector(
  "#copyAllApprovedAccounts"
);
const copyAllApprovedAccountsCompleteButton = document.querySelector(
  "#copyAllApprovedAccountsComplete"
);
const clearApprovedAccountsButton = document.querySelector(
  "#clearApprovedAccounts"
);
const banCheckSwitchElement = document.querySelector("#banCheckSwitch");
const approvedCountLabel = document.querySelector("#approvedCount");
const approvedCountDiv = document.querySelector("#approvedCountDiv");
const rejectedCountDiv = document.querySelector("#rejectedCountDiv");
const totalCountLabel = document.querySelector("#totalCount");
const changeNickModal = new bootstrap.Modal(
  document.getElementById("changeNickModal")
);
const changeNickButton = document.querySelector("#changeNickButton");
const changeNickSwitch = document.querySelector(
  "#changeNickModal #changeNickSwitch"
);
let checker = new Checker();
let approvedCount = 0;
let rejectedCount = 0;
let tooltipList = [];
let filterType = null;
let filterValue = null;
const maxChkAccounts = 2000;

const itemsOrder = [
  "account",
  "nickname",
  "level",
  "rp",
  "be",
  "champions",
  "skins",
  "storeRefunds",
  "emailStatus",
  "lastlolMatch",
  "currentElo",
  "oldElo",
  "region",
  "isBanned",
];

const updateCountStatus = () => {
  approvedCountLabel.innerText = approvedCount;
  approvedCountDiv.innerText = approvedCount;
  rejectedCountDiv.innerText = rejectedCount;
  totalCountLabel.innerText = approvedCount + rejectedCount;
};

const copyToClipboard = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
};

const removeFirstLine = (text) => {
  const textLines = text.split("\n");
  textLines.shift();
  return textLines.join("\n");
};

const removeDuplicatedLines = (text) => {
  const lines = text.split("\n");
  const uniqueLines = [...new Set(lines)];
  return uniqueLines.join("\n");
};

const changeCheckerStatus = (newStatus) => {
  checkerStatusElement.innerHTML = "Status: " + newStatus;
};

const formatNumber = (value) => {
  if (value > 999) {
    return Math.sign(value) * (Math.abs(value) / 1000).toFixed(1) + "K";
  }
  return value;
};

const truncateText = (text, maxLength) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  return text;
};

const removeAllActiveTooltips = () => {
  const activeTooltips = document.querySelectorAll(".tooltip.show");
  activeTooltips.forEach((item) => {
    item.remove();
  });
};

const addAccountToTable = (data, tableType) => {
  const tr = document.createElement("tr");
  tr.className = "row100 body";
  const bannedRandomId = `banned-${Math.floor(Math.random() * 1000000)}`;
  const accountRandomId = `account-${Math.floor(Math.random() * 1000000)}`;
  const nicknameRandomId = `nick-${Math.floor(Math.random() * 1000000)}`;

  if (tableType === "live") {
    const lastMatchDate =
      data.lastlolMatch !== "INACTIVE"
        ? data.lastlolMatch.split(" ")[0]
        : "Inactive";

    itemsOrder.forEach((item, i) => {
      const columnName = `column${i + 1}`;
      if (item === "account") {
        tr.innerHTML += `<td class="cell100 ${columnName}" data-fullnick="${
          data.account
        }" onclick="copyAccountText(event)" data-bs-toggle="tooltip" id="${accountRandomId}" data-bs-placement="top" title="Click to copy account">${truncateText(
          data[item],
          14
        )}</td>`;
        return;
      }

      if (item === "nickname" && data.canChangeNick) {
        tr.innerHTML += `<td class="cell100 ${columnName}" cursor-pointer data-bs-toggle="tooltip" id="${nicknameRandomId}" data-bs-placement="top" title="Click to change nickname">${truncateText(
          data[item],
          14
        )}</td>`;
        return;
      }

      if (item === "lastlolMatch") {
        tr.innerHTML += `<td class="cell100 ${columnName}">${lastMatchDate}</td>`;
        return;
      }

      if (item === "be" || item === "champions") {
        tr.innerHTML += `<td class="cell100 ${columnName}">${formatNumber(
          data[item]
        )}</td>`;
        return;
      }

      if (item === "isBanned") {
        tr.innerHTML += `<td class="cell100 ${columnName}" data-bs-toggle="tooltip" id="${bannedRandomId}" data-bs-placement="left" title="${
          data.message
        }">${data.isBanned ? "Yes" : "No"}</td>`;
        return;
      }

      tr.innerHTML += `<td class="cell100 ${columnName}">${data[item]}</td>`;
    });

    return {
      trElement: tr,
      tooltipsIds: [accountRandomId, bannedRandomId, nicknameRandomId],
    };
  }

  if (tableType === "die") {
    tr.innerHTML = `
    <td class="cell100 column1">ERROR</td>
    <td class="cell100 column2">${data.account}</td>
    <td class="cell100 column3">${data.message}</td>
  `;
    //dieTbody.appendChild(tr);
    return {
      trElement: tr,
      tooltipsIds: [accountRandomId, bannedRandomId, nicknameRandomId],
    };
  }
};

const updateNickNameEventClick = (elementId, data) => {
  document.getElementById(elementId).addEventListener("click", () => {
    {
      const userAccountElement = document.querySelector(
        "#changeNickModal #userAccount"
      );
      userAccountElement.innerText = data.account;

      if (changeNickButton.disabled) {
        changeNickButton.innerHTML = `Change`;
        changeNickButton.disabled = false;
      }

      if (data.nickChangeType !== "ALL") {
        changeNickSwitch.checked = data.nickChangeType === "RP";
        changeNickSwitch.disabled = true;
      } else {
        changeNickSwitch.disabled = false;
      }

      changeNickModal.show();
    }
  });
};

const updateAccountTooltips = (idsArray) => {
  idsArray.forEach((id) => {
    updateTooltip(id);
  });
};

const copyAccountText = (event) => {
  copyToClipboard(event.target.dataset.fullnick);
  Toastify({
    text: "Account copied to clipboard",
    className: "success",
    duration: 3000,
    style: {
      background: "var(--purple)",
    },
  }).showToast();
};

const getKeyFromLocalStorage = () => {
  const key = localStorage.getItem("hncheckerlol@key");

  if (key) keyInput.value = key;
};

const saveKeyToLocalStorage = (key) =>
  localStorage.setItem("hncheckerlol@key", key);

const initEventListeners = () => {
  saveKeyButton.addEventListener("click", () => {
    saveKeyToLocalStorage(keyInput.value);
    saveKeyButton.innerHTML = "Key saved!";
    saveKeyButton.classList.add("font-green");

    setTimeout(() => {
      saveKeyButton.innerHTML = "Save key";
      saveKeyButton.classList.remove("font-green");
    }, 2000);
  });

  clearDuplicatedLinesButton.addEventListener(
    "click",
    () => (textArea.value = removeDuplicatedLines(textArea.value))
  );

  changeNickButton.addEventListener("click", async () => {
    if (!checker) return;
    const userAccount = document.querySelector(
      "#changeNickModal #userAccount"
    ).innerText;
    const newNick = document.querySelector("#changeNickModal #newNick").value;
    changeNickButton.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>`;
    const isSuccess = await checker.changeAccountNickname(
      userAccount,
      newNick,
      changeNickSwitch.checked ? "RP" : "BE"
    );

    if (isSuccess) {
      changeNickButton.innerHTML = `Changed`;
      changeNickButton.disabled = true;
    }
  });

  startCheckerButton.addEventListener("click", async () => {
    const key = keyInput.value;
    let list = textArea.value;

    if (key && list) {
      list = list.split("\n");
      if (list.length > maxChkAccounts) {
        Toastify({
          text: "You can't check more than " + maxChkAccounts + " accounts",
          className: "info",
          duration: 3000,
          style: {
            background: "var(--purple)",
          },
        }).showToast();
        return;
      }
      checker.setKey(key);
      checker.setList(list);
      checker.setBanCheck(banCheckSwitchElement.checked);
      checker.start();
    }
  });

  hideLivesTableButton.addEventListener("click", () => {
    const newDisplayValue =
      liveTableElement.style.display === "none" ? "block" : "none";

    hideLivesTableButton.innerHTML =
      newDisplayValue === "block" ? "Hide" : "Show";
    liveTableElement.style.display = newDisplayValue;
  });

  hideDieTableButton.addEventListener("click", () => {
    const newDisplayValue =
      dieTableElement.style.display === "none" ? "block" : "none";

    hideDieTableButton.innerHTML =
      newDisplayValue === "block" ? "Hide" : "Show";
    dieTableElement.style.display = newDisplayValue;
  });

  copyAllApprovedAccountsButton.addEventListener(
    "click",
    () => checker && checker.copyAllApprovedAccounts()
  );
  copyAllApprovedAccountsCompleteButton.addEventListener(
    "click",
    () => checker && checker.copyAllApprovedAccounts(true)
  );
  clearApprovedAccountsButton.addEventListener("click", () => {
    checker && checker.clearApprovedAccounts();
    approvedList = [];
  });
};

const updateTooltip = (tdId) => {
  var tooltipTriggerList = [].slice.call(document.querySelectorAll(`#${tdId}`));
  tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
};

const changeResultFilter = (e) => {
  if (checker && checker.getStartedStatus()) return;

  let filterType = e.target.innerText;
  if (filterType.includes("↓") || filterType.includes("↑")) {
    filterType = filterType.replaceAll("↓", "").replaceAll("↑", "");
  }

  if (checker.getFilterType() && checker.getFilterType() !== filterType) {
    clearCurrentFilter();
  }

  const allowedFilterTypes = [
    "rp",
    "be",
    "level",
    "champs",
    "skins",
    "refunds",
    "email verified",
  ];

  if (!allowedFilterTypes.includes(filterType.toLowerCase())) return;

  const filterValue = getNewFilterValue(e.target.dataset.filtervalue) || "down";
  checker.setFilterType(filterType);
  checker.setFilterValue(filterValue || "down");
  updateTextFilterByValue(filterValue, e.target);

  if (approvedList.length > 1) {
    checker.organizeTableByFilter();
  }
};

const clearCurrentFilter = () => {
  const el = document.querySelector(
    `[data-filtervalue="${checker.getFilterValue()}"]`
  );

  if (el) {
    checker.setFilterType(null);
    checker.setFilterValue(null);
    el.innerText = el.innerText.replaceAll("↓", "").replaceAll("↑", "");
    delete el.dataset.filtervalue;
  }
};

const getNewFilterValue = (value) => {
  if (value === "down") return "up";
  if (value === "up") return "down";
  return null;
};

const updateTextFilterByValue = (value, element) => {
  if (element && value)
    element.innerText = element.innerText
      .replaceAll("↓", "")
      .replaceAll("↑", "");
  switch (value) {
    case "down":
      element.innerText += "↓";
      element.dataset.filtervalue = "down";
      break;
    case "up":
      element.innerText += "↑";
      element.dataset.filtervalue = "up";
      break;
  }
};

(() => {
  initEventListeners();
  getKeyFromLocalStorage();
  var buyModal = new bootstrap.Modal(document.getElementById("exampleModal"));
  buyModal.show();

  document.querySelectorAll("th.cell100.cursor-pointer").forEach((element) => {
    element.addEventListener("click", changeResultFilter);
  });

  // document.addEventListener("contextmenu", (event) => event.preventDefault());

  // document.onkeydown = function (e) {
  //   // disable F12 key
  //   if (e.keyCode == 123) {
  //     return false;
  //   }

  //   // disable I key
  //   if (e.ctrlKey && e.shiftKey && e.keyCode == 73) {
  //     return false;
  //   }

  //   // disable J key
  //   if (e.ctrlKey && e.shiftKey && e.keyCode == 74) {
  //     return false;
  //   }

  //   // disable U key
  //   if (e.ctrlKey && e.keyCode == 85) {
  //     return false;
  //   }
  // };
})();
