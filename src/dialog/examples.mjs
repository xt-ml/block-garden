export class ExamplesDialog {
  constructor(gThis) {
    this.gThis = gThis;
    this.doc = gThis.document;
    this.dialog = null;

    this.close = this.close.bind(this);
    this.handleDialogClick = this.handleDialogClick.bind(this);
  }

  async createDialog(part, path) {
    if (this.dialog) {
      this.dialog.remove();
    }

    const dialogClass = `${part}-content`;
    let dialog = this.doc.querySelector(`.${dialogClass}`);

    if (!dialog) {
      dialog = this.doc.createElement("dialog");
      dialog.setAttribute("class", `${dialogClass} sprite-garden`);

      const parser = new DOMParser();
      const documentText = await (await fetch(`${path}/${part}`)).text();
      const parsed = parser.parseFromString(documentText, "text/html");
      const content = parsed.querySelector(`.${dialogClass}`);

      dialog.innerHTML = content.innerHTML;

      this.doc.body.appendChild(dialog);
      this.doc
        .querySelector(`.${part}-content_close-btn`)
        .removeAttribute("hidden");
    }

    this.dialog = dialog;
    this.initEventListeners();

    return dialog;
  }

  handleDialogClick(e) {
    if (e.target === this.dialog) {
      this.close();
    }
  }

  initEventListeners() {
    const closeBtn = this.dialog.querySelector(".examples-content_close-btn");
    closeBtn.addEventListener("click", this.close);

    this.dialog.addEventListener("click", this.handleDialogClick);
  }

  removeEventListeners() {
    const closeBtn = this.dialog.querySelector(".examples-content_close-btn");
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

async function showExamplesDialog(gThis) {
  const examplesDialog = new ExamplesDialog(gThis);

  await examplesDialog.createDialog("examples", "src/api");
  examplesDialog.show();

  return examplesDialog;
}

export { showExamplesDialog };
