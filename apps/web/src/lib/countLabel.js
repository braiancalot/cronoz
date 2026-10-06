// Takes whole words: a suffix cannot build "configurações" from "configuração".
export function countLabel(count, { one, many }) {
  return `${count} ${count === 1 ? one : many}`;
}
