const PAIRING_ERRORS = {
  invalid_or_expired_code: "Código inválido ou expirado.",
  device_already_paired: "Este dispositivo já está pareado em outro grupo.",
};

const SYNC_ERRORS = {
  network_error: "Sem conexão com o servidor.",
  http_500: "Servidor indisponível. Tente novamente.",
  http_502: "Servidor indisponível. Tente novamente.",
  http_503: "Servidor indisponível. Tente novamente.",
  unknown_error: "Falha ao sincronizar.",
};

export function pairingErrorMessage(code) {
  return PAIRING_ERRORS[code] ?? "Não foi possível parear.";
}

export function syncErrorMessage(code) {
  return SYNC_ERRORS[code] ?? "Falha ao sincronizar.";
}
