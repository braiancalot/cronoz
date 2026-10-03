const PAIRING_ERRORS = {
  invalid_or_expired_code:
    "Código inválido ou expirado. Confira no outro dispositivo ou gere um novo.",
  device_already_paired: "Este dispositivo já está pareado em outro grupo.",
  too_many_new_groups: "Limite de pareamentos atingido. Tente em 1 hora.",
  network_error: "Sem conexão com o servidor.",
};

const SYNC_ERRORS = {
  network_error: "Falha ao sincronizar: sem conexão com o servidor.",
  http_500: "Falha ao sincronizar: servidor indisponível.",
  http_502: "Falha ao sincronizar: servidor indisponível.",
  http_503: "Falha ao sincronizar: servidor indisponível.",
  unknown_error: "Falha ao sincronizar.",
};

export function pairingErrorMessage(code) {
  return PAIRING_ERRORS[code] ?? "Não foi possível parear.";
}

export function syncErrorMessage(code) {
  return SYNC_ERRORS[code] ?? "Falha ao sincronizar.";
}
