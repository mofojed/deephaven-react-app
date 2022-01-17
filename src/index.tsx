import React from "react";
import ReactDOM from "react-dom";

// Fira fonts are not necessary, but look the best
import "fira";

// Need to import the base style sheet for proper styling
import "@deephaven/components/dist/BaseStyleSheet.css";
import "./index.scss";
import App from "./App";

class DeephavenIrisGrid extends HTMLElement {
  connectedCallback() {
    const mountPoint = document.createElement("div");
    this.attachShadow({ mode: "open" }).appendChild(mountPoint);

    const name = this.getAttribute("name");
    ReactDOM.render(
      <App tableName={name !== null ? name : undefined}></App>,
      mountPoint
    );
  }
}
customElements.define("iris-grid", DeephavenIrisGrid);

export default DeephavenIrisGrid;
