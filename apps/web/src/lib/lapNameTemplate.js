import { MAX_LAP_NAME_LENGTH } from "@cronoz/shared";

export const DEFAULT_LAP_NAME_TEMPLATE = "{n}º ";

function twoDigits(value) {
  return String(value).padStart(2, "0");
}

function tokenValues({ lapNumber, date }) {
  return {
    n: String(lapNumber),
    dia: twoDigits(date.getDate()),
    mes: twoDigits(date.getMonth() + 1),
    mês: twoDigits(date.getMonth() + 1),
    ano: String(date.getFullYear()),
  };
}

export function renderLapName({ template, lapNumber, date }) {
  const values = tokenValues({ lapNumber, date });
  const name = template.replace(/\{([^{}]+)\}/g, (token, key) =>
    Object.hasOwn(values, key) ? values[key] : token,
  );
  return name.slice(0, MAX_LAP_NAME_LENGTH);
}
