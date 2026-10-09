#!/usr/bin/env bash
set -euo pipefail
set +x
read -r -p 'Telefone do administrador (9 dígitos): ' BANCADA_ADMIN_PHONE
read -r -s -p 'Senha do administrador (mínimo 12 caracteres): ' BANCADA_ADMIN_PASSWORD
printf '\n'
read -r -s -p 'Confirme a senha: ' BANCADA_ADMIN_CONFIRM
printf '\n'
if [[ "$BANCADA_ADMIN_PASSWORD" != "$BANCADA_ADMIN_CONFIRM" ]]; then
  printf 'As senhas não coincidem.\n' >&2
  exit 1
fi
export BANCADA_ADMIN_PHONE BANCADA_ADMIN_PASSWORD
node server.mjs --create-admin
unset BANCADA_ADMIN_PASSWORD BANCADA_ADMIN_CONFIRM
