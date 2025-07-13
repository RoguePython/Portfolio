// Smooth scrolling to main components
document.addEventListener('DOMContentLoaded', function() { 
    document.querySelectorAll('.navbar a').forEach(anchor => {
        anchor.addEventListener('click', function (scrollanimation) {
            scrollanimation.preventDefault();

            const targetId = this.getAttribute('href').substring(1); // Get the ID of the target section
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const offset = 50; // Adjust this value to set how much higher you want to scroll
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: elementPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// script.js

document.addEventListener("DOMContentLoaded", () => {
  const materialsList = document.getElementById("materials-list");
  const cutsList = document.getElementById("cuts-list");
  const addMaterialBtn = document.getElementById("add-material");
  const addCutBtn = document.getElementById("add-cut");
  const optimizeBtn = document.getElementById("optimize-btn");
  const canvasContainer = document.getElementById("canvas-container");
  const totalWaste = document.getElementById("total-waste");
  const materialUsed = document.getElementById("material-used");

  const materials = [];
  const cuts = [];

  function createMaterialInput() {
    const div = document.createElement("div");
    div.className = "material-item";
    div.innerHTML = `
      <input type="number" placeholder="Length" class="mat-length" />
      <input type="number" placeholder="Width" class="mat-width" />
      <input type="number" placeholder="Height" class="mat-height" />
      <input type="number" placeholder="Qty" class="mat-qty" />
      <button class="remove-material">Remove</button>
    `;
    materialsList.appendChild(div);

    div.querySelector(".remove-material").addEventListener("click", () => {
      div.remove();
    });
  }

  function createCutInput() {
    const div = document.createElement("div");
    div.className = "cut-item";
    div.innerHTML = `
      <input type="number" placeholder="Length" class="cut-length" />
      <input type="number" placeholder="Width" class="cut-width" />
      <input type="number" placeholder="Height" class="cut-height" />
      <input type="number" placeholder="Qty" class="cut-qty" />
      <button class="remove-cut">Remove</button>
    `;
    cutsList.appendChild(div);

    div.querySelector(".remove-cut").addEventListener("click", () => {
      div.remove();
    });
  }

  function collectData() {
    materials.length = 0;
    cuts.length = 0;

    document.querySelectorAll(".material-item").forEach(div => {
      const length = parseFloat(div.querySelector(".mat-length").value);
      const width = parseFloat(div.querySelector(".mat-width").value);
      const height = parseFloat(div.querySelector(".mat-height").value);
      const qty = parseInt(div.querySelector(".mat-qty").value);
      if (!isNaN(length) && !isNaN(width) && !isNaN(height) && !isNaN(qty)) {
        for (let i = 0; i < qty; i++) {
          materials.push({ length, width, height });
        }
      }
    });

    document.querySelectorAll(".cut-item").forEach(div => {
      const length = parseFloat(div.querySelector(".cut-length").value);
      const width = parseFloat(div.querySelector(".cut-width").value);
      const height = parseFloat(div.querySelector(".cut-height").value);
      const qty = parseInt(div.querySelector(".cut-qty").value);
      if (!isNaN(length) && !isNaN(width) && !isNaN(height) && !isNaN(qty)) {
        for (let i = 0; i < qty; i++) {
          cuts.push({ length, width, height });
        }
      }
    });
  }

  function simpleOptimize(materials, cuts) {
    const results = [];
    const unusedCuts = [...cuts];
    const usedMaterials = [];

    materials.forEach((mat, index) => {
      let remaining = mat.length;
      const fitCuts = [];

      for (let i = 0; i < unusedCuts.length; ) {
        if (unusedCuts[i].length <= remaining) {
          fitCuts.push(unusedCuts[i]);
          remaining -= unusedCuts[i].length;
          unusedCuts.splice(i, 1);
        } else {
          i++;
        }
      }

      if (fitCuts.length > 0) {
        usedMaterials.push({ index, fitCuts, waste: remaining });
      }
    });

    return usedMaterials;
  }

  function renderResults(results) {
    canvasContainer.innerHTML = "";
    let totalWasteVal = 0;

    results.forEach((res, i) => {
      const div = document.createElement("div");
      div.className = "material-visual";
      div.style.border = "1px solid #999";
      div.style.marginBottom = "1rem";
      div.style.padding = "0.5rem";

      let totalLength = res.fitCuts.reduce((sum, cut) => sum + cut.length, 0) + res.waste;

      div.innerHTML = `<strong>Material ${i + 1}</strong><br>`;

      res.fitCuts.forEach(cut => {
        const bar = document.createElement("div");
        bar.style.width = `${(cut.length / totalLength) * 100}%`;
        bar.style.height = "20px";
        bar.style.background = "#4caf50";
        bar.style.margin = "2px 0";
        bar.textContent = `${cut.length}`;
        bar.style.color = "white";
        bar.style.textAlign = "center";
        div.appendChild(bar);
      });

      if (res.waste > 0) {
        const wasteBar = document.createElement("div");
        wasteBar.style.width = `${(res.waste / totalLength) * 100}%`;
        wasteBar.style.height = "20px";
        wasteBar.style.background = "#ccc";
        wasteBar.textContent = `${res.waste} (waste)`;
        wasteBar.style.textAlign = "center";
        div.appendChild(wasteBar);
        totalWasteVal += res.waste;
      }

      canvasContainer.appendChild(div);
    });

    totalWaste.textContent = `Total Waste: ${totalWasteVal}`;
    materialUsed.textContent = `Materials Used: ${results.length}`;
  }

  addMaterialBtn.addEventListener("click", createMaterialInput);
  addCutBtn.addEventListener("click", createCutInput);
  optimizeBtn.addEventListener("click", () => {
    collectData();
    const results = simpleOptimize(materials, cuts);
    renderResults(results);
  });

  // Add one default row
  createMaterialInput();
  createCutInput();
});
