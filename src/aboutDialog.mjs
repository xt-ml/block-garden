import { showPrivacyDialog } from "./privacyDialog.mjs";

export class AboutDialog {
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

    const dialogId = "aboutDialog";
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
      const privacyContent = await (await fetch("about")).text();
      tmpDoc.innerHTML = privacyContent;

      dialog.innerHTML = tmpDoc.innerHTML;

      this.doc.body.appendChild(dialog);

      this.doc.getElementById("closeAboutDialog").removeAttribute("hidden");
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
    const closeBtn = this.dialog.querySelector("#closeAboutDialog");
    closeBtn.addEventListener("click", this.close);

    // Handle privacy policy link
    const privacyLink = this.dialog.querySelector("#privacyLinkInAbout");
    if (privacyLink) {
      privacyLink.addEventListener("click", (e) => {
        e.preventDefault();

        this.close();

        showPrivacyDialog(this.gThis);
      });
    }

    this.dialog.addEventListener("click", this.handleDialogClick);
  }

  removeEventListeners() {
    const closeBtn = this.dialog.querySelector("#closeAboutDialog");
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

async function showAboutDialog(gThis) {
  const aboutDialog = new AboutDialog(gThis);

  await aboutDialog.createDialog();
  aboutDialog.show();

  return aboutDialog;
}

export { showAboutDialog };
