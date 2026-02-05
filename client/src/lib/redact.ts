const REDACT = '\u2022\u2022\u2022';

// IP addresses: 192.168.1.42 → •••
const IP_RE = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g;

// user@host patterns: root@myserver → •••@•••
const USER_AT_HOST_RE = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+/g;

// Home directory paths: /home/geraud/... → /home/•••/...
const HOME_PATH_RE = /(?:\/home\/|\/Users\/|C:\\Users\\)([a-zA-Z0-9._-]+)/g;

// FQDNs: server.example.com → •••  (must have 2+ dots, last segment 2-6 chars)
const FQDN_RE = /\b[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+\.[a-zA-Z]{2,6}\b/g;

// UNC/network paths: //server/share → //•••/share
const UNC_RE = /\/\/([a-zA-Z0-9._-]+)/g;

// Credentials: user:password (password starts with a letter, to avoid host:port)
const CREDENTIAL_RE = /\b([a-zA-Z0-9._-]+):([a-zA-Z][a-zA-Z0-9._!@#$%^&*-]*)\b/g;

// Password/token flag values: -p secret, --password=secret, --token xyz
const PASSWORD_FLAG_RE = /(-[uU]\s+|--user[=\s]|--password[=\s]|--token[=\s]|--secret[=\s]|--key[=\s])(\S+)/g;

export function redactSensitive(text: string): string {
  return text
    .replace(PASSWORD_FLAG_RE, `$1${REDACT}`)
    .replace(CREDENTIAL_RE, `${REDACT}:${REDACT}`)
    .replace(IP_RE, REDACT)
    .replace(HOME_PATH_RE, (_, _user) => _.replace(_user, REDACT))
    .replace(USER_AT_HOST_RE, `${REDACT}@${REDACT}`)
    .replace(FQDN_RE, REDACT)
    .replace(UNC_RE, `//${REDACT}`);
}
