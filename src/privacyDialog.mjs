export class PrivacyDialog {
  constructor(gThis) {
    this.gThis = gThis;
    this.doc = gThis.document;
    this.dialog = null;

    this.close = this.close.bind(this);
    this.handleDialogClick = this.handleDialogClick.bind(this);
  }

  async createDialog() {
    if (this.dialog) {
      this.dialog.remove();
    }

    const dialogId = "privacyDialog";
    let dialog = this.doc.getElementById(dialogId);

    if (!dialog) {
      dialog = this.doc.createElement("dialog");
      dialog.id = dialogId;
      dialog.style.cssText = `
        background: #f0f0f0;
        border-radius: 0.5rem;
        border: 0.125rem solid #333;
        color: #333;
        font-family: monospace;
        max-height: 80vh;
        max-width: 50rem;
        overflow-y: auto;
        padding: 1.25rem;
        width: 90%;
      `;

      const tmpDoc = new Document();
      const privacyContent = await (await fetch("privacy")).text();
      tmpDoc.innerHTML = privacyContent;

      dialog.innerHTML = tmpDoc.innerHTML;

      this.doc.body.appendChild(dialog);
      this.doc.getElementById("closePrivacyDialog").removeAttribute("hidden");
    }

    this.dialog = dialog;
    this.setupEventListeners();

    return dialog;
  }

  handleDialogClick(e) {
    if (e.target === this.dialog) {
      this.close();
    }
  }

  setupEventListeners() {
    const closeBtn = this.dialog.querySelector("#closePrivacyDialog");
    closeBtn.addEventListener("click", this.close);
    this.dialog.addEventListener("click", this.handleDialogClick);
  }

  removeEventListeners() {
    const closeBtn = this.dialog.querySelector("#closePrivacyDialog");
    closeBtn.removeEventListener("click", this.close);
    this.dialog.removeEventListener("click", this.handleDialogClick);
  }

  show() {
    this.dialog.showModal();
  }

  close() {
    this.removeEventListeners();
    this.dialog.close();
  }
}

async function showPrivacyDialog(gThis) {
  const privacyDialog = new PrivacyDialog(gThis);

  await privacyDialog.createDialog();
  privacyDialog.show();

  return privacyDialog;
}

export { showPrivacyDialog };
