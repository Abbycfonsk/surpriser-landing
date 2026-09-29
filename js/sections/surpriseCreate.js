import { createSurprise } from "../services/surpriseService.js";
import { state } from "../state/appState.js";

export async function initSurpriseCreate() {
  await waitForElement("cs_skill");

  renderSkillSelect();
  bindSkillPreview();
  initLocationSelects();
  initDeadlinePicker();
  bindCreateSurprise();
}
const locations = {
  España: {
    "A Coruña": ["A Coruña", "Santiago de Compostela", "Ferrol"],
    Alicante: ["Alicante", "Elche", "Benidorm"],
    Asturias: ["Oviedo", "Gijón", "Avilés"],
    Barcelona: ["Barcelona", "Hospitalet de Llobregat", "Badalona"],
    Cádiz: ["Cádiz", "Jerez de la Frontera", "Algeciras"],
    Girona: ["Girona", "Figueres", "Blanes"],
    Granada: ["Granada", "Motril", "Armilla"],
    Madrid: ["Madrid", "Alcalá de Henares", "Getafe", "Leganés"],
    Málaga: ["Málaga", "Marbella", "Fuengirola"],
    Murcia: ["Murcia", "Cartagena", "Lorca"],
    Sevilla: ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra"],
    Valencia: ["Valencia", "Torrent", "Gandía"],
    Zaragoza: ["Zaragoza", "Calatayud", "Utebo"],
  },
};

function initLocationSelects() {
  const countrySelect = document.getElementById("cs_country");
  const provinceSelect = document.getElementById("cs_province");
  const citySelect = document.getElementById("cs_city");

  if (!countrySelect || !provinceSelect || !citySelect) {
    console.error("No se encontraron los selectores de ubicación");
    return;
  }

  const countries = Object.keys(locations);

  countrySelect.innerHTML = `
    <option value="" selected disabled>
      País
    </option>
    ${countries
      .map(
        (country) => `
          <option value="${country}">
            ${country}
          </option>
        `,
      )
      .join("")}
  `;

  provinceSelect.innerHTML = `
    <option value="" selected disabled>
      Provincia
    </option>
  `;

  citySelect.innerHTML = `
    <option value="" selected disabled>
      Ciudad
    </option>
  `;

  provinceSelect.disabled = true;
  citySelect.disabled = true;

  countrySelect.onchange = () => {
    const country = countrySelect.value;
    const provinces = Object.keys(locations[country] || {});

    provinceSelect.innerHTML = `
      <option value="" selected disabled>
        Provincia
      </option>
      ${provinces
        .map(
          (province) => `
            <option value="${province}">
              ${province}
            </option>
          `,
        )
        .join("")}
    `;

    citySelect.innerHTML = `
      <option value="" selected disabled>
        Ciudad
      </option>
    `;

    provinceSelect.disabled = provinces.length === 0;
    citySelect.disabled = true;
  };

  provinceSelect.onchange = () => {
    const country = countrySelect.value;
    const province = provinceSelect.value;
    const cities = locations[country]?.[province] || [];

    citySelect.innerHTML = `
      <option value="" selected disabled>
        Ciudad
      </option>
      ${cities
        .map(
          (city) => `
            <option value="${city}">
              ${city}
            </option>
          `,
        )
        .join("")}
    `;

    citySelect.disabled = cities.length === 0;
  };
}
function initDeadlinePicker() {
  const input = document.getElementById("cs_deadline");
  if (!input) return;

  const today = new Date().toISOString().split("T")[0];
  input.min = today;

  input.addEventListener("click", () => {
    try {
      input.showPicker?.();
    } catch {
      // El navegador abrirá el selector nativo si puede.
    }
  });
}
function waitForElement(id) {
  return new Promise((resolve) => {
    const check = () => {
      const el = document.getElementById(id);
      if (el) return resolve(el);
      requestAnimationFrame(check);
    };
    check();
  });
}
/* =====================================================
   SKILLS
===================================================== */

export function renderSkillSelect() {
  const select = document.getElementById("cs_skill");

  if (!select) {
    console.error("No existe cs_skill");
    return;
  }

  select.innerHTML = '<option value="">Selecciona una categoría</option>';

  state.skills.forEach((skill) => {
    select.insertAdjacentHTML(
      "beforeend",
      `
      <option
        value="${skill.id}"
        data-category="${skill.category}"
        data-description="${skill.description}"
      >
        ${skill.name}
      </option>
      `,
    );
  });
}

function bindSkillPreview() {
  const select = document.getElementById("cs_skill");

  if (!select) return;

  select.onchange = () => {
    const option = select.selectedOptions[0];

    const category = document.getElementById("skill-category");
    const description = document.getElementById("skill-description");

    if (category) {
      category.textContent = option?.dataset?.category || "";
    }

    if (description) {
      description.textContent = option?.dataset?.description || "";
    }
  };
}

/* =====================================================
   CREATE SURPRISE
===================================================== */

function bindCreateSurprise() {
  const btn = document.querySelector('[data-action="create-surprise"]');

  if (!btn) return;

  btn.onclick = submitSurprise;
}

async function submitSurprise() {
  try {
    const title = document.getElementById("cs_title")?.value?.trim();
    const description = document.getElementById("cs_desc")?.value?.trim();
    const skillId = document.getElementById("cs_skill")?.value;
    const deadline = document.getElementById("cs_deadline")?.value;
    const size = document.getElementById("cs_size")?.value;

    if (!title) {
      alert("Introduce un título");
      return;
    }

    if (!skillId) {
      alert("Selecciona una categoría");
      return;
    }

    if (!deadline) {
      alert("Selecciona una fecha límite");
      return;
    }

    const formData = new FormData();

    formData.append("creator_id", state.user.id);

    formData.append("title", title);
    formData.append("description", description);
    formData.append("skill_id", skillId);
    formData.append("deadline", deadline);
    formData.append("size", size);

    const country = document.getElementById("cs_country")?.value;
    const province = document.getElementById("cs_province")?.value;
    const city = document.getElementById("cs_city")?.value;

    if (!country || !province || !city) {
      window.showNotificationToast?.({
        title: "Ubicación incompleta",
        message: "Selecciona país, provincia y ciudad.",
      });

      return;
    }
    if (country) {
      formData.append("target_country", country);
    }

    if (province) {
      formData.append("target_province", province);
    }

    if (city) {
      formData.append("target_city", city);
    }

    const imageInput = document.getElementById("cs_header_file");
    const image = imageInput?.files?.[0];

    if (image) {
      formData.append("header_image", image);
    }

    const result = await createSurprise(
      formData,
      localStorage.getItem("token"),
    );

    console.log(result);

    if (result.status === 200 || result.status === 201) {
      window.showNotificationToast?.({
        title: "Sorpresa creada",
        message: "Tu sorpresa ya está publicada y visible para los genios.",
      });
      window.loadOwnerSurprises?.();

      // Limpiar formulario

      document.getElementById("cs_title").value = "";
      document.getElementById("cs_desc").value = "";
      document.getElementById("cs_skill").value = "";
      document.getElementById("cs_deadline").value = "";
      document.getElementById("cs_size").value = "SMALL";

      document.getElementById("cs_country").value = "";
      document.getElementById("cs_province").value = "";
      document.getElementById("cs_city").value = "";

      document.getElementById("cs_header_file").value = "";

      const category = document.getElementById("skill-category");
      const description = document.getElementById("skill-description");

      if (category) {
        category.textContent = "Categoría general";
      }

      if (description) {
        description.textContent =
          "Selecciona una habilidad para ver la descripción.";
      }
    } else {
      console.error(result);

      window.showNotificationToast?.({
        title: "Error",
        message:
          result.json?.error ||
          result.json?.details ||
          "No se pudo crear la sorpresa.",
      });
    }
  } catch (error) {
    console.error(error);

    window.showNotificationToast?.({
      title: "Error",
      message: "Error al crear la sorpresa.",
    });
  }
}
